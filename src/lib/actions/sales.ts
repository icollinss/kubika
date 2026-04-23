"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";


// Auto-generate sequential number e.g. SO/2026/001
async function generateNumber(prefix: string, companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count({ where: { companyId } });
  return `${prefix}/${year}/${String(count + 1).padStart(3, "0")}`;
}

async function generateInvoiceNumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { companyId } });
  return `FT/${year}/${String(count + 1).padStart(3, "0")}`;
}

// ─── Line helpers ─────────────────────────────────────────────────────────────

function computeLine(qty: number, unitPrice: number, discount: number, taxRate: number) {
  const subtotal = qty * unitPrice * (1 - discount / 100);
  const tax = subtotal * (taxRate / 100);
  return { subtotal, total: subtotal + tax };
}

function computeTotals(lines: { quantity: number; unitPrice: number; discount: number; taxRate: number }[]) {
  let subtotal = 0, taxAmount = 0;
  for (const l of lines) {
    const { subtotal: s, total: t } = computeLine(l.quantity, l.unitPrice, l.discount, l.taxRate);
    subtotal += s;
    taxAmount += t - s;
  }
  return { subtotal, taxAmount, discountAmount: 0, total: subtotal + taxAmount };
}

// ─── Sales Orders ─────────────────────────────────────────────────────────────

const lineSchema = z.object({
  productId: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0.001),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).default(14),
  sequence: z.coerce.number().default(0),
  analyticAccountId: z.string().optional(),
});

const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().optional(),
  expiryDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
  termsAndConds: z.string().optional(),
  lines: z.array(lineSchema).min(1, "At least one product line is required"),
});

export type SalesOrderFormData = z.infer<typeof orderSchema>;

export async function createSalesOrder(data: SalesOrderFormData) {
  const companyId = await getCompanyId();
  const parsed = orderSchema.parse(data);
  const number = await generateNumber("SO", companyId);

  const totals = computeTotals(parsed.lines);

  const order = await prisma.salesOrder.create({
    data: {
      number,
      customerId: parsed.customerId,
      orderDate: parsed.orderDate ? new Date(parsed.orderDate) : new Date(),
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
      deliveryDate: parsed.deliveryDate ? new Date(parsed.deliveryDate) : null,
      notes: parsed.notes,
      termsAndConds: parsed.termsAndConds,
      ...totals,
      companyId,
      lines: {
        create: parsed.lines.map((l, i) => {
          const { subtotal, total } = computeLine(l.quantity, l.unitPrice, l.discount, l.taxRate);
          return { ...l, subtotal, total, sequence: i };
        }),
      },
    },
  });

  revalidatePath("/dashboard/sales/orders");
  redirect(`/dashboard/sales/orders/${order.id}`);
}

export async function updateSalesOrder(id: string, data: SalesOrderFormData) {
  const companyId = await getCompanyId();
  const parsed = orderSchema.parse(data);
  const totals = computeTotals(parsed.lines);

  await prisma.salesOrderLine.deleteMany({ where: { orderId: id } });

  await prisma.salesOrder.update({
    where: { id, companyId },
    data: {
      customerId: parsed.customerId,
      orderDate: parsed.orderDate ? new Date(parsed.orderDate) : new Date(),
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
      deliveryDate: parsed.deliveryDate ? new Date(parsed.deliveryDate) : null,
      notes: parsed.notes,
      termsAndConds: parsed.termsAndConds,
      ...totals,
      lines: {
        create: parsed.lines.map((l, i) => {
          const { subtotal, total } = computeLine(l.quantity, l.unitPrice, l.discount, l.taxRate);
          return { ...l, subtotal, total, sequence: i };
        }),
      },
    },
  });

  revalidatePath("/dashboard/sales/orders");
  redirect(`/dashboard/sales/orders/${id}`);
}

export async function confirmOrder(id: string) {
  const companyId = await getCompanyId();
  await prisma.salesOrder.update({
    where: { id, companyId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath(`/dashboard/sales/orders/${id}`);
}

export async function cancelOrder(id: string) {
  const companyId = await getCompanyId();
  await prisma.salesOrder.update({
    where: { id, companyId },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/dashboard/sales/orders/${id}`);
}

export async function getSalesOrders(status?: string, search?: string) {
  const companyId = await getCompanyId();
  return prisma.salesOrder.findMany({
    where: {
      companyId,
      ...(status && status !== "ALL" ? { status: status as "QUOTATION" | "CONFIRMED" | "DELIVERED" | "CANCELLED" } : {}),
      ...(search ? {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      customer: { select: { name: true } },
      _count: { select: { lines: true, invoices: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSalesOrder(id: string) {
  const companyId = await getCompanyId();
  return prisma.salesOrder.findUnique({
    where: { id, companyId },
    include: {
      customer: true,
      lines: {
        include: { product: { select: { name: true, internalRef: true, uom: true } } },
        orderBy: { sequence: "asc" },
      },
      invoices: {
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function createInvoiceFromOrder(orderId: string) {
  const companyId = await getCompanyId();
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId, companyId },
    include: { lines: true },
  });
  if (!order) throw new Error("Order not found");

  const number = await generateInvoiceNumber(companyId);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice = await prisma.invoice.create({
    data: {
      number,
      orderId,
      customerId: order.customerId,
      invoiceDate: new Date(),
      dueDate,
      currency: order.currency,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      amountDue: order.total,
      companyId,
      lines: {
        create: order.lines.map((l, i) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          taxRate: l.taxRate,
          subtotal: l.subtotal,
          total: l.total,
          sequence: i,
        })),
      },
    },
  });

  await prisma.salesOrder.update({
    where: { id: orderId },
    data: { status: "CONFIRMED" },
  });

  revalidatePath(`/dashboard/sales/orders/${orderId}`);
  redirect(`/dashboard/sales/invoices/${invoice.id}`);
}

export async function getInvoices(status?: string) {
  const companyId = await getCompanyId();
  return prisma.invoice.findMany({
    where: {
      companyId,
      ...(status && status !== "ALL" ? { status: status as "DRAFT" | "CONFIRMED" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED" } : {}),
    },
    include: {
      customer: { select: { name: true } },
      payments: { select: { amount: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  const companyId = await getCompanyId();
  return prisma.invoice.findUnique({
    where: { id, companyId },
    include: {
      customer: true,
      lines: {
        include: { product: { select: { name: true, internalRef: true } } },
        orderBy: { sequence: "asc" },
      },
      payments: { orderBy: { paidAt: "desc" } },
      order: { select: { number: true } },
    },
  });
}

export async function confirmInvoice(id: string) {
  const companyId = await getCompanyId();
  await prisma.invoice.update({
    where: { id, companyId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath(`/dashboard/sales/invoices/${id}`);
}

// ─── Payments ─────────────────────────────────────────────────────────────────

const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.coerce.number().min(0.01),
  method: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHECK", "CREDIT"]).default("CASH"),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordPayment(data: z.infer<typeof paymentSchema>) {
  const companyId = await getCompanyId();
  const parsed = paymentSchema.parse(data);

  await prisma.payment.create({
    data: { ...parsed, paidAt: parsed.paidAt ? new Date(parsed.paidAt) : new Date(), companyId },
  });

  // Recalculate invoice paid/due amounts and status
  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.invoiceId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + parsed.amount;
  const amountDue = invoice.total - totalPaid;
  const status = amountDue <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : invoice.status;

  await prisma.invoice.update({
    where: { id: parsed.invoiceId },
    data: { amountPaid: totalPaid, amountDue: Math.max(0, amountDue), status },
  });

  revalidatePath(`/dashboard/sales/invoices/${parsed.invoiceId}`);
}

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";

async function getCompanyId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true },
  });
  if (!user?.companyId) throw new Error("No company found");
  return user.companyId;
}

async function generatePONumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count({ where: { companyId } });
  return `PO/${year}/${String(count + 1).padStart(3, "0")}`;
}

async function generateBillNumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.supplierBill.count({ where: { companyId } });
  return `VB/${year}/${String(count + 1).padStart(3, "0")}`;
}

function computeLine(qty: number, unitPrice: number, taxRate: number) {
  const subtotal = qty * unitPrice;
  const tax = subtotal * (taxRate / 100);
  return { subtotal, total: subtotal + tax };
}

function computeTotals(lines: { quantity: number; unitPrice: number; taxRate: number }[]) {
  let subtotal = 0, taxAmount = 0;
  for (const l of lines) {
    const { subtotal: s, total: t } = computeLine(l.quantity, l.unitPrice, l.taxRate);
    subtotal += s;
    taxAmount += t - s;
  }
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

const lineSchema = z.object({
  productId: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0.001),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).default(14),
  sequence: z.coerce.number().default(0),
});

const poSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "At least one line is required"),
});

export type PurchaseOrderFormData = z.infer<typeof poSchema>;

export async function createPurchaseOrder(data: PurchaseOrderFormData) {
  const companyId = await getCompanyId();
  const parsed = poSchema.parse(data);
  const number = await generatePONumber(companyId);
  const totals = computeTotals(parsed.lines);

  const order = await prisma.purchaseOrder.create({
    data: {
      number,
      supplierId: parsed.supplierId,
      orderDate: parsed.orderDate ? new Date(parsed.orderDate) : new Date(),
      expectedDate: parsed.expectedDate ? new Date(parsed.expectedDate) : null,
      notes: parsed.notes,
      ...totals,
      companyId,
      lines: {
        create: parsed.lines.map((l, i) => {
          const { subtotal, total } = computeLine(l.quantity, l.unitPrice, l.taxRate);
          return { ...l, subtotal, total, sequence: i };
        }),
      },
    },
  });

  revalidatePath("/dashboard/purchasing/orders");
  redirect(`/dashboard/purchasing/orders/${order.id}`);
}

export async function updatePurchaseOrder(id: string, data: PurchaseOrderFormData) {
  const companyId = await getCompanyId();
  const parsed = poSchema.parse(data);
  const totals = computeTotals(parsed.lines);

  await prisma.purchaseOrderLine.deleteMany({ where: { orderId: id } });
  await prisma.purchaseOrder.update({
    where: { id, companyId },
    data: {
      supplierId: parsed.supplierId,
      orderDate: parsed.orderDate ? new Date(parsed.orderDate) : new Date(),
      expectedDate: parsed.expectedDate ? new Date(parsed.expectedDate) : null,
      notes: parsed.notes,
      ...totals,
      lines: {
        create: parsed.lines.map((l, i) => {
          const { subtotal, total } = computeLine(l.quantity, l.unitPrice, l.taxRate);
          return { ...l, subtotal, total, sequence: i };
        }),
      },
    },
  });

  revalidatePath("/dashboard/purchasing/orders");
  redirect(`/dashboard/purchasing/orders/${id}`);
}

export async function confirmPurchaseOrder(id: string) {
  const companyId = await getCompanyId();
  await prisma.purchaseOrder.update({ where: { id, companyId }, data: { status: "CONFIRMED" } });
  revalidatePath(`/dashboard/purchasing/orders/${id}`);
}

export async function cancelPurchaseOrder(id: string) {
  const companyId = await getCompanyId();
  await prisma.purchaseOrder.update({ where: { id, companyId }, data: { status: "CANCELLED" } });
  revalidatePath(`/dashboard/purchasing/orders/${id}`);
}

export async function receiveGoods(id: string) {
  const companyId = await getCompanyId();

  const order = await prisma.purchaseOrder.findUnique({
    where: { id, companyId },
    include: { lines: true },
  });
  if (!order) throw new Error("Order not found");

  // Find or use default stock location
  const stockLoc = await prisma.location.findFirst({
    where: { companyId, locationType: "INTERNAL", name: "Stock" },
  });
  const vendorLoc = await prisma.location.findFirst({
    where: { companyId, locationType: "VENDOR" },
  });

  // Create stock moves for each line
  await prisma.$transaction(
    order.lines.map((line) =>
      prisma.stockMove.create({
        data: {
          productId: line.productId,
          fromLocationId: vendorLoc?.id ?? null,
          toLocationId: stockLoc?.id ?? null,
          quantity: line.quantity,
          unitCost: line.unitPrice,
          moveType: "RECEIPT",
          reference: order.number,
          companyId,
        },
      })
    )
  );

  await prisma.purchaseOrder.update({
    where: { id, companyId },
    data: { status: "RECEIVED" },
  });

  revalidatePath(`/dashboard/purchasing/orders/${id}`);
  revalidatePath("/dashboard/inventory/products");
}

export async function getPurchaseOrders(status?: string, search?: string) {
  const companyId = await getCompanyId();
  return prisma.purchaseOrder.findMany({
    where: {
      companyId,
      ...(status && status !== "ALL" ? { status: status as "DRAFT" | "CONFIRMED" | "RECEIVED" | "CANCELLED" } : {}),
      ...(search ? {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      supplier: { select: { name: true } },
      _count: { select: { lines: true, bills: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseOrder(id: string) {
  const companyId = await getCompanyId();
  return prisma.purchaseOrder.findUnique({
    where: { id, companyId },
    include: {
      supplier: true,
      lines: {
        include: { product: { select: { name: true, internalRef: true, uom: true } } },
        orderBy: { sequence: "asc" },
      },
      bills: {
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// ─── Supplier Bills ───────────────────────────────────────────────────────────

export async function createBillFromOrder(orderId: string) {
  const companyId = await getCompanyId();
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId, companyId },
    include: { lines: true },
  });
  if (!order) throw new Error("Order not found");

  const number = await generateBillNumber(companyId);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const bill = await prisma.supplierBill.create({
    data: {
      number,
      orderId,
      supplierId: order.supplierId,
      billDate: new Date(),
      dueDate,
      currency: order.currency,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      amountDue: order.total,
      companyId,
      lines: {
        create: order.lines.map((l, i) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          subtotal: l.subtotal,
          total: l.total,
          sequence: i,
        })),
      },
    },
  });

  revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
  redirect(`/dashboard/purchasing/bills/${bill.id}`);
}

export async function getBills(status?: string) {
  const companyId = await getCompanyId();
  return prisma.supplierBill.findMany({
    where: {
      companyId,
      ...(status && status !== "ALL" ? { status: status as "DRAFT" | "CONFIRMED" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED" } : {}),
    },
    include: {
      supplier: { select: { name: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBill(id: string) {
  const companyId = await getCompanyId();
  return prisma.supplierBill.findUnique({
    where: { id, companyId },
    include: {
      supplier: true,
      lines: {
        include: { product: { select: { name: true, internalRef: true } } },
        orderBy: { sequence: "asc" },
      },
      payments: { orderBy: { paidAt: "desc" } },
      order: { select: { number: true } },
    },
  });
}

export async function confirmBill(id: string) {
  const companyId = await getCompanyId();
  await prisma.supplierBill.update({ where: { id, companyId }, data: { status: "CONFIRMED" } });
  revalidatePath(`/dashboard/purchasing/bills/${id}`);
}

// ─── Bill Payments ────────────────────────────────────────────────────────────

const billPaymentSchema = z.object({
  billId: z.string(),
  amount: z.coerce.number().min(0.01),
  method: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHECK", "CREDIT"]).default("CASH"),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordBillPayment(data: z.infer<typeof billPaymentSchema>) {
  const companyId = await getCompanyId();
  const parsed = billPaymentSchema.parse(data);

  await prisma.billPayment.create({
    data: { ...parsed, paidAt: parsed.paidAt ? new Date(parsed.paidAt) : new Date(), companyId },
  });

  const bill = await prisma.supplierBill.findUnique({
    where: { id: parsed.billId },
    include: { payments: true },
  });
  if (!bill) throw new Error("Bill not found");

  const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0) + parsed.amount;
  const amountDue = bill.total - totalPaid;
  const status = amountDue <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : bill.status;

  await prisma.supplierBill.update({
    where: { id: parsed.billId },
    data: { amountPaid: totalPaid, amountDue: Math.max(0, amountDue), status },
  });

  revalidatePath(`/dashboard/purchasing/bills/${parsed.billId}`);
}

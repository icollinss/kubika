"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";


// ─── Credit settings ──────────────────────────────────────────────────────────

const creditSchema = z.object({
  creditLimit: z.coerce.number().min(0).default(0),
  creditTermsDays: z.coerce.number().min(0).max(365).default(30),
});

export async function updateCreditSettings(
  contactId: string,
  data: z.infer<typeof creditSchema>
) {
  const companyId = await getCompanyId();
  const parsed = creditSchema.parse(data);
  await prisma.contact.update({
    where: { id: contactId, companyId },
    data: parsed,
  });
  revalidatePath(`/dashboard/statements/customers/${contactId}`);
  revalidatePath(`/dashboard/statements/suppliers/${contactId}`);
}

// ─── Customer statement ────────────────────────────────────────────────────────

export async function getCustomerStatement(
  contactId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const companyId = await getCompanyId();

  const dateFilter = {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
  };

  const [contact, invoices, payments] = await Promise.all([
    prisma.contact.findUnique({ where: { id: contactId, companyId } }),
    prisma.invoice.findMany({
      where: {
        companyId,
        customerId: contactId,
        ...(Object.keys(dateFilter).length ? { invoiceDate: dateFilter } : {}),
      },
      orderBy: { invoiceDate: "asc" },
    }),
    prisma.payment.findMany({
      where: {
        companyId,
        invoice: { customerId: contactId },
        ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}),
      },
      include: { invoice: { select: { number: true } } },
      orderBy: { paidAt: "asc" },
    }),
  ]);

  if (!contact) throw new Error("Contact not found");

  type StatementRow = {
    date: Date;
    type: "invoice" | "payment";
    reference: string;
    description: string;
    debit: number;
    credit: number;
    dueDate: Date | null;
    status: string | null;
    balance: number;
  };

  const entries = [
    ...invoices.map((inv) => ({
      date: new Date(inv.invoiceDate),
      type: "invoice" as const,
      reference: inv.number,
      description: "Invoice",
      debit: inv.total,
      credit: 0,
      dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
      status: inv.status,
    })),
    ...payments.map((pay) => ({
      date: new Date(pay.paidAt),
      type: "payment" as const,
      reference: pay.reference ?? `Receipt`,
      description: `Payment on ${pay.invoice.number}`,
      debit: 0,
      credit: pay.amount,
      dueDate: null,
      status: null,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  const rows: StatementRow[] = entries.map((e) => {
    runningBalance += e.debit - e.credit;
    return { ...e, balance: runningBalance };
  });

  // Aging on current outstanding invoices (regardless of date filter)
  const outstanding = await prisma.invoice.findMany({
    where: {
      companyId,
      customerId: contactId,
      amountDue: { gt: 0 },
      status: { in: ["CONFIRMED", "PARTIAL", "OVERDUE"] },
    },
  });

  const today = new Date();
  const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  for (const inv of outstanding) {
    const due = inv.dueDate ? new Date(inv.dueDate) : null;
    const daysOverdue = due
      ? Math.floor((today.getTime() - due.getTime()) / 86400000)
      : 0;
    if (daysOverdue <= 0) aging.current += inv.amountDue;
    else if (daysOverdue <= 30) aging.days30 += inv.amountDue;
    else if (daysOverdue <= 60) aging.days60 += inv.amountDue;
    else if (daysOverdue <= 90) aging.days90 += inv.amountDue;
    else aging.over90 += inv.amountDue;
  }

  const totalOutstanding = Object.values(aging).reduce((s, v) => s + v, 0);
  const creditUsedPct =
    contact.creditLimit > 0
      ? Math.min(100, Math.round((totalOutstanding / contact.creditLimit) * 100))
      : null;

  return { contact, rows, aging, totalOutstanding, creditUsedPct };
}

// ─── Supplier statement ────────────────────────────────────────────────────────

export async function getSupplierStatement(
  contactId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const companyId = await getCompanyId();

  const dateFilter = {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
  };

  const [contact, bills, payments] = await Promise.all([
    prisma.contact.findUnique({ where: { id: contactId, companyId } }),
    prisma.supplierBill.findMany({
      where: {
        companyId,
        supplierId: contactId,
        ...(Object.keys(dateFilter).length ? { billDate: dateFilter } : {}),
      },
      orderBy: { billDate: "asc" },
    }),
    prisma.billPayment.findMany({
      where: {
        companyId,
        bill: { supplierId: contactId },
        ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}),
      },
      include: { bill: { select: { number: true } } },
      orderBy: { paidAt: "asc" },
    }),
  ]);

  if (!contact) throw new Error("Contact not found");

  const entries = [
    ...bills.map((b) => ({
      date: new Date(b.billDate),
      type: "bill" as const,
      reference: b.number,
      description: "Supplier Bill",
      debit: 0,
      credit: b.total,
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      status: b.status,
    })),
    ...payments.map((pay) => ({
      date: new Date(pay.paidAt),
      type: "payment" as const,
      reference: pay.reference ?? "Payment",
      description: `Payment on ${pay.bill.number}`,
      debit: pay.amount,
      credit: 0,
      dueDate: null,
      status: null,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  const rows = entries.map((e) => {
    runningBalance += e.credit - e.debit; // for suppliers: credit = what we owe
    return { ...e, balance: runningBalance };
  });

  const outstanding = await prisma.supplierBill.findMany({
    where: {
      companyId,
      supplierId: contactId,
      amountDue: { gt: 0 },
      status: { in: ["CONFIRMED", "PARTIAL", "OVERDUE"] },
    },
  });

  const today = new Date();
  const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  for (const bill of outstanding) {
    const due = bill.dueDate ? new Date(bill.dueDate) : null;
    const daysOverdue = due
      ? Math.floor((today.getTime() - due.getTime()) / 86400000)
      : 0;
    if (daysOverdue <= 0) aging.current += bill.amountDue;
    else if (daysOverdue <= 30) aging.days30 += bill.amountDue;
    else if (daysOverdue <= 60) aging.days60 += bill.amountDue;
    else if (daysOverdue <= 90) aging.days90 += bill.amountDue;
    else aging.over90 += bill.amountDue;
  }

  const totalOutstanding = Object.values(aging).reduce((s, v) => s + v, 0);

  return { contact, rows, aging, totalOutstanding };
}

// ─── Overview & aging reports ─────────────────────────────────────────────────

export async function getReceivablesSummary() {
  const companyId = await getCompanyId();

  const invoices = await prisma.invoice.findMany({
    where: {
      companyId,
      amountDue: { gt: 0 },
      status: { in: ["CONFIRMED", "PARTIAL", "OVERDUE"] },
    },
    include: { customer: { select: { id: true, name: true, creditLimit: true } } },
  });

  const today = new Date();
  const customerMap = new Map<
    string,
    {
      name: string;
      creditLimit: number;
      current: number;
      days30: number;
      days60: number;
      days90: number;
      over90: number;
      total: number;
    }
  >();

  for (const inv of invoices) {
    const entry = customerMap.get(inv.customerId) ?? {
      name: inv.customer.name,
      creditLimit: inv.customer.creditLimit,
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0,
      total: 0,
    };

    const daysOverdue = inv.dueDate
      ? Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86400000)
      : 0;

    if (daysOverdue <= 0) entry.current += inv.amountDue;
    else if (daysOverdue <= 30) entry.days30 += inv.amountDue;
    else if (daysOverdue <= 60) entry.days60 += inv.amountDue;
    else if (daysOverdue <= 90) entry.days90 += inv.amountDue;
    else entry.over90 += inv.amountDue;
    entry.total += inv.amountDue;

    customerMap.set(inv.customerId, entry);
  }

  return Array.from(customerMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);
}

export async function getPayablesSummary() {
  const companyId = await getCompanyId();

  const bills = await prisma.supplierBill.findMany({
    where: {
      companyId,
      amountDue: { gt: 0 },
      status: { in: ["CONFIRMED", "PARTIAL", "OVERDUE"] },
    },
    include: { supplier: { select: { id: true, name: true } } },
  });

  const today = new Date();
  const supplierMap = new Map<
    string,
    { name: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }
  >();

  for (const bill of bills) {
    const entry = supplierMap.get(bill.supplierId) ?? {
      name: bill.supplier.name,
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0,
      total: 0,
    };

    const daysOverdue = bill.dueDate
      ? Math.floor((today.getTime() - new Date(bill.dueDate).getTime()) / 86400000)
      : 0;

    if (daysOverdue <= 0) entry.current += bill.amountDue;
    else if (daysOverdue <= 30) entry.days30 += bill.amountDue;
    else if (daysOverdue <= 60) entry.days60 += bill.amountDue;
    else if (daysOverdue <= 90) entry.days90 += bill.amountDue;
    else entry.over90 += bill.amountDue;
    entry.total += bill.amountDue;

    supplierMap.set(bill.supplierId, entry);
  }

  return Array.from(supplierMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);
}

// Contacts with any outstanding balance (for statement list pages)
export async function getContactsWithBalance(type: "CUSTOMER" | "SUPPLIER") {
  const companyId = await getCompanyId();

  if (type === "CUSTOMER") {
    const contacts = await prisma.contact.findMany({
      where: {
        companyId,
        type: { in: ["CUSTOMER", "BOTH"] },
        invoices: { some: { amountDue: { gt: 0 } } },
      },
      include: {
        invoices: {
          where: { status: { in: ["CONFIRMED", "PARTIAL", "OVERDUE"] } },
          select: { amountDue: true, total: true, dueDate: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return contacts.map((c) => {
      const totalDue = c.invoices.reduce((s, i) => s + i.amountDue, 0);
      const overdue = c.invoices
        .filter((i) => i.dueDate && new Date(i.dueDate) < new Date())
        .reduce((s, i) => s + i.amountDue, 0);
      return { ...c, totalDue, overdue };
    });
  } else {
    const contacts = await prisma.contact.findMany({
      where: {
        companyId,
        type: { in: ["SUPPLIER", "BOTH"] },
        supplierBills: { some: { amountDue: { gt: 0 } } },
      },
      include: {
        supplierBills: {
          where: { status: { in: ["CONFIRMED", "PARTIAL", "OVERDUE"] } },
          select: { amountDue: true, total: true, dueDate: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return contacts.map((c) => {
      const totalDue = c.supplierBills.reduce((s, b) => s + b.amountDue, 0);
      const overdue = c.supplierBills
        .filter((b) => b.dueDate && new Date(b.dueDate) < new Date())
        .reduce((s, b) => s + b.amountDue, 0);
      return { ...c, totalDue, overdue };
    });
  }
}

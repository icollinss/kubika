"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";


// ─── Revenue summary ──────────────────────────────────────────────────────────

export async function getRevenueSummary() {
  const companyId = await getCompanyId();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [invoicesThisMonth, invoicesLastMonth, outstanding, totalRevenue] = await Promise.all([
    prisma.invoice.aggregate({
      where: { companyId, status: "PAID", createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId, status: "PAID", createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId, status: { in: ["CONFIRMED", "PARTIAL"] } },
      _sum: { amountDue: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { companyId, status: "PAID" },
      _sum: { total: true },
    }),
  ]);

  return {
    thisMonth: invoicesThisMonth._sum.total ?? 0,
    lastMonth: invoicesLastMonth._sum.total ?? 0,
    outstanding: outstanding._sum.amountDue ?? 0,
    outstandingCount: outstanding._count,
    totalRevenue: totalRevenue._sum.total ?? 0,
  };
}

// ─── Expenses summary ─────────────────────────────────────────────────────────

export async function getExpensesSummary() {
  const companyId = await getCompanyId();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const [billsThisMonth, pendingBills, totalExpenses] = await Promise.all([
    prisma.supplierBill.aggregate({
      where: { companyId, status: "PAID", createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      _sum: { total: true },
    }),
    prisma.supplierBill.aggregate({
      where: { companyId, status: { in: ["CONFIRMED", "PARTIAL"] } },
      _sum: { amountDue: true },
      _count: true,
    }),
    prisma.supplierBill.aggregate({
      where: { companyId, status: "PAID" },
      _sum: { total: true },
    }),
  ]);

  return {
    thisMonth: billsThisMonth._sum.total ?? 0,
    pendingAmount: pendingBills._sum.amountDue ?? 0,
    pendingCount: pendingBills._count,
    totalExpenses: totalExpenses._sum.total ?? 0,
  };
}

// ─── Monthly revenue (last 6 months) ─────────────────────────────────────────

export async function getMonthlyRevenue() {
  const companyId = await getCompanyId();
  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));

  const results = await Promise.all(
    months.map(async (month) => {
      const agg = await prisma.invoice.aggregate({
        where: {
          companyId,
          status: "PAID",
          createdAt: { gte: startOfMonth(month), lte: endOfMonth(month) },
        },
        _sum: { total: true },
      });
      return {
        month: format(month, "MMM"),
        revenue: agg._sum.total ?? 0,
      };
    })
  );

  return results;
}

// ─── Top customers ────────────────────────────────────────────────────────────

export async function getTopCustomers(limit = 5) {
  const companyId = await getCompanyId();
  const invoices = await prisma.invoice.findMany({
    where: { companyId, status: "PAID" },
    include: { customer: { select: { name: true } } },
  });

  const map = new Map<string, { name: string; total: number; count: number }>();
  for (const inv of invoices) {
    const existing = map.get(inv.customerId) ?? { name: inv.customer?.name ?? "Unknown", total: 0, count: 0 };
    map.set(inv.customerId, { name: existing.name, total: existing.total + inv.total, count: existing.count + 1 });
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ─── Top products ─────────────────────────────────────────────────────────────

export async function getTopProducts(limit = 5) {
  const companyId = await getCompanyId();
  const lines = await prisma.invoiceLine.findMany({
    where: { invoice: { companyId, status: "PAID" } },
    include: { product: { select: { name: true } } },
  });

  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const line of lines) {
    if (!line.productId) continue;
    const existing = map.get(line.productId) ?? { name: line.product?.name ?? line.description, qty: 0, revenue: 0 };
    map.set(line.productId, {
      name: existing.name,
      qty: existing.qty + line.quantity,
      revenue: existing.revenue + line.subtotal,
    });
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ─── HR snapshot ─────────────────────────────────────────────────────────────

export async function getHrSnapshot() {
  const companyId = await getCompanyId();
  const [employeeCount, activePayslips] = await Promise.all([
    prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.payslip.aggregate({
      where: { companyId, status: "PAID" },
      _sum: { netSalary: true },
    }),
  ]);
  return { employeeCount, totalPayroll: activePayslips._sum?.netSalary ?? 0 };
}

// ─── POS snapshot ─────────────────────────────────────────────────────────────

export async function getPosSnapshot() {
  const companyId = await getCompanyId();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);

  const [orderCount, revenue] = await Promise.all([
    prisma.posOrder.count({ where: { companyId, createdAt: { gte: thisMonthStart } } }),
    prisma.posOrder.aggregate({
      where: { companyId, createdAt: { gte: thisMonthStart } },
      _sum: { total: true },
    }),
  ]);

  return { orderCount, revenue: revenue._sum.total ?? 0 };
}

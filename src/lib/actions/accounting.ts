"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";

async function getCompanyId(): Promise<string> {
  const session = await getServerSession(authConfig);
  if (!session?.user?.companyId) throw new Error("Unauthorized");
  return session.user.companyId;
}

async function nextJournalNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.journalEntry.count({
    where: { companyId, number: { startsWith: `JE/${year}/` } },
  });
  return `JE/${year}/${String(count + 1).padStart(4, "0")}`;
}

// ─── Chart of Accounts ───────────────────────────────────────────────────────

export async function getAccounts() {
  const companyId = await getCompanyId();
  return prisma.ledgerAccount.findMany({
    where: { companyId, isActive: true },
    orderBy: { code: "asc" },
  });
}

export async function createAccount(data: {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  subtype?: string;
  description?: string;
  parentId?: string;
}) {
  const companyId = await getCompanyId();
  const account = await prisma.ledgerAccount.create({
    data: { ...data, companyId },
  });
  revalidatePath("/dashboard/accounting");
  return account;
}

export async function updateAccount(id: string, data: {
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  const companyId = await getCompanyId();
  const account = await prisma.ledgerAccount.update({
    where: { id, companyId },
    data,
  });
  revalidatePath("/dashboard/accounting");
  return account;
}

// ─── Journal Entries ──────────────────────────────────────────────────────────

export async function getJournalEntries(filters?: { status?: string; from?: string; to?: string }) {
  const companyId = await getCompanyId();
  const where: Record<string, unknown> = { companyId };
  if (filters?.status) where.status = filters.status;
  if (filters?.from || filters?.to) {
    where.date = {};
    if (filters.from) (where.date as Record<string, unknown>).gte = new Date(filters.from);
    if (filters.to) (where.date as Record<string, unknown>).lte = new Date(filters.to);
  }
  return prisma.journalEntry.findMany({
    where,
    include: { lines: { include: { debitAccount: true, creditAccount: true } } },
    orderBy: { date: "desc" },
  });
}

export async function getJournalEntry(id: string) {
  const companyId = await getCompanyId();
  return prisma.journalEntry.findFirst({
    where: { id, companyId },
    include: { lines: { include: { debitAccount: true, creditAccount: true }, orderBy: { sequence: "asc" } } },
  });
}

export async function createJournalEntry(data: {
  date?: string;
  description: string;
  reference?: string;
  lines: Array<{
    debitAccountId?: string;
    creditAccountId?: string;
    amount: number;
    description?: string;
  }>;
}) {
  const companyId = await getCompanyId();
  const number = await nextJournalNumber(companyId);

  const entry = await prisma.journalEntry.create({
    data: {
      number,
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description,
      reference: data.reference,
      companyId,
      lines: {
        create: data.lines.map((l, i) => ({
          debitAccountId: l.debitAccountId || null,
          creditAccountId: l.creditAccountId || null,
          amount: l.amount,
          description: l.description,
          sequence: i,
        })),
      },
    },
    include: { lines: true },
  });
  revalidatePath("/dashboard/accounting/journal");
  return entry;
}

export async function postJournalEntry(id: string) {
  const companyId = await getCompanyId();
  const entry = await prisma.journalEntry.update({
    where: { id, companyId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/dashboard/accounting/journal");
  return entry;
}

// ─── General Ledger ───────────────────────────────────────────────────────────

export async function getLedger(accountId: string) {
  const companyId = await getCompanyId();
  const account = await prisma.ledgerAccount.findFirst({ where: { id: accountId, companyId } });
  if (!account) throw new Error("Account not found");

  const debits = await prisma.journalEntryLine.findMany({
    where: { debitAccountId: accountId, entry: { companyId, status: "CONFIRMED" } },
    include: { entry: true },
    orderBy: { entry: { date: "asc" } },
  });
  const credits = await prisma.journalEntryLine.findMany({
    where: { creditAccountId: accountId, entry: { companyId, status: "CONFIRMED" } },
    include: { entry: true },
    orderBy: { entry: { date: "asc" } },
  });

  return { account, debits, credits };
}

// ─── P&L Report ───────────────────────────────────────────────────────────────

export async function getProfitAndLoss(from: string, to: string) {
  const companyId = await getCompanyId();
  const accounts = await prisma.ledgerAccount.findMany({
    where: { companyId, type: { in: ["REVENUE", "EXPENSE"] }, isActive: true },
    include: {
      debitLines: {
        where: { entry: { companyId, status: "CONFIRMED", date: { gte: new Date(from), lte: new Date(to) } } },
      },
      creditLines: {
        where: { entry: { companyId, status: "CONFIRMED", date: { gte: new Date(from), lte: new Date(to) } } },
      },
    },
    orderBy: { code: "asc" },
  });

  const revenue: Array<{ code: string; name: string; balance: number }> = [];
  const expenses: Array<{ code: string; name: string; balance: number }> = [];

  for (const acc of accounts) {
    const credits = acc.creditLines.reduce((s, l) => s + l.amount, 0);
    const debits = acc.debitLines.reduce((s, l) => s + l.amount, 0);
    const balance = acc.type === "REVENUE" ? credits - debits : debits - credits;
    if (balance === 0) continue;
    const row = { code: acc.code, name: acc.name, balance };
    if (acc.type === "REVENUE") revenue.push(row);
    else expenses.push(row);
  }

  const totalRevenue = revenue.reduce((s, r) => s + r.balance, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0);
  const netProfit = totalRevenue - totalExpenses;

  return { revenue, expenses, totalRevenue, totalExpenses, netProfit };
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

export async function getBalanceSheet(asOf: string) {
  const companyId = await getCompanyId();
  const accounts = await prisma.ledgerAccount.findMany({
    where: { companyId, type: { in: ["ASSET", "LIABILITY", "EQUITY"] }, isActive: true },
    include: {
      debitLines: {
        where: { entry: { companyId, status: "CONFIRMED", date: { lte: new Date(asOf) } } },
      },
      creditLines: {
        where: { entry: { companyId, status: "CONFIRMED", date: { lte: new Date(asOf) } } },
      },
    },
    orderBy: { code: "asc" },
  });

  const assets: Array<{ code: string; name: string; balance: number }> = [];
  const liabilities: Array<{ code: string; name: string; balance: number }> = [];
  const equity: Array<{ code: string; name: string; balance: number }> = [];

  for (const acc of accounts) {
    const debits = acc.debitLines.reduce((s, l) => s + l.amount, 0);
    const credits = acc.creditLines.reduce((s, l) => s + l.amount, 0);
    // Assets: normal debit balance; Liabilities/Equity: normal credit balance
    const balance = acc.type === "ASSET" ? debits - credits : credits - debits;
    if (balance === 0) continue;
    const row = { code: acc.code, name: acc.name, balance };
    if (acc.type === "ASSET") assets.push(row);
    else if (acc.type === "LIABILITY") liabilities.push(row);
    else equity.push(row);
  }

  const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
  const totalEquity = equity.reduce((s, r) => s + r.balance, 0);

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
}

// ─── Tax Summary ──────────────────────────────────────────────────────────────

export async function getTaxSummary(period: string) {
  const companyId = await getCompanyId();
  return prisma.taxEntry.findMany({
    where: { companyId, period },
    orderBy: { createdAt: "asc" },
  });
}

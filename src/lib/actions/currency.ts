"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";


async function getCompany() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
    include: { company: true },
  });
  return user.company;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getExchangeRates() {
  const companyId = await getCompanyId();
  return prisma.exchangeRate.findMany({
    where: { companyId },
    orderBy: { fromCurrency: "asc" },
  });
}

export async function getLatestRatesMap() {
  const companyId = await getCompanyId();
  const rates = await prisma.exchangeRate.findMany({ where: { companyId } });
  const map: Record<string, number> = {};
  for (const r of rates) {
    map[r.fromCurrency] = r.rate;
  }
  return map;
}

// ─── Upsert (create or update) ────────────────────────────────────────────────

export async function upsertExchangeRate(fromCurrency: string, rate: number) {
  const company = await getCompany();
  if (!company) throw new Error("No company");

  const toCurrency = company.currency; // base currency

  if (fromCurrency === toCurrency) {
    throw new Error("Cannot set an exchange rate for the base currency.");
  }

  await prisma.exchangeRate.upsert({
    where: {
      fromCurrency_toCurrency_companyId: {
        fromCurrency,
        toCurrency,
        companyId: company.id,
      },
    },
    create: {
      fromCurrency,
      toCurrency,
      rate,
      companyId: company.id,
    },
    update: {
      rate,
      effectiveDate: new Date(),
    },
  });

  revalidatePath("/dashboard/accounting/currencies");
}

export async function deleteExchangeRate(id: string) {
  const companyId = await getCompanyId();
  await prisma.exchangeRate.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/accounting/currencies");
}

// ─── Company base currency ────────────────────────────────────────────────────

export async function updateBaseCurrency(currency: string) {
  const company = await getCompany();
  if (!company) throw new Error("No company");

  await prisma.company.update({
    where: { id: company.id },
    data: { currency },
  });

  revalidatePath("/dashboard/accounting/currencies");
  revalidatePath("/dashboard/company");
}

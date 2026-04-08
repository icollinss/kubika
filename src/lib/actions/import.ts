"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getCompanyId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
  if (!user.companyId) throw new Error("No company");
  return user.companyId;
}

export type ImportRow = Record<string, string>;

export type ImportResult = {
  success: number;
  errors: { row: number; message: string }[];
};

// ─── Import Contacts ──────────────────────────────────────────────────────────

export async function importContacts(rows: ImportRow[]): Promise<ImportResult> {
  const companyId = await getCompanyId();
  let success = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row["name"] ?? row["Name"] ?? row["nome"] ?? row["Nome"] ?? "";
    if (!name.trim()) {
      errors.push({ row: i + 2, message: "Name is required" });
      continue;
    }

    const rawType = (row["type"] ?? row["Type"] ?? row["tipo"] ?? "CUSTOMER").toUpperCase();
    const type = ["CUSTOMER", "SUPPLIER", "BOTH"].includes(rawType) ? rawType as "CUSTOMER" | "SUPPLIER" | "BOTH" : "CUSTOMER";

    try {
      await prisma.contact.create({
        data: {
          name: name.trim(),
          email: (row["email"] ?? row["Email"] ?? "").trim() || undefined,
          phone: (row["phone"] ?? row["Phone"] ?? row["telefone"] ?? "").trim() || undefined,
          whatsapp: (row["whatsapp"] ?? row["WhatsApp"] ?? "").trim() || undefined,
          address: (row["address"] ?? row["Address"] ?? row["endereco"] ?? "").trim() || undefined,
          city: (row["city"] ?? row["City"] ?? row["cidade"] ?? "").trim() || undefined,
          country: (row["country"] ?? row["Country"] ?? row["pais"] ?? "Angola").trim(),
          taxId: (row["taxId"] ?? row["taxid"] ?? row["nif"] ?? row["NIF"] ?? "").trim() || undefined,
          notes: (row["notes"] ?? row["Notes"] ?? row["notas"] ?? "").trim() || undefined,
          type,
          companyId,
        },
      });
      success++;
    } catch (e: unknown) {
      errors.push({ row: i + 2, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  revalidatePath("/dashboard/contacts");
  return { success, errors };
}

// ─── Import Products ──────────────────────────────────────────────────────────

export async function importProducts(rows: ImportRow[]): Promise<ImportResult> {
  const companyId = await getCompanyId();
  let success = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row["name"] ?? row["Name"] ?? row["nome"] ?? row["Nome"] ?? "";
    if (!name.trim()) {
      errors.push({ row: i + 2, message: "Name is required" });
      continue;
    }

    const rawType = (row["type"] ?? row["Type"] ?? row["tipo"] ?? "STORABLE").toUpperCase();
    const productType = ["STORABLE", "CONSUMABLE", "SERVICE"].includes(rawType) ? rawType as "STORABLE" | "CONSUMABLE" | "SERVICE" : "STORABLE";

    const salePrice = parseFloat(row["salePrice"] ?? row["salesprice"] ?? row["price"] ?? row["Price"] ?? row["preco"] ?? "0") || 0;
    const costPrice = parseFloat(row["costPrice"] ?? row["costprice"] ?? row["cost"] ?? row["Cost"] ?? row["custo"] ?? "0") || 0;

    try {
      await prisma.product.create({
        data: {
          name: name.trim(),
          internalRef: (row["ref"] ?? row["Ref"] ?? row["internalRef"] ?? row["sku"] ?? row["SKU"] ?? "").trim() || undefined,
          description: (row["description"] ?? row["Description"] ?? row["descricao"] ?? "").trim() || undefined,
          productType,
          salePrice,
          costPrice,
          companyId,
        },
      });
      success++;
    } catch (e: unknown) {
      errors.push({ row: i + 2, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  revalidatePath("/dashboard/inventory/products");
  return { success, errors };
}

// ─── Import Leads (CRM) ───────────────────────────────────────────────────────

export async function importLeads(rows: ImportRow[]): Promise<ImportResult> {
  const companyId = await getCompanyId();
  let success = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row["name"] ?? row["Name"] ?? row["nome"] ?? "";
    if (!name.trim()) {
      errors.push({ row: i + 2, message: "Name is required" });
      continue;
    }

    const rawSource = (row["source"] ?? row["Source"] ?? row["origem"] ?? "MANUAL").toUpperCase();
    const validSources = ["FACEBOOK","INSTAGRAM","LINKEDIN","TIKTOK","YOUTUBE","WHATSAPP","WEBSITE","REFERRAL","MANUAL","OTHER"];
    const source = (validSources.includes(rawSource) ? rawSource : "MANUAL") as "FACEBOOK"|"INSTAGRAM"|"LINKEDIN"|"TIKTOK"|"YOUTUBE"|"WHATSAPP"|"WEBSITE"|"REFERRAL"|"MANUAL"|"OTHER";

    try {
      await prisma.lead.create({
        data: {
          name: name.trim(),
          email: (row["email"] ?? "").trim() || undefined,
          phone: (row["phone"] ?? "").trim() || undefined,
          whatsapp: (row["whatsapp"] ?? "").trim() || undefined,
          company: (row["company"] ?? row["empresa"] ?? "").trim() || undefined,
          jobTitle: (row["jobTitle"] ?? row["job"] ?? row["cargo"] ?? "").trim() || undefined,
          source,
          status: "NEW",
          notes: (row["notes"] ?? "").trim() || undefined,
          companyId,
        },
      });
      success++;
    } catch (e: unknown) {
      errors.push({ row: i + 2, message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  revalidatePath("/dashboard/crm");
  return { success, errors };
}

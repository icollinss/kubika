"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Angola"),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]).default("CUSTOMER"),
});

export type ContactFormData = z.infer<typeof contactSchema>;


export async function createContact(data: ContactFormData) {
  const companyId = await getCompanyId();
  const parsed = contactSchema.parse(data);

  await prisma.contact.create({
    data: { ...parsed, companyId },
  });

  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function updateContact(id: string, data: ContactFormData) {
  const companyId = await getCompanyId();
  const parsed = contactSchema.parse(data);

  await prisma.contact.update({
    where: { id, companyId },
    data: parsed,
  });

  revalidatePath("/dashboard/contacts");
  redirect(`/dashboard/contacts/${id}`);
}

export async function deleteContact(id: string) {
  const companyId = await getCompanyId();

  await prisma.contact.delete({
    where: { id, companyId },
  });

  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function getContacts(search?: string, type?: string) {
  const companyId = await getCompanyId();

  return prisma.contact.findMany({
    where: {
      companyId,
      ...(type && type !== "ALL" ? { type: type as "CUSTOMER" | "SUPPLIER" | "BOTH" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContact(id: string) {
  const companyId = await getCompanyId();
  return prisma.contact.findUnique({
    where: { id, companyId },
    include: {
      salesOrders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, status: true, total: true, createdAt: true },
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
        select: { id: true, number: true, status: true, total: true, amountDue: true, invoiceDate: true, dueDate: true },
      },
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, status: true, total: true, createdAt: true },
      },
      supplierBills: {
        orderBy: { billDate: "desc" },
        select: { id: true, number: true, status: true, total: true, amountDue: true, billDate: true },
      },
      serviceOrders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, status: true, createdAt: true },
      },
    },
  });
}

export async function addContactNote(id: string, note: string) {
  const companyId = await getCompanyId();
  const contact = await prisma.contact.findFirstOrThrow({ where: { id, companyId } });
  await prisma.contact.update({
    where: { id },
    data: { notes: contact.notes ? `${contact.notes}\n\n${note}` : note },
  });
  revalidatePath(`/dashboard/contacts/${id}`);
}

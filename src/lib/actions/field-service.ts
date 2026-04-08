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

async function generateServiceNumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.serviceOrder.count({ where: { companyId } });
  return `SVC/${year}/${String(count + 1).padStart(3, "0")}`;
}

// ─── Worksheet Templates ──────────────────────────────────────────────────────

export async function getWorksheetTemplates() {
  const companyId = await getCompanyId();
  return prisma.worksheetTemplate.findMany({
    where: { companyId },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWorksheetTemplate(name: string, fields: unknown[]) {
  const companyId = await getCompanyId();
  await prisma.worksheetTemplate.create({
    data: { name, fields: fields as never, companyId },
  });
  revalidatePath("/dashboard/field-service/worksheets");
}

export async function updateWorksheetTemplate(id: string, name: string, fields: unknown[]) {
  const companyId = await getCompanyId();
  await prisma.worksheetTemplate.update({
    where: { id, companyId },
    data: { name, fields: fields as never },
  });
  revalidatePath("/dashboard/field-service/worksheets");
}

export async function deleteWorksheetTemplate(id: string) {
  const companyId = await getCompanyId();
  await prisma.worksheetTemplate.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/field-service/worksheets");
}

// ─── Service Orders ────────────────────────────────────────────────────────────

const serviceOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  technicianId: z.string().optional(),
  scheduledAt: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  worksheetId: z.string().optional(),
  notes: z.string().optional(),
});

export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;

export async function createServiceOrder(data: ServiceOrderFormData) {
  const companyId = await getCompanyId();
  const parsed = serviceOrderSchema.parse(data);
  const number = await generateServiceNumber(companyId);

  const order = await prisma.serviceOrder.create({
    data: {
      number,
      title: parsed.title,
      description: parsed.description,
      customerId: parsed.customerId,
      technicianId: parsed.technicianId || null,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      address: parsed.address,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      priority: parsed.priority,
      worksheetId: parsed.worksheetId || null,
      notes: parsed.notes,
      companyId,
    },
  });

  revalidatePath("/dashboard/field-service");
  redirect(`/dashboard/field-service/${order.id}`);
}

export async function updateServiceOrder(id: string, data: ServiceOrderFormData) {
  const companyId = await getCompanyId();
  const parsed = serviceOrderSchema.parse(data);

  await prisma.serviceOrder.update({
    where: { id, companyId },
    data: {
      title: parsed.title,
      description: parsed.description,
      customerId: parsed.customerId,
      technicianId: parsed.technicianId || null,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      address: parsed.address,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      priority: parsed.priority,
      worksheetId: parsed.worksheetId || null,
      notes: parsed.notes,
    },
  });

  revalidatePath(`/dashboard/field-service/${id}`);
  revalidatePath("/dashboard/field-service");
  redirect(`/dashboard/field-service/${id}`);
}

export async function updateServiceOrderStatus(id: string, status: string) {
  const companyId = await getCompanyId();
  const extra: Record<string, Date> = {};
  if (status === "IN_PROGRESS") extra.startedAt = new Date();
  if (status === "COMPLETED") extra.completedAt = new Date();
  await prisma.serviceOrder.update({
    where: { id, companyId },
    data: { status: status as "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED", ...extra },
  });
  revalidatePath(`/dashboard/field-service/${id}`);
}

export async function saveWorksheetData(id: string, worksheetData: Record<string, unknown>, signature?: string) {
  const companyId = await getCompanyId();
  await prisma.serviceOrder.update({
    where: { id, companyId },
    data: {
      worksheetData: worksheetData as never,
      ...(signature !== undefined ? { signature } : {}),
    },
  });
  revalidatePath(`/dashboard/field-service/${id}`);
}

export async function addServicePart(orderId: string, productId: string, quantity: number, unitCost: number) {
  const companyId = await getCompanyId();
  await prisma.serviceOrder.findUniqueOrThrow({ where: { id: orderId, companyId } });
  await prisma.servicePart.create({ data: { orderId, productId, quantity, unitCost } });
  revalidatePath(`/dashboard/field-service/${orderId}`);
}

export async function removeServicePart(partId: string) {
  const companyId = await getCompanyId();
  const part = await prisma.servicePart.findUniqueOrThrow({
    where: { id: partId },
    include: { order: { select: { companyId: true, id: true } } },
  });
  if (part.order.companyId !== companyId) throw new Error("Not found");
  await prisma.servicePart.delete({ where: { id: partId } });
  revalidatePath(`/dashboard/field-service/${part.orderId}`);
}

export async function getServiceOrders(status?: string, search?: string) {
  const companyId = await getCompanyId();
  return prisma.serviceOrder.findMany({
    where: {
      companyId,
      ...(status && status !== "ALL"
        ? { status: status as "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { number: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { name: true } },
      technician: { select: { firstName: true, lastName: true } },
      _count: { select: { parts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getServiceOrder(id: string) {
  const companyId = await getCompanyId();
  return prisma.serviceOrder.findUnique({
    where: { id, companyId },
    include: {
      customer: true,
      technician: true,
      worksheet: true,
      parts: {
        include: { product: { select: { name: true, internalRef: true, salePrice: true } } },
      },
    },
  });
}

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

// ─── Warehouses ───────────────────────────────────────────────────────────────

const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortCode: z.string().min(1, "Short code is required").max(5).toUpperCase(),
  address: z.string().optional(),
});

export async function getWarehouses() {
  const companyId = await getCompanyId();
  return prisma.warehouse.findMany({
    where: { companyId },
    include: { _count: { select: { locations: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getWarehouse(id: string) {
  const companyId = await getCompanyId();
  return prisma.warehouse.findUnique({
    where: { id, companyId },
    include: {
      locations: { orderBy: { name: "asc" } },
    },
  });
}

export async function createWarehouse(data: z.infer<typeof warehouseSchema>) {
  const companyId = await getCompanyId();
  const parsed = warehouseSchema.parse(data);
  const warehouse = await prisma.warehouse.create({
    data: { ...parsed, companyId },
  });

  // Auto-create default locations
  const defaults = [
    { name: "Stock", locationType: "INTERNAL" as const, fullPath: `${parsed.shortCode}/Stock` },
    { name: "Input", locationType: "INTERNAL" as const, fullPath: `${parsed.shortCode}/Input` },
    { name: "Output", locationType: "INTERNAL" as const, fullPath: `${parsed.shortCode}/Output` },
  ];
  for (const loc of defaults) {
    await prisma.location.create({ data: { ...loc, warehouseId: warehouse.id, companyId } });
  }

  revalidatePath("/dashboard/inventory/warehouses");
  redirect(`/dashboard/inventory/warehouses/${warehouse.id}`);
}

export async function updateWarehouse(id: string, data: z.infer<typeof warehouseSchema>) {
  const companyId = await getCompanyId();
  const parsed = warehouseSchema.parse(data);
  await prisma.warehouse.update({ where: { id, companyId }, data: parsed });
  revalidatePath("/dashboard/inventory/warehouses");
  redirect(`/dashboard/inventory/warehouses/${id}`);
}

export async function deleteWarehouse(id: string) {
  const companyId = await getCompanyId();
  await prisma.warehouse.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/inventory/warehouses");
  redirect("/dashboard/inventory/warehouses");
}

// ─── Locations ────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  locationType: z.enum(["INTERNAL", "VENDOR", "CUSTOMER", "VIRTUAL", "TRANSIT"]).default("INTERNAL"),
  warehouseId: z.string().optional(),
  parentId: z.string().optional(),
  fullPath: z.string().optional(),
});

export async function getLocations(type?: string) {
  const companyId = await getCompanyId();
  return prisma.location.findMany({
    where: {
      companyId,
      ...(type ? { locationType: type as "INTERNAL" | "VENDOR" | "CUSTOMER" | "VIRTUAL" | "TRANSIT" } : {}),
    },
    include: { warehouse: true, parent: true },
    orderBy: { fullPath: "asc" },
  });
}

export async function createLocation(data: z.infer<typeof locationSchema>) {
  const companyId = await getCompanyId();
  const parsed = locationSchema.parse(data);
  await prisma.location.create({ data: { ...parsed, companyId } });
  revalidatePath("/dashboard/inventory/warehouses");
}

export async function deleteLocation(id: string) {
  const companyId = await getCompanyId();
  await prisma.location.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/inventory/warehouses");
}

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

// ─── Units of Measure ────────────────────────────────────────────────────────

export async function getUoms() {
  const companyId = await getCompanyId();
  return prisma.unitOfMeasure.findMany({
    where: { companyId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

// ─── Product Categories ───────────────────────────────────────────────────────

export async function getCategories() {
  const companyId = await getCompanyId();
  return prisma.productCategory.findMany({
    where: { companyId },
    include: { parent: true, children: true },
    orderBy: { name: "asc" },
  });
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const companyId = await getCompanyId();
  const parsed = categorySchema.parse(data);
  await prisma.productCategory.create({
    data: { ...parsed, companyId },
  });
  revalidatePath("/dashboard/inventory/categories");
}

export async function deleteCategory(id: string) {
  const companyId = await getCompanyId();
  await prisma.productCategory.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/inventory/categories");
  redirect("/dashboard/inventory/categories");
}

// ─── Products ────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  internalRef: z.string().optional(),
  salePrice: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  categoryId: z.string().optional(),
  productType: z.enum(["STORABLE", "CONSUMABLE", "SERVICE"]).default("STORABLE"),
  trackingType: z.enum(["NONE", "LOT", "SERIAL"]).default("NONE"),
  costingMethod: z.enum(["STANDARD_PRICE", "AVERAGE_COST", "FIFO"]).default("AVERAGE_COST"),
  uomId: z.string().optional(),
  purchaseUomId: z.string().optional(),
  reorderPoint: z.coerce.number().min(0).default(0),
  reorderQty: z.coerce.number().min(0).default(0),
  leadTimeDays: z.coerce.number().min(0).default(0),
  canBeSold: z.boolean().default(true),
  canBePurchased: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

export async function createProduct(data: ProductFormData) {
  const companyId = await getCompanyId();
  const parsed = productSchema.parse(data);
  const product = await prisma.product.create({
    data: { ...parsed, companyId },
  });
  revalidatePath("/dashboard/inventory/products");
  redirect(`/dashboard/inventory/products/${product.id}`);
}

export async function updateProduct(id: string, data: ProductFormData) {
  const companyId = await getCompanyId();
  const parsed = productSchema.parse(data);
  await prisma.product.update({
    where: { id, companyId },
    data: parsed,
  });
  revalidatePath("/dashboard/inventory/products");
  revalidatePath(`/dashboard/inventory/products/${id}`);
  redirect(`/dashboard/inventory/products/${id}`);
}

export async function archiveProduct(id: string) {
  const companyId = await getCompanyId();
  await prisma.product.update({
    where: { id, companyId },
    data: { isArchived: true },
  });
  revalidatePath("/dashboard/inventory/products");
  redirect("/dashboard/inventory/products");
}

export async function getProducts(search?: string, categoryId?: string, type?: string) {
  const companyId = await getCompanyId();
  return prisma.product.findMany({
    where: {
      companyId,
      isArchived: false,
      ...(categoryId ? { categoryId } : {}),
      ...(type && type !== "ALL" ? { productType: type as "STORABLE" | "CONSUMABLE" | "SERVICE" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
              { internalRef: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      uom: true,
      _count: { select: { lots: true, serials: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(id: string) {
  const companyId = await getCompanyId();
  return prisma.product.findUnique({
    where: { id, companyId },
    include: {
      category: true,
      uom: true,
      purchaseUom: true,
      variants: { include: { lines: { include: { value: { include: { attribute: true } } } } } },
      lots: { orderBy: { createdAt: "desc" } },
      serials: { orderBy: { createdAt: "desc" } },
      stockMoves: {
        orderBy: { movedAt: "desc" },
        take: 20,
        include: { fromLocation: true, toLocation: true, lot: true, serial: true },
      },
    },
  });
}

// ─── Stock: Lots ──────────────────────────────────────────────────────────────

const lotSchema = z.object({
  lotNumber: z.string().min(1, "Lot number is required"),
  expiryDate: z.string().optional(),
  productId: z.string(),
});

export async function createLot(data: z.infer<typeof lotSchema>) {
  const companyId = await getCompanyId();
  const parsed = lotSchema.parse(data);
  await prisma.lot.create({
    data: {
      ...parsed,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
      companyId,
    },
  });
  revalidatePath(`/dashboard/inventory/products/${parsed.productId}`);
}

// ─── Stock: Serial Numbers ────────────────────────────────────────────────────

const serialSchema = z.object({
  serial: z.string().min(1, "Serial number is required"),
  productId: z.string(),
});

export async function createSerial(data: z.infer<typeof serialSchema>) {
  const companyId = await getCompanyId();
  const parsed = serialSchema.parse(data);
  await prisma.serialNumber.create({
    data: { ...parsed, companyId },
  });
  revalidatePath(`/dashboard/inventory/products/${parsed.productId}`);
}

// ─── Stock: Quantity on hand ──────────────────────────────────────────────────

export async function getStockOnHand(productId: string) {
  const companyId = await getCompanyId();

  const inbound = await prisma.stockMove.aggregate({
    where: { productId, companyId, toLocation: { locationType: "INTERNAL" } },
    _sum: { quantity: true },
  });

  const outbound = await prisma.stockMove.aggregate({
    where: { productId, companyId, fromLocation: { locationType: "INTERNAL" } },
    _sum: { quantity: true },
  });

  return (inbound._sum.quantity ?? 0) - (outbound._sum.quantity ?? 0);
}

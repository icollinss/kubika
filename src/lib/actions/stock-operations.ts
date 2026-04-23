"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";


const moveLineSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0).default(0),
  lotId: z.string().optional(),
  serialId: z.string().optional(),
  note: z.string().optional(),
});

const operationSchema = z.object({
  moveType: z.enum(["RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT", "RETURN", "SCRAP"]),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  lines: z.array(moveLineSchema).min(1, "At least one product line is required"),
});

export type OperationFormData = z.infer<typeof operationSchema>;

export async function createStockOperation(data: OperationFormData) {
  const companyId = await getCompanyId();
  const parsed = operationSchema.parse(data);

  // Create all stock moves
  await prisma.$transaction(
    parsed.lines.map((line) =>
      prisma.stockMove.create({
        data: {
          productId: line.productId,
          variantId: line.variantId ?? null,
          fromLocationId: parsed.fromLocationId ?? null,
          toLocationId: parsed.toLocationId ?? null,
          lotId: line.lotId ?? null,
          serialId: line.serialId ?? null,
          quantity: line.quantity,
          unitCost: line.unitCost,
          moveType: parsed.moveType,
          reference: parsed.reference ?? null,
          note: line.note ?? parsed.note ?? null,
          companyId,
        },
      })
    )
  );

  revalidatePath("/dashboard/inventory/operations");
  revalidatePath("/dashboard/inventory/products");
  redirect("/dashboard/inventory/operations");
}

export async function getOperations(moveType?: string) {
  const companyId = await getCompanyId();
  const moves = await prisma.stockMove.findMany({
    where: {
      companyId,
      ...(moveType && moveType !== "ALL" ? { moveType: moveType as "RECEIPT" | "DELIVERY" | "INTERNAL" | "ADJUSTMENT" | "RETURN" | "SCRAP" } : {}),
    },
    include: {
      product: { select: { name: true, internalRef: true } },
      fromLocation: { select: { name: true, fullPath: true } },
      toLocation: { select: { name: true, fullPath: true } },
      lot: { select: { lotNumber: true } },
      serial: { select: { serial: true } },
    },
    orderBy: { movedAt: "desc" },
    take: 100,
  });
  return moves;
}

export async function getOperationSummary() {
  const companyId = await getCompanyId();
  const counts = await prisma.stockMove.groupBy({
    by: ["moveType"],
    where: { companyId },
    _count: true,
    _sum: { quantity: true },
  });
  return counts;
}

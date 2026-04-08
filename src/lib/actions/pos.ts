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

async function generateSessionNumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.posSession.count({ where: { companyId } });
  return `POS/${year}/${String(count + 1).padStart(3, "0")}`;
}

async function generateOrderNumber(companyId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.posOrder.count({ where: { companyId } });
  return `POSO/${year}/${String(count + 1).padStart(4, "0")}`;
}

// ─── POS Configurations ───────────────────────────────────────────────────────

const configSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(14),
  allowDiscount: z.boolean().default(false),
});

export type PosConfigFormData = z.infer<typeof configSchema>;

export async function getPosConfigs() {
  const companyId = await getCompanyId();
  return prisma.posConfig.findMany({
    where: { companyId },
    include: {
      sessions: {
        where: { status: "OPEN" },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPosConfig(id: string) {
  const companyId = await getCompanyId();
  return prisma.posConfig.findUnique({
    where: { id, companyId },
  });
}

export async function createPosConfig(data: PosConfigFormData) {
  const companyId = await getCompanyId();
  const parsed = configSchema.parse(data);
  await prisma.posConfig.create({
    data: { ...parsed, companyId },
  });
  revalidatePath("/dashboard/pos");
}

export async function updatePosConfig(id: string, data: PosConfigFormData) {
  const companyId = await getCompanyId();
  const parsed = configSchema.parse(data);
  await prisma.posConfig.update({
    where: { id, companyId },
    data: parsed,
  });
  revalidatePath("/dashboard/pos");
}

export async function togglePosConfigActive(id: string) {
  const companyId = await getCompanyId();
  const config = await prisma.posConfig.findUniqueOrThrow({ where: { id, companyId } });
  await prisma.posConfig.update({
    where: { id, companyId },
    data: { isActive: !config.isActive },
  });
  revalidatePath("/dashboard/pos");
}

export async function deletePosConfig(id: string) {
  const companyId = await getCompanyId();
  const sessionCount = await prisma.posSession.count({ where: { configId: id, companyId } });
  if (sessionCount > 0) throw new Error("Cannot delete a POS with existing sessions.");
  await prisma.posConfig.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/pos");
}

// ─── Stock levels ─────────────────────────────────────────────────────────────

export async function getStockLevels(companyId: string): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ productId: string; stock: number }[]>`
    SELECT
      sm."productId",
      SUM(
        CASE
          WHEN sm."moveType" IN ('RECEIPT', 'RETURN') THEN sm.quantity
          WHEN sm."moveType" IN ('DELIVERY', 'SCRAP')  THEN -sm.quantity
          ELSE 0
        END
      ) AS stock
    FROM "StockMove" sm
    WHERE sm."companyId" = ${companyId}
    GROUP BY sm."productId"
  `;
  return Object.fromEntries(rows.map((r) => [r.productId, Number(r.stock)]));
}

export async function getPosProducts() {
  const companyId = await getCompanyId();
  const [products, stockMap] = await Promise.all([
    prisma.product.findMany({
      where: { companyId, isArchived: false, canBeSold: true },
      include: { uom: true, category: true },
      orderBy: { name: "asc" },
    }),
    getStockLevels(companyId),
  ]);

  return products.map((p) => ({
    ...p,
    stockOnHand: p.productType === "STORABLE" ? (stockMap[p.id] ?? 0) : null,
  }));
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function openPosSession(configId: string, openingCash: number) {
  const companyId = await getCompanyId();
  // Ensure no other session is open for this config
  const existing = await prisma.posSession.findFirst({
    where: { configId, companyId, status: "OPEN" },
  });
  if (existing) redirect(`/dashboard/pos/session/${existing.id}`);

  const number = await generateSessionNumber(companyId);
  const session = await prisma.posSession.create({
    data: { number, configId, openingCash, companyId },
  });
  revalidatePath("/dashboard/pos");
  redirect(`/dashboard/pos/session/${session.id}`);
}

export async function closePosSession(id: string, closingCash: number, notes?: string) {
  const companyId = await getCompanyId();
  const orders = await prisma.posOrder.findMany({
    where: { sessionId: id, status: "PAID" },
    select: { total: true },
  });
  const cashSales = orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);
  await prisma.posSession.update({
    where: { id, companyId },
    data: { status: "CLOSED", closedAt: new Date(), closingCash, cashSales, notes },
  });
  revalidatePath("/dashboard/pos");
  redirect("/dashboard/pos");
}

// ─── Sales ────────────────────────────────────────────────────────────────────

const saleLineSchema = z.object({
  productId: z.string(),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0.001),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).default(14),
});

const saleSchema = z.object({
  sessionId: z.string(),
  lines: z.array(saleLineSchema).min(1),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHECK", "CREDIT"]).default("CASH"),
  amountReceived: z.coerce.number().min(0),
  customerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordPosSale(data: z.infer<typeof saleSchema>) {
  const companyId = await getCompanyId();
  const parsed = saleSchema.parse(data);

  // ── Stock validation ───────────────────────────────────────────────────────
  const stockMap = await getStockLevels(companyId);
  const productIds = parsed.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, companyId },
    select: { id: true, name: true, productType: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  for (const line of parsed.lines) {
    const product = productMap[line.productId];
    if (product?.productType === "STORABLE") {
      const available = stockMap[line.productId] ?? 0;
      if (available < line.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${available}, requested: ${line.quantity}.`
        );
      }
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const subtotal = parsed.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const taxAmount = parsed.lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice * (l.taxRate / 100),
    0
  );
  const total = subtotal + taxAmount;
  const change = Math.max(0, parsed.amountReceived - total);
  const number = await generateOrderNumber(companyId);

  const stockLoc = await prisma.location.findFirst({
    where: { companyId, locationType: "INTERNAL", name: "Stock" },
  });
  const customerLoc = await prisma.location.findFirst({
    where: { companyId, locationType: "CUSTOMER" },
  });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.posOrder.create({
      data: {
        number,
        sessionId: parsed.sessionId,
        subtotal,
        taxAmount,
        total,
        paymentMethod: parsed.paymentMethod,
        amountReceived: parsed.amountReceived,
        change,
        customerId: parsed.customerId || null,
        notes: parsed.notes,
        companyId,
        lines: {
          create: parsed.lines.map((l) => ({
            productId: l.productId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            subtotal: l.quantity * l.unitPrice,
            total: l.quantity * l.unitPrice * (1 + l.taxRate / 100),
          })),
        },
      },
    });

    for (const l of parsed.lines) {
      await tx.stockMove.create({
        data: {
          productId: l.productId,
          fromLocationId: stockLoc?.id ?? null,
          toLocationId: customerLoc?.id ?? null,
          quantity: l.quantity,
          unitCost: l.unitPrice,
          moveType: "DELIVERY",
          reference: created.number,
          companyId,
        },
      });
    }

    return created;
  });

  revalidatePath(`/dashboard/pos/session/${parsed.sessionId}`);
  return { orderId: order.id, total, change };
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

export async function refundPosSale(orderId: string) {
  const companyId = await getCompanyId();

  const original = await prisma.posOrder.findUnique({
    where: { id: orderId, companyId },
    include: { lines: true },
  });
  if (!original) throw new Error("Order not found");
  if (original.status !== "PAID") throw new Error("Only paid orders can be refunded");

  const stockLoc = await prisma.location.findFirst({
    where: { companyId, locationType: "INTERNAL", name: "Stock" },
  });
  const customerLoc = await prisma.location.findFirst({
    where: { companyId, locationType: "CUSTOMER" },
  });

  const refundNumber = await generateOrderNumber(companyId);

  await prisma.$transaction(async (tx) => {
    await tx.posOrder.update({ where: { id: orderId }, data: { status: "REFUNDED" } });

    await tx.posOrder.create({
      data: {
        number: refundNumber,
        sessionId: original.sessionId,
        status: "REFUNDED",
        subtotal: -original.subtotal,
        taxAmount: -original.taxAmount,
        total: -original.total,
        paymentMethod: original.paymentMethod,
        amountReceived: -original.total,
        change: 0,
        notes: `Refund of ${original.number}`,
        companyId,
        lines: {
          create: original.lines.map((l: { productId: string; quantity: number; unitPrice: number; taxRate: number; subtotal: number; total: number; description: string | null }) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            subtotal: -l.subtotal,
            total: -l.total,
            description: `Refund: ${l.description ?? ""}`.trim(),
          })),
        },
      },
    });

    for (const line of original.lines as { productId: string; quantity: number; unitPrice: number }[]) {
      const product = await tx.product.findUnique({
        where: { id: line.productId },
        select: { productType: true },
      });
      if (product?.productType === "STORABLE") {
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            fromLocationId: customerLoc?.id ?? null,
            toLocationId: stockLoc?.id ?? null,
            quantity: line.quantity,
            unitCost: line.unitPrice,
            moveType: "RETURN",
            reference: `${refundNumber} (refund of ${original.number})`,
            companyId,
          },
        });
      }
    }
  });

  revalidatePath(`/dashboard/pos/session/${original.sessionId}`);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPosSessions(configId?: string) {
  const companyId = await getCompanyId();
  return prisma.posSession.findMany({
    where: { companyId, ...(configId ? { configId } : {}) },
    include: {
      config: { select: { name: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPosSession(id: string) {
  const companyId = await getCompanyId();
  return prisma.posSession.findUnique({
    where: { id, companyId },
    include: {
      config: true,
      orders: {
        include: {
          lines: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getOpenPosSession(configId?: string) {
  const companyId = await getCompanyId();
  return prisma.posSession.findFirst({
    where: { companyId, status: "OPEN", ...(configId ? { configId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

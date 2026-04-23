"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  makeRequestNo,
  createMcxPayment,
  createAppPayment,
  queryPaymentStatus,
  cancelPayment,
} from "@/lib/payments/paypay";


async function getPayPayConfig(companyId: string) {
  const cfg = await prisma.paymentConfig.findFirst({
    where: { companyId, provider: "PAYPAY", isActive: true },
  });
  if (!cfg) throw new Error("PayPay Africa não está configurado. Vá a Definições → Pagamentos para configurar.");
  if (!cfg.publicKey) throw new Error("Partner ID não configurado.");
  if (!cfg.secretKey) throw new Error("Chave RSA privada não configurada.");
  return cfg;
}

// ─── Generate MCX Express reference ──────────────────────────────────────────

export async function generateMcxReference(invoiceId: string) {
  const companyId = await getCompanyId();
  const cfg       = await getPayPayConfig(companyId);

  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { id: invoiceId, companyId },
    include: { customer: true },
  });

  if (invoice.amountDue <= 0) throw new Error("Fatura já está totalmente paga.");

  const requestNo = makeRequestNo();
  const notifyUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/paypay`;

  const result = await createMcxPayment({
    partnerId:     cfg.publicKey!,
    privateKeyB64: cfg.secretKey,
    requestNo,
    amount:        invoice.amountDue,
    subject:       `Fatura ${invoice.number}`,
    notifyUrl,
  });

  const ref = await prisma.paymentReference.create({
    data: {
      invoiceId,
      requestNo,
      method:    "MCX",
      entity:    result.entity,
      reference: result.reference,
      amount:    invoice.amountDue,
      currency:  "AOA",
      status:    "PENDING",
      expiresAt: result.expiresAt,
      companyId,
    },
  });

  revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
  return ref;
}

// ─── Generate PayPay App payment (QR code) ────────────────────────────────────

export async function generateAppReference(invoiceId: string) {
  const companyId = await getCompanyId();
  const cfg       = await getPayPayConfig(companyId);

  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { id: invoiceId, companyId },
    include: { customer: true },
  });

  if (invoice.amountDue <= 0) throw new Error("Fatura já está totalmente paga.");

  const requestNo = makeRequestNo();
  const notifyUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/paypay`;
  const returnUrl = `${process.env.NEXTAUTH_URL}/dashboard/sales/invoices/${invoiceId}?payment=success`;

  const result = await createAppPayment({
    partnerId:     cfg.publicKey!,
    privateKeyB64: cfg.secretKey,
    requestNo,
    amount:        invoice.amountDue,
    subject:       `Fatura ${invoice.number}`,
    notifyUrl,
    returnUrl,
  });

  const ref = await prisma.paymentReference.create({
    data: {
      invoiceId,
      requestNo,
      method:    "PAYPAY_APP",
      payUrl:    result.payUrl,
      amount:    invoice.amountDue,
      currency:  "AOA",
      status:    "PENDING",
      expiresAt: result.expiresAt,
      companyId,
    },
  });

  revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
  return ref;
}

// ─── Poll status from PayPay ──────────────────────────────────────────────────

export async function refreshReferenceStatus(referenceId: string) {
  const companyId = await getCompanyId();
  const ref = await prisma.paymentReference.findFirstOrThrow({
    where: { id: referenceId, companyId },
    include: { invoice: true },
  });

  if (ref.status === "PAID") return ref;

  const cfg = await getPayPayConfig(companyId);

  const result = await queryPaymentStatus({
    partnerId:     cfg.publicKey!,
    privateKeyB64: cfg.secretKey,
    requestNo:     ref.requestNo,
  });

  if (result.status === ref.status) return ref;

  const updated = await prisma.paymentReference.update({
    where: { id: referenceId },
    data: {
      status:      result.status,
      providerRef: result.providerRef ?? ref.providerRef,
      paidAt:      result.status === "PAID" ? new Date() : ref.paidAt,
    },
  });

  // If now paid, record on invoice
  if (result.status === "PAID" && ref.status !== "PAID") {
    await markReferenceAsPaid(ref.invoiceId, ref.amount, ref.requestNo, result.providerRef ?? ref.requestNo, companyId);
  }

  revalidatePath(`/dashboard/sales/invoices/${ref.invoiceId}`);
  return updated;
}

// ─── Cancel a reference ───────────────────────────────────────────────────────

export async function cancelPaymentReference(referenceId: string) {
  const companyId = await getCompanyId();
  const ref = await prisma.paymentReference.findFirstOrThrow({ where: { id: referenceId, companyId } });

  if (ref.status !== "PENDING") throw new Error("Só é possível cancelar referências pendentes.");

  const cfg = await getPayPayConfig(companyId);
  await cancelPayment({ partnerId: cfg.publicKey!, privateKeyB64: cfg.secretKey, requestNo: ref.requestNo });

  await prisma.paymentReference.update({ where: { id: referenceId }, data: { status: "CANCELLED" } });
  revalidatePath(`/dashboard/sales/invoices/${ref.invoiceId}`);
}

// ─── Get all references for an invoice ───────────────────────────────────────

export async function getInvoicePaymentReferences(invoiceId: string) {
  const companyId = await getCompanyId();
  return prisma.paymentReference.findMany({
    where: { invoiceId, companyId },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Internal: mark invoice paid (also called from webhook) ──────────────────

export async function markReferenceAsPaid(
  invoiceId: string,
  amount: number,
  requestNo: string,
  providerRef: string,
  companyId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  // Mark reference as paid
  await prisma.paymentReference.updateMany({
    where: { requestNo },
    data:  { status: "PAID", paidAt: new Date(), providerRef },
  });

  // Record payment
  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      currency:  "AOA",
      method:    "MOBILE_MONEY",
      reference: providerRef,
      notes:     "Pago via PayPay Africa (Multicaixa Express)",
      companyId,
    },
  });

  // Update invoice totals
  const totalPaid = invoice.amountPaid + amount;
  const amountDue = Math.max(0, invoice.total - totalPaid);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data:  { amountPaid: totalPaid, amountDue, status: amountDue <= 0 ? "PAID" : "PARTIAL" },
  });

  revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
}

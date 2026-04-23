"use server";

import { getCompanyId } from "@/lib/get-company-id";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";


function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

async function sendViaTwilio(to: string, body: string): Promise<{ sid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. +14155238886

  if (!accountSid || !authToken || !from) {
    return { error: "WhatsApp not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to .env" };
  }

  // Normalise number: ensure starts with +
  const toNorm = to.startsWith("+") ? to : `+${to}`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `whatsapp:${toNorm}`,
          From: `whatsapp:${from}`,
          Body: body,
        }).toString(),
      }
    );

    const data = await response.json() as { sid?: string; message?: string; code?: number };
    if (!response.ok) {
      return { error: data.message ?? "Twilio error" };
    }
    return { sid: data.sid };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Network error" };
  }
}

// ─── Send Invoice via WhatsApp ────────────────────────────────────────────────

export async function sendInvoiceWhatsapp(invoiceId: string, phone: string) {
  const companyId = await getCompanyId();

  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { id: invoiceId, companyId },
    include: {
      customer: true,
      lines: { include: { product: true } },
    },
  });

  const linesSummary = invoice.lines
    .map((l) => `  • ${l.product.name} × ${l.quantity} = ${fmt(l.total)} AOA`)
    .join("\n");

  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("pt-AO")
    : "—";

  const body =
    `*FACTURA ${invoice.number}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Cliente: ${invoice.customer.name}\n` +
    `Data: ${new Date(invoice.invoiceDate).toLocaleDateString("pt-AO")}\n` +
    `Vencimento: ${dueDate}\n\n` +
    `*Itens:*\n${linesSummary}\n\n` +
    `Subtotal: ${fmt(invoice.subtotal)} AOA\n` +
    `IVA: ${fmt(invoice.taxAmount)} AOA\n` +
    `*Total: ${fmt(invoice.total)} AOA*\n` +
    `Valor em dívida: ${fmt(invoice.amountDue)} AOA\n\n` +
    `Obrigado pela sua preferência! 🙏`;

  const result = await sendViaTwilio(phone, body);

  await prisma.whatsappLog.create({
    data: {
      to: phone,
      type: "INVOICE",
      referenceId: invoiceId,
      reference: invoice.number,
      body,
      status: result.error ? "FAILED" : "SENT",
      twilioSid: result.sid,
      companyId,
    },
  });

  if (result.error) throw new Error(result.error);
  revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
}

// ─── Send Quotation via WhatsApp ─────────────────────────────────────────────

export async function sendQuotationWhatsapp(orderId: string, phone: string) {
  const companyId = await getCompanyId();

  const order = await prisma.salesOrder.findFirstOrThrow({
    where: { id: orderId, companyId },
    include: {
      customer: true,
      lines: { include: { product: true } },
    },
  });

  const linesSummary = order.lines
    .map((l) => `  • ${l.product.name} × ${l.quantity} = ${fmt(l.total)} AOA`)
    .join("\n");

  const expiry = order.expiryDate
    ? new Date(order.expiryDate).toLocaleDateString("pt-AO")
    : "—";

  const body =
    `*COTAÇÃO ${order.number}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Cliente: ${order.customer.name}\n` +
    `Data: ${new Date(order.orderDate).toLocaleDateString("pt-AO")}\n` +
    `Validade: ${expiry}\n\n` +
    `*Itens:*\n${linesSummary}\n\n` +
    `Subtotal: ${fmt(order.subtotal)} AOA\n` +
    `IVA: ${fmt(order.taxAmount)} AOA\n` +
    `*Total: ${fmt(order.total)} AOA*\n\n` +
    `Para confirmar esta cotação, por favor contacte-nos. 📞`;

  const result = await sendViaTwilio(phone, body);

  await prisma.whatsappLog.create({
    data: {
      to: phone,
      type: "QUOTATION",
      referenceId: orderId,
      reference: order.number,
      body,
      status: result.error ? "FAILED" : "SENT",
      twilioSid: result.sid,
      companyId,
    },
  });

  if (result.error) throw new Error(result.error);
  revalidatePath(`/dashboard/sales/orders/${orderId}`);
}

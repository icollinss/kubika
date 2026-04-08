"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

function shortId() {
  return randomBytes(4).toString("hex");
}

async function getCompanyId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
  if (!user.companyId) throw new Error("No company");
  return user.companyId;
}

async function getCompany() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
    include: { company: true },
  });
  return user.company!;
}

// ─── Config CRUD ──────────────────────────────────────────────────────────────

export async function getPaymentConfigs() {
  const companyId = await getCompanyId();
  return prisma.paymentConfig.findMany({ where: { companyId } });
}

export async function upsertPaymentConfig(data: {
  provider: string;
  publicKey?: string;
  secretKey: string;
  webhookSecret?: string;
  currency: string;
  isActive: boolean;
}) {
  const companyId = await getCompanyId();
  await prisma.paymentConfig.upsert({
    where: { provider_companyId: { provider: data.provider, companyId } },
    create: { ...data, companyId },
    update: data,
  });
  revalidatePath("/dashboard/settings/payments");
}

export async function togglePaymentConfig(id: string) {
  const companyId = await getCompanyId();
  const cfg = await prisma.paymentConfig.findFirstOrThrow({ where: { id, companyId } });
  await prisma.paymentConfig.update({ where: { id }, data: { isActive: !cfg.isActive } });
  revalidatePath("/dashboard/settings/payments");
}

// ─── Generate payment link ────────────────────────────────────────────────────

export async function generatePaymentLink(invoiceId: string) {
  const company = await getCompany();

  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { id: invoiceId, companyId: company.id },
    include: { customer: true },
  });

  if (invoice.amountDue <= 0) throw new Error("Invoice is already fully paid.");

  // Find an active payment config (prefer one matching company currency)
  const configs = await prisma.paymentConfig.findMany({
    where: { companyId: company.id, isActive: true },
  });
  if (configs.length === 0) throw new Error("No active payment provider configured. Go to Settings → Payments.");

  const config = configs.find((c) => c.currency === company.currency) ?? configs[0];
  const txRef = `kubika_${invoice.number.replace(/\//g, "_")}_${shortId()}`;

  let linkUrl = "";

  if (config.provider === "FLUTTERWAVE") {
    linkUrl = await createFlutterwaveLink({
      secretKey: config.secretKey,
      txRef,
      amount: invoice.amountDue,
      currency: config.currency,
      customer: {
        email: invoice.customer.email ?? "",
        name: invoice.customer.name,
        phone: invoice.customer.phone ?? "",
      },
      title: `Invoice ${invoice.number}`,
      description: `Payment for ${invoice.number} — ${company.name}`,
      redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/sales/invoices/${invoiceId}?payment=success`,
    });
  } else if (config.provider === "PAYSTACK") {
    linkUrl = await createPaystackLink({
      secretKey: config.secretKey,
      reference: txRef,
      amount: invoice.amountDue,
      currency: config.currency,
      email: invoice.customer.email ?? `customer@${company.name.toLowerCase().replace(/\s/g, "")}.com`,
      invoiceNumber: invoice.number,
      callbackUrl: `${process.env.NEXTAUTH_URL}/dashboard/sales/invoices/${invoiceId}?payment=success`,
    });
  } else if (config.provider === "DPO") {
    linkUrl = await createDpoLink({
      secretKey: config.secretKey,
      txRef,
      amount: invoice.amountDue,
      currency: config.currency,
      customer: { name: invoice.customer.name, email: invoice.customer.email ?? "" },
      description: `Invoice ${invoice.number}`,
    });
  } else {
    throw new Error(`Payment provider "${config.provider}" link generation not yet supported.`);
  }

  // Save the payment link
  await prisma.paymentLink.create({
    data: {
      invoiceId,
      provider: config.provider,
      configId: config.id,
      linkUrl,
      txRef,
      amount: invoice.amountDue,
      currency: config.currency,
      companyId: company.id,
    },
  });

  revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
  return linkUrl;
}

export async function getPaymentLinksForInvoice(invoiceId: string) {
  const companyId = await getCompanyId();
  return prisma.paymentLink.findMany({
    where: { invoiceId, companyId },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Flutterwave ──────────────────────────────────────────────────────────────

async function createFlutterwaveLink(opts: {
  secretKey: string;
  txRef: string;
  amount: number;
  currency: string;
  customer: { email: string; name: string; phone: string };
  title: string;
  description: string;
  redirectUrl: string;
}): Promise<string> {
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: opts.amount,
      currency: opts.currency,
      redirect_url: opts.redirectUrl,
      customer: {
        email: opts.customer.email,
        name: opts.customer.name,
        phonenumber: opts.customer.phone,
      },
      customizations: {
        title: opts.title,
        description: opts.description,
      },
    }),
  });

  const data = await res.json() as { status: string; message?: string; data?: { link?: string } };
  if (data.status !== "success" || !data.data?.link) {
    throw new Error(`Flutterwave error: ${data.message ?? "Unknown error"}`);
  }
  return data.data.link;
}

// ─── Paystack ─────────────────────────────────────────────────────────────────

async function createPaystackLink(opts: {
  secretKey: string;
  reference: string;
  amount: number;
  currency: string;
  email: string;
  invoiceNumber: string;
  callbackUrl: string;
}): Promise<string> {
  // Paystack amounts are in the smallest currency unit (kobo, pesewas, cents)
  // For currencies without subunits (like KES, GHS amounts are whole), multiply by 100
  const amountInSubunit = Math.round(opts.amount * 100);

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: amountInSubunit,
      currency: opts.currency,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: {
        invoice_number: opts.invoiceNumber,
        custom_fields: [
          { display_name: "Invoice", variable_name: "invoice_number", value: opts.invoiceNumber },
        ],
      },
    }),
  });

  const data = await res.json() as { status: boolean; message?: string; data?: { authorization_url?: string } };
  if (!data.status || !data.data?.authorization_url) {
    throw new Error(`Paystack error: ${data.message ?? "Unknown error"}`);
  }
  return data.data.authorization_url;
}

// ─── DPO Pay ──────────────────────────────────────────────────────────────────

async function createDpoLink(opts: {
  secretKey: string; // DPO Company Token
  txRef: string;
  amount: number;
  currency: string;
  customer: { name: string; email: string };
  description: string;
}): Promise<string> {
  // DPO uses XML API
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${opts.secretKey}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${opts.amount.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>${opts.currency}</PaymentCurrency>
    <CompanyRef>${opts.txRef}</CompanyRef>
    <RedirectURL>${process.env.NEXTAUTH_URL}/payment/callback</RedirectURL>
    <BackURL>${process.env.NEXTAUTH_URL}/payment/cancel</BackURL>
    <customerEmail>${opts.customer.email}</customerEmail>
    <customerFirstName>${opts.customer.name.split(" ")[0]}</customerFirstName>
    <customerLastName>${opts.customer.name.split(" ").slice(1).join(" ") || "."}</customerLastName>
    <TransactionChargeType>1</TransactionChargeType>
    <Services>
      <Service>
        <ServiceType>45854</ServiceType>
        <ServiceDescription>${opts.description}</ServiceDescription>
        <ServiceDate>${new Date().toISOString().split("T")[0]} 00:00</ServiceDate>
      </Service>
    </Services>
  </Transaction>
</API3G>`;

  const res = await fetch("https://secure.3gdirectpay.com/API/v6/", {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });

  const text = await res.text();
  const tokenMatch = text.match(/<TransToken>(.+?)<\/TransToken>/);
  const resultMatch = text.match(/<Result>(.+?)<\/Result>/);

  if (!tokenMatch || resultMatch?.[1] !== "000") {
    const explainMatch = text.match(/<ResultExplanation>(.+?)<\/ResultExplanation>/);
    throw new Error(`DPO error: ${explainMatch?.[1] ?? "Token creation failed"}`);
  }

  return `https://secure.3gdirectpay.com/payv2.php?ID=${tokenMatch[1]}`;
}

// ─── Mark paid (called from webhooks) ────────────────────────────────────────

export async function markInvoicePaidViaLink(txRef: string, providerRef: string) {
  const link = await prisma.paymentLink.findUnique({ where: { txRef } });
  if (!link || link.status === "PAID") return;

  await prisma.paymentLink.update({
    where: { txRef },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Record payment on the invoice
  const invoice = await prisma.invoice.findUnique({ where: { id: link.invoiceId } });
  if (!invoice) return;

  await prisma.payment.create({
    data: {
      invoiceId: link.invoiceId,
      amount: link.amount,
      currency: link.currency,
      method: "MOBILE_MONEY",
      reference: providerRef,
      notes: `Paid via ${link.provider}`,
      companyId: link.companyId,
    },
  });

  // Update invoice amountPaid / amountDue / status
  const totalPaid = invoice.amountPaid + link.amount;
  const amountDue = Math.max(0, invoice.total - totalPaid);
  const status = amountDue <= 0 ? "PAID" : "PARTIAL";

  await prisma.invoice.update({
    where: { id: link.invoiceId },
    data: { amountPaid: totalPaid, amountDue, status },
  });

  revalidatePath(`/dashboard/sales/invoices/${link.invoiceId}`);
}

/**
 * PayPay Africa — service layer
 *
 * Auth: RSA-SHA256 digital signatures
 *   - Every request body is signed with your RSA private key
 *   - Every response / webhook is verified with PayPay's public key
 *
 * Credentials (stored in PaymentConfig where provider = "PAYPAY"):
 *   publicKey     → Your Partner ID (given by PayPay after registration)
 *   secretKey     → Your RSA private key  (PEM, base64-encoded for DB storage)
 *   webhookSecret → PayPay's RSA public key (PEM, base64-encoded) — for response verification
 *
 * Base URL: confirm with PayPay after registration; update PAYPAY_API_URL env var.
 *   Default: https://openapi.paypayafrica.com  (common for this style of gateway)
 */

import { createSign, createVerify } from "crypto";
import { randomBytes } from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.PAYPAY_API_URL ?? "https://openapi.paypayafrica.com";
const VERSION  = "1.0";
const CHARSET  = "UTF-8";
const FORMAT   = "JSON";
const SIGN_TYPE = "RSA2"; // RSA-SHA256

export function makeRequestNo(): string {
  return `KBK_${Date.now()}_${randomBytes(4).toString("hex").toUpperCase()}`;
}

// ─── RSA helpers ─────────────────────────────────────────────────────────────

/** Decode a base64-encoded PEM key back to PEM string */
function decodePem(b64: string): string {
  // If already a PEM (starts with -----), use as-is; otherwise decode from base64
  const decoded = b64.startsWith("-----") ? b64 : Buffer.from(b64, "base64").toString("utf8");
  return decoded;
}

/**
 * Sort params alphabetically (exclude "sign"), concatenate as key=value&...
 * This is the standard canonicalisation for PayPay-style APIs.
 */
function buildSignString(params: Record<string, string | number | boolean>): string {
  return Object.keys(params)
    .filter((k) => k !== "sign" && params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

function sign(params: Record<string, string | number | boolean>, privateKeyB64: string): string {
  const pem = decodePem(privateKeyB64);
  const content = buildSignString(params);
  const signer = createSign("RSA-SHA256");
  signer.update(content, "utf8");
  return signer.sign(pem, "base64");
}

export function verifySignature(
  params: Record<string, string | number | boolean>,
  signature: string,
  publicKeyB64: string
): boolean {
  try {
    const pem = decodePem(publicKeyB64);
    const content = buildSignString(params);
    const verifier = createVerify("RSA-SHA256");
    verifier.update(content, "utf8");
    return verifier.verify(pem, signature, "base64");
  } catch {
    return false;
  }
}

// ─── Request builder ─────────────────────────────────────────────────────────

interface CommonParams {
  partnerId: string;
  privateKeyB64: string;
  method: string;
}

function buildRequest(
  common: CommonParams,
  bizContent: Record<string, string | number>
): Record<string, string> {
  const timestamp = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  const base: Record<string, string | number> = {
    partnerId:  common.partnerId,
    method:     common.method,
    version:    VERSION,
    charset:    CHARSET,
    format:     FORMAT,
    signType:   SIGN_TYPE,
    timestamp,
    bizContent: JSON.stringify(bizContent),
  };

  const signature = sign(base, common.privateKeyB64);
  return { ...Object.fromEntries(Object.entries(base).map(([k, v]) => [k, String(v)])), sign: signature };
}

async function callApi(params: Record<string, string>): Promise<PayPayResponse> {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/gateway.do`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`PayPay HTTP ${res.status}`);
  return res.json() as Promise<PayPayResponse>;
}

interface PayPayResponse {
  code:        string;   // "10000" = success
  msg?:        string;
  sign?:       string;
  bizContent?: string;   // JSON string
}

function parseBiz<T>(res: PayPayResponse): T {
  if (res.code !== "10000") {
    throw new Error(`PayPay error ${res.code}: ${res.msg ?? "Unknown error"}`);
  }
  if (!res.bizContent) throw new Error("PayPay: empty bizContent");
  return JSON.parse(res.bizContent) as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface McxPaymentResult {
  entity:    string;   // e.g. "99090"
  reference: string;   // e.g. "123456789"
  expiresAt: Date;
}

/**
 * Generate a Multicaixa Express payment reference.
 * Customer pays via MCX App, *500# USSD, or Multicaixa ATM.
 */
export async function createMcxPayment(opts: {
  partnerId:      string;
  privateKeyB64:  string;
  requestNo:      string;
  amount:         number;
  subject:        string;
  notifyUrl:      string;
  expireMinutes?: number;  // default 1440 = 24h
}): Promise<McxPaymentResult> {
  const params = buildRequest(
    { partnerId: opts.partnerId, privateKeyB64: opts.privateKeyB64, method: "paypay.mcx.pay" },
    {
      requestNo:     opts.requestNo,
      amount:        opts.amount.toFixed(2),
      currency:      "AOA",
      subject:       opts.subject,
      notifyUrl:     opts.notifyUrl,
      expireTime:    opts.expireMinutes ?? 1440,
    }
  );

  const res = await callApi(params);
  const biz = parseBiz<{ entity: string; reference: string; expireTime: string }>(res);

  return {
    entity:    biz.entity,
    reference: biz.reference,
    expiresAt: new Date(Date.now() + (opts.expireMinutes ?? 1440) * 60 * 1000),
  };
}

export interface AppPaymentResult {
  payUrl:    string;   // deep-link or QR content for PayPay App
  expiresAt: Date;
}

/**
 * Generate a PayPay App payment (QR code / deep-link).
 */
export async function createAppPayment(opts: {
  partnerId:     string;
  privateKeyB64: string;
  requestNo:     string;
  amount:        number;
  subject:       string;
  notifyUrl:     string;
  returnUrl:     string;
}): Promise<AppPaymentResult> {
  const params = buildRequest(
    { partnerId: opts.partnerId, privateKeyB64: opts.privateKeyB64, method: "paypay.app.pay" },
    {
      requestNo: opts.requestNo,
      amount:    opts.amount.toFixed(2),
      currency:  "AOA",
      subject:   opts.subject,
      notifyUrl: opts.notifyUrl,
      returnUrl: opts.returnUrl,
    }
  );

  const res = await callApi(params);
  const biz = parseBiz<{ payUrl: string }>(res);

  return {
    payUrl:    biz.payUrl,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // App payments expire in 30m
  };
}

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export interface StatusResult {
  status:      PaymentStatus;
  providerRef?: string;   // PayPay transaction ID when paid
  paidAmount?:  number;
}

/**
 * Query the status of any payment by requestNo.
 */
export async function queryPaymentStatus(opts: {
  partnerId:     string;
  privateKeyB64: string;
  requestNo:     string;
}): Promise<StatusResult> {
  const params = buildRequest(
    { partnerId: opts.partnerId, privateKeyB64: opts.privateKeyB64, method: "paypay.pay.query" },
    { requestNo: opts.requestNo }
  );

  const res = await callApi(params);
  const biz = parseBiz<{ status: string; transactionId?: string; payAmount?: string }>(res);

  const statusMap: Record<string, PaymentStatus> = {
    SUCCESS:    "PAID",
    PENDING:    "PENDING",
    PAYING:     "PENDING",
    EXPIRED:    "EXPIRED",
    CANCELLED:  "CANCELLED",
    CLOSED:     "CANCELLED",
  };

  return {
    status:      statusMap[biz.status?.toUpperCase()] ?? "PENDING",
    providerRef: biz.transactionId,
    paidAmount:  biz.payAmount ? parseFloat(biz.payAmount) : undefined,
  };
}

/**
 * Cancel / close a pending payment reference.
 */
export async function cancelPayment(opts: {
  partnerId:     string;
  privateKeyB64: string;
  requestNo:     string;
}): Promise<void> {
  const params = buildRequest(
    { partnerId: opts.partnerId, privateKeyB64: opts.privateKeyB64, method: "paypay.pay.cancel" },
    { requestNo: opts.requestNo }
  );
  const res = await callApi(params);
  parseBiz(res); // throws on error
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/payments/paypay";
import { markReferenceAsPaid } from "@/lib/actions/paypay";

/**
 * PayPay Africa webhook
 *
 * Configure this URL in your PayPay merchant dashboard as the Notify URL:
 *   https://your-domain.com/api/webhooks/paypay
 *
 * PayPay sends a POST with form-encoded params including:
 *   - requestNo      → our transaction ID
 *   - status         → SUCCESS | FAILED
 *   - transactionId  → PayPay's own reference
 *   - amount         → paid amount
 *   - sign           → RSA-SHA256 signature of all other params
 */
export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const params = Object.fromEntries(new URLSearchParams(text).entries()) as Record<string, string>;

    const { sign, requestNo, status, transactionId, amount } = params;

    if (!requestNo || !status) {
      return NextResponse.json({ code: "INVALID" }, { status: 400 });
    }

    // Find the matching reference and its company
    const ref = await prisma.paymentReference.findUnique({
      where: { requestNo },
    });

    if (!ref) {
      // Unknown reference — still return 200 so PayPay doesn't retry indefinitely
      return NextResponse.json({ code: "SUCCESS" });
    }

    // Verify signature using PayPay's public key for this company
    if (sign) {
      const cfg = await prisma.paymentConfig.findFirst({
        where: { companyId: ref.companyId, provider: "PAYPAY" },
      });

      if (cfg?.webhookSecret) {
        const paramsWithoutSign = Object.fromEntries(
          Object.entries(params).filter(([k]) => k !== "sign")
        ) as Record<string, string>;

        const valid = verifySignature(paramsWithoutSign, sign, cfg.webhookSecret);
        if (!valid) {
          return NextResponse.json({ code: "INVALID_SIGN" }, { status: 401 });
        }
      }
    }

    // Process payment
    if (status === "SUCCESS" && ref.status !== "PAID") {
      const paidAmount = amount ? parseFloat(amount) : ref.amount;
      await markReferenceAsPaid(
        ref.invoiceId,
        paidAmount,
        requestNo,
        transactionId ?? requestNo,
        ref.companyId
      );
    }

    // PayPay expects { code: "SUCCESS" }
    return NextResponse.json({ code: "SUCCESS" });
  } catch (err) {
    console.error("PayPay webhook error:", err);
    return NextResponse.json({ code: "ERROR" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markInvoicePaidViaLink } from "@/lib/actions/payment-providers";
import { createHmac } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify signature using webhook secret
    const configs = await prisma.paymentConfig.findMany({ where: { provider: "PAYSTACK" } });
    const config = configs.find((c) => {
      if (!c.webhookSecret || !signature) return false;
      const hash = createHmac("sha512", c.webhookSecret).update(body).digest("hex");
      return hash === signature;
    });

    if (!config && configs.some((c) => c.webhookSecret)) {
      return NextResponse.json({ status: "invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body) as PaystackEvent;

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (reference) {
        await markInvoicePaidViaLink(reference, reference);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

interface PaystackEvent {
  event: string;
  data?: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
}

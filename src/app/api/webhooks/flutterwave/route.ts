import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markInvoicePaidViaLink } from "@/lib/actions/payment-providers";
import { createHmac } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("verifi-hash");

    // Find matching config by webhook secret
    const configs = await prisma.paymentConfig.findMany({ where: { provider: "FLUTTERWAVE" } });
    const config = configs.find((c) => c.webhookSecret && signature === c.webhookSecret);

    if (!config && configs.some((c) => c.webhookSecret)) {
      return NextResponse.json({ status: "invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body) as FlutterwaveEvent;

    if (event.event === "charge.completed" && event.data?.status === "successful") {
      const txRef = event.data.tx_ref;
      const flwRef = event.data.flw_ref ?? event.data.id?.toString() ?? txRef;
      await markInvoicePaidViaLink(txRef, flwRef);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Flutterwave webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

interface FlutterwaveEvent {
  event: string;
  data?: {
    id?: number;
    tx_ref: string;
    flw_ref?: string;
    status: string;
    amount: number;
    currency: string;
  };
}

"use client";

import { WhatsappSendButton } from "@/components/whatsapp-send-button";
import { sendInvoiceWhatsapp } from "@/lib/actions/whatsapp";

export function WhatsappInvoiceButton({ invoiceId, defaultPhone }: { invoiceId: string; defaultPhone?: string }) {
  return (
    <WhatsappSendButton
      defaultPhone={defaultPhone}
      label="Send Invoice"
      onSend={(phone) => sendInvoiceWhatsapp(invoiceId, phone)}
    />
  );
}

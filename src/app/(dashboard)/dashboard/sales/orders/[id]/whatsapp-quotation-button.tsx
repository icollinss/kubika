"use client";

import { WhatsappSendButton } from "@/components/whatsapp-send-button";
import { sendQuotationWhatsapp } from "@/lib/actions/whatsapp";

export function WhatsappQuotationButton({ orderId, defaultPhone }: { orderId: string; defaultPhone?: string }) {
  return (
    <WhatsappSendButton
      defaultPhone={defaultPhone}
      label="Send Quotation"
      onSend={(phone) => sendQuotationWhatsapp(orderId, phone)}
    />
  );
}

import { getPaymentConfigs } from "@/lib/actions/payment-providers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentProviderCard } from "./payment-provider-card";

const PROVIDERS = [
  {
    key: "FLUTTERWAVE",
    name: "Flutterwave",
    description: "Accept payments across 30+ African countries. Supports cards, mobile money, bank transfers.",
    logo: "🌊",
    countries: ["NG", "GH", "KE", "ZA", "UG", "TZ", "RW", "ZM", "CM", "SN"],
    currencies: ["NGN", "GHS", "KES", "ZAR", "USD", "EUR", "GBP"],
    docsUrl: "https://developer.flutterwave.com",
    fields: ["publicKey", "secretKey", "webhookSecret"],
  },
  {
    key: "PAYSTACK",
    name: "Paystack",
    description: "Fast payments for Nigeria, Ghana, South Africa, Kenya & Egypt.",
    logo: "💚",
    countries: ["NG", "GH", "ZA", "KE", "EG"],
    currencies: ["NGN", "GHS", "ZAR", "KES", "USD", "EGP"],
    docsUrl: "https://paystack.com/docs",
    fields: ["secretKey", "webhookSecret"],
  },
  {
    key: "DPO",
    name: "DPO Pay",
    description: "Direct Pay Online — widely used in Angola, East & Southern Africa.",
    logo: "💳",
    countries: ["AO", "ZA", "KE", "TZ", "UG", "ZM", "ZW", "MZ", "RW"],
    currencies: ["AOA", "USD", "ZAR", "KES", "TZS", "UGX", "ZMW"],
    docsUrl: "https://directpay.online/docs",
    fields: ["secretKey"],
    secretKeyLabel: "Company Token",
  },
  {
    key: "PAYPAY",
    name: "PayPay Africa (Multicaixa Express)",
    description: "Aceite pagamentos via Multicaixa Express, PayPay App e referências bancárias. Solução angolana líder para e-commerce.",
    logo: "🇦🇴",
    countries: ["AO"],
    currencies: ["AOA"],
    docsUrl: "https://paypayafrica.com",
    fields: ["publicKey", "secretKey", "webhookSecret"],
    publicKeyLabel: "Partner ID",
    secretKeyLabel: "Chave RSA Privada (PEM em base64)",
    webhookSecretLabel: "Chave Pública PayPay (PEM em base64)",
  },
];

export type ProviderDefinition = typeof PROVIDERS[number];

export default async function PaymentSettingsPage() {
  const configs = await getPaymentConfigs();
  const configMap = Object.fromEntries(configs.map((c) => [c.provider, c]));

  const webhookBase = process.env.NEXTAUTH_URL ?? "https://your-domain.com";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Providers</h2>
        <p className="text-sm text-muted-foreground">
          Configure payment gateways so clients can pay invoices online
        </p>
      </div>

      {/* Webhook info */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Webhook URLs</p>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Configure these URLs in your payment provider dashboard to auto-confirm payments:
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono shrink-0">Flutterwave</Badge>
              <code className="text-xs text-muted-foreground">{webhookBase}/api/webhooks/flutterwave</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono shrink-0">Paystack</Badge>
              <code className="text-xs text-muted-foreground">{webhookBase}/api/webhooks/paystack</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono shrink-0">PayPay Africa</Badge>
              <code className="text-xs text-muted-foreground">{webhookBase}/api/webhooks/paypay</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => (
          <PaymentProviderCard
            key={provider.key}
            provider={provider}
            config={configMap[provider.key] ?? null}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { upsertPaymentConfig, togglePaymentConfig } from "@/lib/actions/payment-providers";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { ProviderDefinition } from "./page";

interface Config {
  id: string;
  provider: string;
  publicKey: string | null;
  secretKey: string;
  webhookSecret: string | null;
  isActive: boolean;
  currency: string;
}

export function PaymentProviderCard({
  provider,
  config,
}: {
  provider: ProviderDefinition;
  config: Config | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [publicKey, setPublicKey] = useState(config?.publicKey ?? "");
  const [secretKey, setSecretKey] = useState(config?.secretKey ?? "");
  const [webhookSecret, setWebhookSecret] = useState(config?.webhookSecret ?? "");
  const [currency, setCurrency] = useState(config?.currency ?? "USD");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!secretKey.trim()) return;
    setSaving(true);
    try {
      await upsertPaymentConfig({
        provider: provider.key,
        publicKey: publicKey.trim() || undefined,
        secretKey: secretKey.trim(),
        webhookSecret: webhookSecret.trim() || undefined,
        currency,
        isActive: config?.isActive ?? false,
      });
      setExpanded(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!config) return;
    setToggling(true);
    try {
      await togglePaymentConfig(config.id);
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  const isConfigured = !!config?.secretKey;
  const isActive = config?.isActive ?? false;

  const availableCurrencies = SUPPORTED_CURRENCIES.filter((c) =>
    provider.currencies.includes(c.code)
  );

  return (
    <Card className={isActive ? "border-green-300 dark:border-green-700" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{provider.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{provider.name}</p>
                {provider.comingSoon && (
                  <Badge variant="outline" className="text-xs">Coming soon</Badge>
                )}
                {isActive && <Badge className="text-xs bg-green-600">Active</Badge>}
                {isConfigured && !isActive && <Badge variant="outline" className="text-xs">Configured</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isConfigured && !provider.comingSoon && (
              <Button
                size="sm"
                variant={isActive ? "outline" : "default"}
                onClick={handleToggle}
                disabled={toggling}
                className={isActive ? "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : ""}
              >
                {toggling && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {isActive ? "Deactivate" : "Activate"}
              </Button>
            )}
            {!provider.comingSoon && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && !provider.comingSoon && (
        <CardContent className="border-t pt-4">
          <form onSubmit={handleSave} className="space-y-3">
            {provider.fields.includes("publicKey") && (
              <div className="space-y-1.5">
                <Label className="text-xs">{provider.publicKeyLabel ?? "Public Key"}</Label>
                <Input
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="pk_live_..."
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">{provider.secretKeyLabel ?? "Secret Key"} *</Label>
              <Input
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                type="password"
                className="font-mono text-sm"
                required
              />
            </div>

            {provider.fields.includes("webhookSecret") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Webhook Secret</Label>
                <Input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  type="password"
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Charge Currency</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {availableCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />View {provider.name} docs
              </a>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving || !secretKey.trim()}>
                  {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

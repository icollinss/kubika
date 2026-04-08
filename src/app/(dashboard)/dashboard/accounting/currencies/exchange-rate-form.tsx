"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { upsertExchangeRate } from "@/lib/actions/currency";

interface Currency { code: string; name: string; symbol: string }

export function ExchangeRateForm({
  baseCurrency,
  availableCurrencies,
}: {
  baseCurrency: string;
  availableCurrencies: Currency[];
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState(availableCurrencies[0]?.code ?? "");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rateNum = parseFloat(rate);
    if (!currency || !rateNum || rateNum <= 0) {
      setError("Enter a valid currency and rate.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertExchangeRate(currency, rateNum);
      setCurrency(availableCurrencies[0]?.code ?? "");
      setRate("");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save rate.");
    } finally {
      setSaving(false);
    }
  }

  if (availableCurrencies.length === 0) {
    return <p className="text-sm text-muted-foreground">All supported currencies are already configured.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Currency</Label>
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
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Rate (1 {currency || "…"} = ? {baseCurrency})</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="any"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={`e.g. 850 means 1 ${currency} = 850 ${baseCurrency}`}
            />
            <Button type="submit" disabled={saving || !rate}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

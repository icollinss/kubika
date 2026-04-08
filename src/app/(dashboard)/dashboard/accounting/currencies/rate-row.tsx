"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react";
import { upsertExchangeRate, deleteExchangeRate } from "@/lib/actions/currency";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface Rate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: Date;
}

export function RateRow({ rate, baseCurrency }: { rate: Rate; baseCurrency: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newRate, setNewRate] = useState(String(rate.rate));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const info = SUPPORTED_CURRENCIES.find((c) => c.code === rate.fromCurrency);

  async function handleSave() {
    const rateNum = parseFloat(newRate);
    if (!rateNum || rateNum <= 0) return;
    setSaving(true);
    try {
      await upsertExchangeRate(rate.fromCurrency, rateNum);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${rate.fromCurrency} exchange rate?`)) return;
    setDeleting(true);
    try {
      await deleteExchangeRate(rate.id);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
          {info?.symbol ?? rate.fromCurrency.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{rate.fromCurrency}</p>
          <p className="text-xs text-muted-foreground truncate">{info?.name ?? ""}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <span className="text-xs text-muted-foreground">1 {rate.fromCurrency} =</span>
            <Input
              type="number"
              min="0"
              step="any"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="w-28 h-8 text-sm"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">{baseCurrency}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(false); setNewRate(String(rate.rate)); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <div className="text-right">
              <p className="text-sm font-semibold">
                1 {rate.fromCurrency} = {rate.rate.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} {baseCurrency}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(rate.effectiveDate).toLocaleDateString("pt-AO")}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

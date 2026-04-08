"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateBaseCurrency } from "@/lib/actions/currency";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export function BaseCurrencyForm({ current }: { current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const isDirty = value !== current;

  async function handleSave() {
    if (!isDirty) return;
    if (!confirm(`Change base currency to ${value}? This affects all reports and new transactions.`)) return;
    setSaving(true);
    try {
      await updateBaseCurrency(value);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs">Change Base Currency</Label>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name} ({c.symbol})
            </option>
          ))}
        </select>
      </div>
      <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Save
      </Button>
    </div>
  );
}

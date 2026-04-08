"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Loader2, Plus } from "lucide-react";
import { createPosConfig } from "@/lib/actions/pos";

export function ConfigForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultTaxRate, setDefaultTaxRate] = useState("14");
  const [allowDiscount, setAllowDiscount] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createPosConfig({
        name: name.trim(),
        description: description.trim() || undefined,
        defaultTaxRate: parseFloat(defaultTaxRate) || 14,
        allowDiscount,
      });
      setName("");
      setDescription("");
      setDefaultTaxRate("14");
      setAllowDiscount(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Terminal Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Counter, Express Lane, Warehouse"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Default Tax Rate (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={defaultTaxRate}
            onChange={(e) => setDefaultTaxRate(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="text-sm font-medium">Allow Discounts</p>
            <p className="text-xs text-muted-foreground">Cashiers can apply line discounts</p>
          </div>
          <input type="checkbox" checked={allowDiscount} onChange={(e) => setAllowDiscount(e.target.checked)} className="h-4 w-4 cursor-pointer" />
        </div>
      </div>
      <Button type="submit" disabled={saving || !name.trim()}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Create Terminal
      </Button>
    </form>
  );
}

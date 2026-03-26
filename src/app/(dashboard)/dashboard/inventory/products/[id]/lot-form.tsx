"use client";

import { useState } from "react";
import { createLot } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LotForm({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    await createLot({
      lotNumber: data.get("lotNumber") as string,
      expiryDate: data.get("expiryDate") as string || undefined,
      productId,
    });
    form.reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="space-y-2">
        <Label htmlFor="lotNumber">Lot Number *</Label>
        <Input id="lotNumber" name="lotNumber" required placeholder="e.g. LOT-2026-001" className="w-48" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input id="expiryDate" name="expiryDate" type="date" className="w-40" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Lot
      </Button>
    </form>
  );
}

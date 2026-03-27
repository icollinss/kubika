"use client";

import { useState } from "react";
import { recordPayment } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Props { invoiceId: string; amountDue: number }

export function PaymentForm({ invoiceId, amountDue }: Props) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("CASH");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    await recordPayment({
      invoiceId,
      amount: parseFloat(data.get("amount") as string),
      method: method as "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CHECK" | "CREDIT",
      reference: data.get("reference") as string || undefined,
      paidAt: data.get("paidAt") as string || undefined,
      notes: data.get("notes") as string || undefined,
    });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Amount (AOA) *</Label>
        <Input name="amount" type="number" step="0.01" min="0.01" defaultValue={amountDue.toFixed(2)} required />
        <p className="text-xs text-muted-foreground">Amount due: {amountDue.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</p>
      </div>
      <div className="space-y-2">
        <Label>Payment Method *</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="MOBILE_MONEY">Mobile Money (Multicaixa)</SelectItem>
            <SelectItem value="CHECK">Check</SelectItem>
            <SelectItem value="CREDIT">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Payment Date</Label>
        <Input name="paidAt" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
      </div>
      <div className="space-y-2">
        <Label>Reference</Label>
        <Input name="reference" placeholder="e.g. TRF-123456" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Notes</Label>
        <Input name="notes" placeholder="Optional notes..." />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Payment
        </Button>
      </div>
    </form>
  );
}

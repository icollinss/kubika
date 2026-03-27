"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJournalEntry } from "@/lib/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Account { id: string; code: string; name: string; type: string }
interface Line { debitAccountId: string; creditAccountId: string; amount: string; description: string }

export function NewJournalEntryForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { debitAccountId: "", creditAccountId: "", amount: "", description: "" },
  ]);

  function addLine() {
    setLines((prev) => [...prev, { debitAccountId: "", creditAccountId: "", amount: "", description: "" }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof Line, value: string) {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  const totalDebit = lines.reduce((s, l) => s + (l.debitAccountId ? parseFloat(l.amount || "0") : 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.creditAccountId ? parseFloat(l.amount || "0") : 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!balanced) return;
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    await createJournalEntry({
      date: fd.get("date") as string,
      description: fd.get("description") as string,
      reference: fd.get("reference") as string || undefined,
      lines: lines.map((l) => ({
        debitAccountId: l.debitAccountId || undefined,
        creditAccountId: l.creditAccountId || undefined,
        amount: parseFloat(l.amount || "0"),
        description: l.description || undefined,
      })),
    });
    setLoading(false);
    router.push("/dashboard/accounting/journal");
  }

  const AccountSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className="text-xs h-8">
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— None —</SelectItem>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.code} · {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description *</Label>
          <Input name="description" placeholder="e.g. Cash sale to customer" required />
        </div>
        <div className="space-y-2">
          <Label>Reference</Label>
          <Input name="reference" placeholder="e.g. SO/2026/0001" />
        </div>
      </div>

      {/* Lines */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-[2fr_2fr_1fr_2fr_auto] gap-2">
          <span>Debit Account</span>
          <span>Credit Account</span>
          <span>Amount (AOA)</span>
          <span>Description</span>
          <span />
        </div>
        <div className="divide-y">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[2fr_2fr_1fr_2fr_auto] gap-2 px-4 py-2 items-center">
              <AccountSelect value={line.debitAccountId} onChange={(v) => updateLine(i, "debitAccountId", v)} />
              <AccountSelect value={line.creditAccountId} onChange={(v) => updateLine(i, "creditAccountId", v)} />
              <Input
                className="h-8 text-xs"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={line.amount}
                onChange={(e) => updateLine(i, "amount", e.target.value)}
              />
              <Input
                className="h-8 text-xs"
                placeholder="Optional"
                value={line.description}
                onChange={(e) => updateLine(i, "description", e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(i)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t flex items-center justify-between text-xs">
          <Button type="button" variant="ghost" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Line
          </Button>
          <div className="flex gap-6 font-mono">
            <span>Debit: <strong>{totalDebit.toFixed(2)}</strong></span>
            <span>Credit: <strong>{totalCredit.toFixed(2)}</strong></span>
            {!balanced && <span className="text-destructive font-semibold">Out of balance</span>}
            {balanced && totalDebit > 0 && <span className="text-green-600 font-semibold">Balanced ✓</span>}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading || !balanced || totalDebit === 0}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Journal Entry
      </Button>
    </form>
  );
}

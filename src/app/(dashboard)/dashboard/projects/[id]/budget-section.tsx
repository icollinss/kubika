"use client";

import { useState } from "react";
import { addProjectExpense } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string | null;
  reference: string | null;
}

const CATEGORIES = ["Labour", "Materials", "Travel", "Equipment", "Subcontractor", "Overhead", "Other"];

export function BudgetSection({ projectId, expenses, budget }: { projectId: string; expenses: Expense[]; budget: number }) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("Other");
  const router = useRouter();

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = budget - total;
  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await addProjectExpense({
        projectId,
        description: fd.get("description") as string,
        amount: parseFloat(fd.get("amount") as string),
        date: fd.get("date") as string || undefined,
        category,
        reference: fd.get("reference") as string || undefined,
      });
      setAdding(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Budget & Expenses</span>
        <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense
        </Button>
      </div>

      {/* Summary */}
      {budget > 0 && (
        <div className="px-4 py-3 border-b grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="font-mono font-semibold">{fmt(budget)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className={`font-mono font-semibold ${total > budget ? "text-red-600" : ""}`}>{fmt(total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={`font-mono font-semibold ${remaining < 0 ? "text-red-600" : "text-green-700"}`}>{fmt(remaining)}</p>
          </div>
        </div>
      )}

      {/* Spent bar */}
      {budget > 0 && (
        <div className="px-4 py-2 border-b">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${total > budget ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${Math.min(100, (total / budget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Add expense form */}
      {adding && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b bg-muted/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-2 space-y-1">
            <Label className="text-xs">Description *</Label>
            <Input name="description" className="h-8 text-sm" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amount (AOA) *</Label>
            <Input name="amount" type="number" step="0.01" min="0" className="h-8 text-sm" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input name="date" type="date" className="h-8 text-sm" defaultValue={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reference</Label>
            <Input name="reference" className="h-8 text-sm" placeholder="e.g. JE/2026/001" />
          </div>
          <div className="col-span-2 flex gap-2 items-end">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Expense list */}
      {expenses.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">No expenses recorded.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Category</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Reference</th>
              <th className="px-4 py-2 text-right">Amount (AOA)</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2 text-muted-foreground">{format(new Date(exp.date), "dd/MM/yyyy")}</td>
                <td className="px-4 py-2">{exp.description}</td>
                <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{exp.category ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground hidden sm:table-cell">{exp.reference ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(exp.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-semibold border-t">
              <td className="px-4 py-2" colSpan={4}>Total</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

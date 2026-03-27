import { getJournalEntries } from "@/lib/actions/accounting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-sm text-muted-foreground mt-1">{entries.length} entries</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounting/journal/new">
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Link>
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg">
          <p className="text-muted-foreground text-sm">No journal entries yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard/accounting/journal/new">Create First Entry</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Number</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Reference</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Total Debit</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const totalDebit = entry.lines.reduce((s, l) => s + (l.debitAccountId ? l.amount : 0), 0);
                return (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{entry.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(entry.date), "dd/MM/yyyy")}</td>
                    <td className="px-4 py-3 font-medium">{entry.description}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{entry.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono hidden sm:table-cell">
                      {totalDebit.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColor[entry.status] ?? ""}>
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/accounting/journal/${entry.id}`} className="text-xs text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

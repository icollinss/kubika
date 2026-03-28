import { getJournalEntry } from "@/lib/actions/accounting";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PostEntryButton } from "./post-entry-button";

const statusColor: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  POSTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function JournalEntryPage({ params }: { params: { id: string } }) {
  const entry = await getJournalEntry(params.id);
  if (!entry) notFound();

  const totalDebit = entry.lines.filter((l) => l.debitAccountId).reduce((s, l) => s + l.amount, 0);
  const totalCredit = entry.lines.filter((l) => l.creditAccountId).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{entry.number}</h1>
          <p className="text-sm text-muted-foreground mt-1">{format(new Date(entry.date), "dd MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={statusColor[entry.status] ?? ""}>
            {entry.status}
          </Badge>
          {entry.status === "DRAFT" && <PostEntryButton entryId={entry.id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
        <div>
          <span className="text-muted-foreground">Description</span>
          <p className="font-medium mt-0.5">{entry.description}</p>
        </div>
        {entry.reference && (
          <div>
            <span className="text-muted-foreground">Reference</span>
            <p className="font-medium mt-0.5">{entry.reference}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Type</span>
          <p className="font-medium mt-0.5">{entry.entryType}</p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Debit Account</th>
              <th className="px-4 py-2 text-left font-medium">Credit Account</th>
              <th className="px-4 py-2 text-right font-medium">Amount (AOA)</th>
              <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((line) => (
              <tr key={line.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2">
                  {line.debitAccount
                    ? <span className="font-mono text-xs">{line.debitAccount.code}</span>
                    : <span className="text-muted-foreground">—</span>}
                  {line.debitAccount && <span className="ml-2">{line.debitAccount.name}</span>}
                </td>
                <td className="px-4 py-2">
                  {line.creditAccount
                    ? <span className="font-mono text-xs">{line.creditAccount.code}</span>
                    : <span className="text-muted-foreground">—</span>}
                  {line.creditAccount && <span className="ml-2">{line.creditAccount.name}</span>}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {line.amount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{line.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 border-t font-semibold">
              <td className="px-4 py-2" colSpan={2}>Totals</td>
              <td className="px-4 py-2 text-right font-mono">
                <div className="text-xs text-muted-foreground">Dr: {totalDebit.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-muted-foreground">Cr: {totalCredit.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</div>
              </td>
              <td className="px-4 py-2 hidden sm:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

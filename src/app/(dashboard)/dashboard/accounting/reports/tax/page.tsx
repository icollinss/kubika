import { getTaxSummary } from "@/lib/actions/accounting";
import { TaxFilters } from "./tax-filters";
import { Badge } from "@/components/ui/badge";

interface SearchParams { period?: string }

export default async function TaxPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const period = searchParams.period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const entries = await getTaxSummary(period);

  const totalBase = entries.reduce((s, e) => s + e.baseAmount, 0);
  const totalTax = entries.reduce((s, e) => s + e.taxAmount, 0);

  const taxTypeColor: Record<string, string> = {
    IVA: "bg-blue-100 text-blue-800",
    IRT: "bg-purple-100 text-purple-800",
    II: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tax Summary</h1>
        <p className="text-sm text-muted-foreground mt-1">Period: {period}</p>
      </div>

      <TaxFilters defaultPeriod={period} />

      {entries.length === 0 ? (
        <div className="text-center py-16 border rounded-lg text-muted-foreground text-sm">
          No tax entries for this period.
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-right font-medium">Rate</th>
                  <th className="px-4 py-2 text-right font-medium">Base Amount</th>
                  <th className="px-4 py-2 text-right font-medium">Tax Amount</th>
                  <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Reference</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <Badge variant="outline" className={taxTypeColor[e.taxType] ?? ""}>
                        {e.taxType}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">{(e.rate * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {e.baseAmount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {e.taxAmount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{e.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t font-semibold">
                  <td className="px-4 py-2" colSpan={2}>Totals</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {totalBase.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {totalTax.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 hidden sm:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

import { getProfitAndLoss } from "@/lib/actions/accounting";
import { PLFilters } from "./pl-filters";

interface SearchParams { from?: string; to?: string }

export default async function PLPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const from = searchParams.from ?? `${now.getFullYear()}-01-01`;
  const to = searchParams.to ?? now.toISOString().split("T")[0];

  const { revenue, expenses, totalRevenue, totalExpenses, netProfit } = await getProfitAndLoss(from, to);

  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profit & Loss</h1>
        <p className="text-sm text-muted-foreground mt-1">Income Statement</p>
      </div>

      <PLFilters defaultFrom={from} defaultTo={to} />

      {/* Revenue */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-green-50 border-b px-4 py-2 font-semibold text-green-800 text-sm">Revenue</div>
        <table className="w-full text-sm">
          <tbody>
            {revenue.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-3 text-muted-foreground text-center">No revenue in period</td></tr>
            )}
            {revenue.map((r) => (
              <tr key={r.code} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2">
                  <span className="font-mono text-xs text-muted-foreground mr-2">{r.code}</span>
                  {r.name}
                </td>
                <td className="px-4 py-2 text-right font-mono">{fmt(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-green-50 border-t font-semibold">
              <td className="px-4 py-2">Total Revenue</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(totalRevenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Expenses */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-red-50 border-b px-4 py-2 font-semibold text-red-800 text-sm">Expenses</div>
        <table className="w-full text-sm">
          <tbody>
            {expenses.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-3 text-muted-foreground text-center">No expenses in period</td></tr>
            )}
            {expenses.map((r) => (
              <tr key={r.code} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2">
                  <span className="font-mono text-xs text-muted-foreground mr-2">{r.code}</span>
                  {r.name}
                </td>
                <td className="px-4 py-2 text-right font-mono">{fmt(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-red-50 border-t font-semibold">
              <td className="px-4 py-2">Total Expenses</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(totalExpenses)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Net */}
      <div className={`rounded-lg border px-4 py-4 flex items-center justify-between font-bold text-lg ${netProfit >= 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
        <span>{netProfit >= 0 ? "Net Profit" : "Net Loss"}</span>
        <span className="font-mono">{fmt(Math.abs(netProfit))} AOA</span>
      </div>
    </div>
  );
}

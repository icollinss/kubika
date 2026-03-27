import { getBalanceSheet } from "@/lib/actions/accounting";
import { BSFilters } from "./bs-filters";

interface SearchParams { asOf?: string }

export default async function BalanceSheetPage({ searchParams }: { searchParams: SearchParams }) {
  const asOf = searchParams.asOf ?? new Date().toISOString().split("T")[0];
  const { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity } = await getBalanceSheet(asOf);

  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  const Section = ({
    title,
    items,
    total,
    colorClass,
  }: {
    title: string;
    items: { code: string; name: string; balance: number }[];
    total: number;
    colorClass: string;
  }) => (
    <div className="rounded-lg border overflow-hidden">
      <div className={`border-b px-4 py-2 font-semibold text-sm ${colorClass}`}>{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={2} className="px-4 py-3 text-muted-foreground text-center">No balances</td></tr>
          )}
          {items.map((r) => (
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
          <tr className="border-t font-semibold bg-muted/30">
            <td className="px-4 py-2">Total {title}</td>
            <td className="px-4 py-2 text-right font-mono">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Balance Sheet</h1>
        <p className="text-sm text-muted-foreground mt-1">Statement of Financial Position</p>
      </div>

      <BSFilters defaultAsOf={asOf} />

      <Section title="Assets" items={assets} total={totalAssets} colorClass="bg-blue-50 text-blue-800" />
      <Section title="Liabilities" items={liabilities} total={totalLiabilities} colorClass="bg-red-50 text-red-800" />
      <Section title="Equity" items={equity} total={totalEquity} colorClass="bg-purple-50 text-purple-800" />

      <div className="rounded-lg border px-4 py-4 flex items-center justify-between font-bold text-base bg-muted/30">
        <span>Liabilities + Equity</span>
        <span className="font-mono">{fmt(totalLiabilities + totalEquity)} AOA</span>
      </div>

      {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 1 && (
        <p className="text-xs text-destructive font-medium">
          ⚠ Balance sheet is out of balance by {fmt(Math.abs(totalAssets - totalLiabilities - totalEquity))} AOA
        </p>
      )}
    </div>
  );
}

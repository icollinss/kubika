import { cn } from "@/lib/utils";

export interface PivotRow {
  group: string;
  count: number;
  total?: number;
  paid?: number;
  due?: number;
  extra?: Record<string, number | string>;
}

interface PivotTableProps {
  rows: PivotRow[];
  groupLabel?: string;
  showTotal?: boolean;
  showPaid?: boolean;
  showDue?: boolean;
  extraColumns?: { key: string; label: string; format?: "currency" | "number" | "text" }[];
}

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

export function PivotTable({
  rows,
  groupLabel = "Grupo",
  showTotal = true,
  showPaid = false,
  showDue = false,
  extraColumns = [],
}: PivotTableProps) {
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalTotal = rows.reduce((s, r) => s + (r.total ?? 0), 0);
  const totalPaid  = rows.reduce((s, r) => s + (r.paid ?? 0), 0);
  const totalDue   = rows.reduce((s, r) => s + (r.due ?? 0), 0);

  // Bar chart width for visual flair
  const maxTotal = Math.max(...rows.map((r) => r.total ?? r.count));

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{groupLabel}</th>
            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-20">Qtd</th>
            {showTotal && <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total (AOA)</th>}
            {showPaid  && <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pago (AOA)</th>}
            {showDue   && <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Em Aberto (AOA)</th>}
            {extraColumns.map((c) => (
              <th key={c.key} className="text-right px-4 py-2.5 font-medium text-muted-foreground">{c.label}</th>
            ))}
            <th className="px-4 py-2.5 w-40"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const barWidth = maxTotal > 0 ? Math.round(((row.total ?? row.count) / maxTotal) * 100) : 0;
            return (
              <tr key={row.group} className={cn("border-b last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                <td className="px-4 py-2.5 font-medium">{row.group}</td>
                <td className="text-right px-4 py-2.5 tabular-nums text-muted-foreground">{row.count}</td>
                {showTotal && (
                  <td className="text-right px-4 py-2.5 font-mono font-semibold">{fmt(row.total ?? 0)}</td>
                )}
                {showPaid && (
                  <td className="text-right px-4 py-2.5 font-mono text-green-600">{fmt(row.paid ?? 0)}</td>
                )}
                {showDue && (
                  <td className={cn("text-right px-4 py-2.5 font-mono", (row.due ?? 0) > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground")}>
                    {fmt(row.due ?? 0)}
                  </td>
                )}
                {extraColumns.map((c) => {
                  const val = row.extra?.[c.key];
                  return (
                    <td key={c.key} className="text-right px-4 py-2.5 tabular-nums text-muted-foreground">
                      {c.format === "currency" && typeof val === "number" ? fmt(val) : val ?? "—"}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${barWidth}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/30 font-semibold">
            <td className="px-4 py-2.5">Total</td>
            <td className="text-right px-4 py-2.5 tabular-nums">{totalCount}</td>
            {showTotal && <td className="text-right px-4 py-2.5 font-mono">{fmt(totalTotal)}</td>}
            {showPaid  && <td className="text-right px-4 py-2.5 font-mono text-green-600">{fmt(totalPaid)}</td>}
            {showDue   && <td className="text-right px-4 py-2.5 font-mono text-orange-600">{fmt(totalDue)}</td>}
            {extraColumns.map((c) => <td key={c.key} className="px-4 py-2.5" />)}
            <td className="px-4 py-2.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

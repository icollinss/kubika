import { getPayslips } from "@/lib/actions/hr";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GeneratePayrollButton } from "./generate-payroll-button";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; accent: string; tagColor: string; badgeClass: string }> = {
  DRAFT:     { label: "Draft",     accent: "border-l-yellow-400", tagColor: "bg-yellow-100 text-yellow-800", badgeClass: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", accent: "border-l-blue-500",   tagColor: "bg-blue-100 text-blue-800",    badgeClass: "bg-blue-100 text-blue-800" },
  PAID:      { label: "Paid",      accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-800",  badgeClass: "bg-green-100 text-green-800" },
};

const STATUS_ORDER = ["DRAFT", "CONFIRMED", "PAID"];

const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

interface Props { searchParams: Promise<{ period?: string; view?: string }> }

export default async function PayrollPage({ searchParams }: Props) {
  const { period: rawPeriod, view = "list" } = await searchParams;
  const now = new Date();
  const period = rawPeriod ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentView = view as ViewMode;
  const payslips = await getPayslips(period);

  const totalGross = payslips.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet   = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalIRT   = payslips.reduce((s, p) => s + p.irtAmount, 0);
  const totalINSS  = payslips.reduce((s, p) => s + p.inssEmployee + p.inssEmployer, 0);

  // Kanban by status
  const kanbanColumns: KanbanColumn[] = STATUS_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, total: 0, cards: [],
  }));
  for (const ps of payslips) {
    const col = kanbanColumns.find((c) => c.id === ps.status);
    if (!col) continue;
    col.count++;
    col.total = (col.total ?? 0) + ps.netSalary;
    col.cards.push({
      id: ps.id, href: `/dashboard/hr/payroll/${ps.id}`,
      title: `${ps.employee.firstName} ${ps.employee.lastName}`,
      subtitle: ps.number,
      value: ps.netSalary,
      tag: statusConfig[ps.status]?.label,
      tagColor: statusConfig[ps.status]?.tagColor,
      initials: `${ps.employee.firstName[0]}${ps.employee.lastName[0]}`.toUpperCase(),
    });
  }

  // Pivot by status
  const pivotRows: PivotRow[] = STATUS_ORDER.map((s) => {
    const group = payslips.filter((p) => p.status === s);
    return { group: statusConfig[s].label, count: group.length, total: group.reduce((sum, p) => sum + p.netSalary, 0) };
  }).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">Period: {period}</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <GeneratePayrollButton period={period} />
        </div>
      </div>

      {/* Period selector — preserves current view */}
      <form method="get" className="flex gap-2 items-center">
        <input name="period" type="month" defaultValue={period} className="border rounded-md px-3 py-1.5 text-sm h-9" />
        {currentView !== "list" && <input type="hidden" name="view" value={currentView} />}
        <button type="submit" className="border rounded-md px-3 py-1.5 text-sm h-9 hover:bg-muted transition-colors">Apply</button>
      </form>

      {/* Summary cards */}
      {payslips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Gross Payroll", value: fmt(totalGross), color: "text-foreground" },
            { label: "Total IRT",     value: fmt(totalIRT),   color: "text-red-600" },
            { label: "Total INSS",    value: fmt(totalINSS),  color: "text-orange-600" },
            { label: "Net Payroll",   value: fmt(totalNet),   color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {payslips.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <p className="text-muted-foreground text-sm">No payslips for {period}.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Generate Payroll" to create payslips for all active employees.</p>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Gross (AOA)</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">IRT</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">INSS</TableHead>
                    <TableHead className="text-right">Net (AOA)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((ps) => (
                    <TableRow key={ps.id} className="hover:bg-muted/20 cursor-pointer">
                      <TableCell className="p-0">
                        <Link href={`/dashboard/hr/payroll/${ps.id}`} className="flex flex-col px-4 py-2.5 hover:underline">
                          <span className="font-medium">{ps.employee.firstName} {ps.employee.lastName}</span>
                          <span className="text-xs font-mono text-muted-foreground">{ps.number}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono hidden sm:table-cell">{fmt(ps.grossSalary)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600 hidden sm:table-cell">{fmt(ps.irtAmount)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600 hidden sm:table-cell">{fmt(ps.inssEmployee)}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{fmt(ps.netSalary)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[ps.status]?.badgeClass ?? ""}>{statusConfig[ps.status]?.label ?? ps.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Status" showTotal />}
        </>
      )}
    </div>
  );
}

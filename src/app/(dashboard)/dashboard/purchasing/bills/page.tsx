import Link from "next/link";
import { getBills } from "@/lib/actions/purchasing";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { BillsFilter } from "./bills-filter";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; accent: string; tagColor: string }> = {
  DRAFT:     { label: "Draft",     variant: "outline",     accent: "border-l-gray-400",   tagColor: "bg-gray-100 text-gray-600" },
  CONFIRMED: { label: "Confirmed", variant: "default",     accent: "border-l-blue-500",   tagColor: "bg-blue-100 text-blue-700" },
  PAID:      { label: "Paid",      variant: "secondary",   accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-700" },
  PARTIAL:   { label: "Partial",   variant: "secondary",   accent: "border-l-yellow-500", tagColor: "bg-yellow-100 text-yellow-700" },
  OVERDUE:   { label: "Overdue",   variant: "destructive", accent: "border-l-red-500",    tagColor: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", variant: "destructive", accent: "border-l-red-300",    tagColor: "bg-red-50 text-red-400" },
};

const STAGE_ORDER = ["DRAFT", "CONFIRMED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"];

function fmt(n: number) { return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 }); }

interface Props { searchParams: Promise<{ status?: string; view?: string }> }

export default async function BillsPage({ searchParams }: Props) {
  const { status, view = "list" } = await searchParams;
  const currentView = view as ViewMode;
  const bills = await getBills(status);

  // Kanban
  const kanbanColumns: KanbanColumn[] = STAGE_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, total: 0, cards: [],
  }));
  for (const b of bills) {
    const col = kanbanColumns.find((c) => c.id === b.status);
    if (!col) continue;
    col.count++;
    col.total = (col.total ?? 0) + b.total;
    col.cards.push({
      id: b.id, href: `/dashboard/purchasing/bills/${b.id}`,
      title: b.number,
      subtitle: b.supplier.name,
      value: b.total,
      tag: statusConfig[b.status]?.label,
      tagColor: statusConfig[b.status]?.tagColor,
    });
  }

  // Pivot by status
  const pivotRows: PivotRow[] = STAGE_ORDER.map((s) => {
    const group = bills.filter((b) => b.status === s);
    return { group: statusConfig[s].label, count: group.length, total: group.reduce((sum, b) => sum + b.total, 0) };
  }).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supplier Bills</h2>
          <p className="text-muted-foreground text-sm mt-1">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
        </div>
        <ViewSwitcher current={currentView} />
      </div>

      <BillsFilter />

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No supplier bills yet</p>
          <p className="text-sm text-muted-foreground mt-1">Bills are generated from purchase orders.</p>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead><TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead><TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => {
                    const cfg = statusConfig[bill.status];
                    const totalPaid = bill.payments.reduce((s, p) => s + p.amount, 0);
                    return (
                      <TableRow key={bill.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell>
                          <Link href={`/dashboard/purchasing/bills/${bill.id}`} className="font-mono font-medium hover:underline">{bill.number}</Link>
                        </TableCell>
                        <TableCell className="font-medium">{bill.supplier.name}</TableCell>
                        <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(bill.billDate).toLocaleDateString("pt-AO")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString("pt-AO") : "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(bill.total)}</TableCell>
                        <TableCell className="text-right text-green-600">{fmt(totalPaid)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{fmt(bill.amountDue)}</TableCell>
                      </TableRow>
                    );
                  })}
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

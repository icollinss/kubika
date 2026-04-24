import Link from "next/link";
import { getOperations } from "@/lib/actions/stock-operations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ClipboardList, RotateCcw, Trash2 } from "lucide-react";
import { OperationsFilter } from "./operations-filter";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType; accent: string; tagColor: string }> = {
  RECEIPT:    { label: "Receipt",    variant: "default",     icon: ArrowDownToLine, accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-700" },
  DELIVERY:   { label: "Delivery",   variant: "secondary",   icon: ArrowUpFromLine, accent: "border-l-blue-500",   tagColor: "bg-blue-100 text-blue-700" },
  INTERNAL:   { label: "Transfer",   variant: "outline",     icon: ArrowLeftRight,  accent: "border-l-purple-500", tagColor: "bg-purple-100 text-purple-700" },
  ADJUSTMENT: { label: "Adjustment", variant: "outline",     icon: ClipboardList,   accent: "border-l-orange-500", tagColor: "bg-orange-100 text-orange-700" },
  RETURN:     { label: "Return",     variant: "secondary",   icon: RotateCcw,       accent: "border-l-yellow-500", tagColor: "bg-yellow-100 text-yellow-700" },
  SCRAP:      { label: "Scrap",      variant: "destructive", icon: Trash2,          accent: "border-l-red-500",    tagColor: "bg-red-100 text-red-700" },
};

const TYPE_ORDER = ["RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT", "RETURN", "SCRAP"];

interface Props { searchParams: Promise<{ type?: string; view?: string }> }

export default async function OperationsPage({ searchParams }: Props) {
  const { type, view = "list" } = await searchParams;
  const currentView = view as ViewMode;
  const operations = await getOperations(type);

  // Kanban by move type
  const kanbanColumns: KanbanColumn[] = TYPE_ORDER.map((t) => ({
    id: t, label: typeConfig[t].label, accent: typeConfig[t].accent,
    count: 0, cards: [],
  }));
  for (const op of operations) {
    const col = kanbanColumns.find((c) => c.id === op.moveType);
    if (!col) continue;
    col.count++;
    col.cards.push({
      id: op.id, href: "#",
      title: op.product.name,
      subtitle: [op.fromLocation?.name, op.toLocation?.name].filter(Boolean).join(" → ") || undefined,
      tag: typeConfig[op.moveType]?.label,
      tagColor: typeConfig[op.moveType]?.tagColor,
      meta: `Qty: ${op.quantity}`,
    });
  }

  // Pivot by type
  const pivotRows: PivotRow[] = TYPE_ORDER.map((t) => ({
    group: typeConfig[t].label,
    count: operations.filter((o) => o.moveType === t).length,
    total: 0,
  })).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Operations</h2>
          <p className="text-muted-foreground text-sm mt-1">{operations.length} operation{operations.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/inventory/operations/new?type=ADJUSTMENT"><ClipboardList className="h-4 w-4 mr-1" />Adjustment</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/inventory/operations/new?type=INTERNAL"><ArrowLeftRight className="h-4 w-4 mr-1" />Transfer</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/inventory/operations/new?type=DELIVERY"><ArrowUpFromLine className="h-4 w-4 mr-1" />Delivery</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/inventory/operations/new?type=RECEIPT"><ArrowDownToLine className="h-4 w-4 mr-1" />Receipt</Link>
            </Button>
          </div>
        </div>
      </div>

      <OperationsFilter />

      {operations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No operations yet</p>
          <p className="text-sm text-muted-foreground mt-1">Record a receipt, delivery, or adjustment to start tracking stock movements.</p>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Type</TableHead>
                    <TableHead>Product</TableHead><TableHead>From</TableHead>
                    <TableHead>To</TableHead><TableHead>Lot / Serial</TableHead>
                    <TableHead>Reference</TableHead><TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => {
                    const cfg = typeConfig[op.moveType];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={op.id}>
                        <TableCell className="text-sm">{new Date(op.movedAt).toLocaleDateString("pt-AO")}</TableCell>
                        <TableCell><Badge variant={cfg.variant} className="gap-1"><Icon className="h-3 w-3" />{cfg.label}</Badge></TableCell>
                        <TableCell className="font-medium">
                          {op.product.name}
                          {op.product.internalRef && <span className="text-muted-foreground text-xs ml-1">[{op.product.internalRef}]</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{op.fromLocation?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{op.toLocation?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{op.lot?.lotNumber ?? op.serial?.serial ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{op.reference ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">{op.quantity}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Type" showTotal={false} />}
        </>
      )}
    </div>
  );
}

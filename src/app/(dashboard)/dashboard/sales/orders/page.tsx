import Link from "next/link";
import { getSalesOrders } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart } from "lucide-react";
import { SalesFilter } from "./sales-filter";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; accent: string; tagColor: string }> = {
  QUOTATION:  { label: "Proposta",   variant: "outline",     accent: "border-l-gray-400",  tagColor: "bg-gray-100 text-gray-600" },
  CONFIRMED:  { label: "Confirmado", variant: "default",     accent: "border-l-blue-500",  tagColor: "bg-blue-100 text-blue-700" },
  DELIVERED:  { label: "Entregue",   variant: "secondary",   accent: "border-l-green-500", tagColor: "bg-green-100 text-green-700" },
  CANCELLED:  { label: "Cancelado",  variant: "destructive", accent: "border-l-red-400",   tagColor: "bg-red-100 text-red-500" },
};

const STATUS_ORDER = ["QUOTATION", "CONFIRMED", "DELIVERED", "CANCELLED"];

interface Props {
  searchParams: Promise<{ status?: string; search?: string; view?: string }>;
}

export default async function SalesOrdersPage({ searchParams }: Props) {
  const { status, search, view = "list" } = await searchParams;
  const orders = await getSalesOrders(status, search);
  const currentView = (view as ViewMode) || "list";

  // ── Kanban ────────────────────────────────────────────────────────────────
  const kanbanColumns: KanbanColumn[] = STATUS_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, total: 0, cards: [],
  }));
  for (const o of orders) {
    const col = kanbanColumns.find((k) => k.id === o.status);
    if (!col) continue;
    col.count++;
    col.total = (col.total ?? 0) + o.total;
    col.cards.push({
      id: o.id, href: `/dashboard/sales/orders/${o.id}`,
      title: o.customer.name, subtitle: o.number,
      tag: statusConfig[o.status].label, tagColor: statusConfig[o.status].tagColor,
      value: o.total, meta: new Date(o.orderDate).toLocaleDateString("pt-AO"),
      initials: o.customer.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    });
  }

  // ── Pivot: by month ───────────────────────────────────────────────────────
  const monthMap = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const key = new Date(o.orderDate).toLocaleDateString("pt-AO", { month: "long", year: "numeric" });
    const cur = monthMap.get(key) ?? { count: 0, total: 0 };
    monthMap.set(key, { count: cur.count + 1, total: cur.total + o.total });
  }
  const pivotRows: PivotRow[] = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([group, { count, total }]) => ({ group, count, total }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Encomendas de Venda</h2>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} encomenda{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild>
            <Link href="/dashboard/sales/orders/new"><Plus className="h-4 w-4 mr-2" />Nova Proposta</Link>
          </Button>
        </div>
      </div>

      <SalesFilter />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sem encomendas ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Crie a sua primeira proposta para começar.</p>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead><TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead><TableHead>Data</TableHead>
                    <TableHead>Linhas</TableHead><TableHead>Faturas</TableHead>
                    <TableHead className="text-right">Total (AOA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const cfg = statusConfig[order.status];
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="p-0">
                          <Link href={`/dashboard/sales/orders/${order.id}`} className="flex items-center px-4 py-3 font-mono font-medium hover:underline">{order.number}</Link>
                        </TableCell>
                        <TableCell className="font-medium">{order.customer.name}</TableCell>
                        <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(order.orderDate).toLocaleDateString("pt-AO")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{order._count.lines}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{order._count.invoices}</TableCell>
                        <TableCell className="text-right font-semibold">{order.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Mês" showTotal />}
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { getInvoices } from "@/lib/actions/sales";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { InvoicesFilter } from "./invoices-filter";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; accent: string; tagColor: string }> = {
  DRAFT:      { label: "Rascunho",   variant: "outline",     accent: "border-l-gray-400",    tagColor: "bg-gray-100 text-gray-600" },
  CONFIRMED:  { label: "Confirmada", variant: "default",     accent: "border-l-blue-500",    tagColor: "bg-blue-100 text-blue-700" },
  PAID:       { label: "Paga",       variant: "secondary",   accent: "border-l-green-500",   tagColor: "bg-green-100 text-green-700" },
  PARTIAL:    { label: "Parcial",    variant: "secondary",   accent: "border-l-yellow-500",  tagColor: "bg-yellow-100 text-yellow-700" },
  OVERDUE:    { label: "Vencida",    variant: "destructive", accent: "border-l-red-500",     tagColor: "bg-red-100 text-red-700" },
  CANCELLED:  { label: "Cancelada",  variant: "destructive", accent: "border-l-red-300",     tagColor: "bg-red-50 text-red-400" },
};

const STATUS_ORDER = ["DRAFT", "CONFIRMED", "PARTIAL", "OVERDUE", "PAID", "CANCELLED"];

interface Props { searchParams: Promise<{ status?: string; view?: string }> }

export default async function InvoicesPage({ searchParams }: Props) {
  const { status, view = "list" } = await searchParams;
  const invoices = await getInvoices(status);
  const currentView = (view as ViewMode) || "list";

  // ── Kanban ────────────────────────────────────────────────────────────────
  const kanbanColumns: KanbanColumn[] = STATUS_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, total: 0, cards: [],
  }));
  for (const inv of invoices) {
    const col = kanbanColumns.find((k) => k.id === inv.status);
    if (!col) continue;
    col.count++;
    col.total = (col.total ?? 0) + inv.total;
    col.cards.push({
      id: inv.id, href: `/dashboard/sales/invoices/${inv.id}`,
      title: inv.customer.name, subtitle: inv.number,
      tag: statusConfig[inv.status].label, tagColor: statusConfig[inv.status].tagColor,
      value: inv.amountDue > 0 ? inv.amountDue : inv.total,
      meta: new Date(inv.invoiceDate).toLocaleDateString("pt-AO"),
      initials: inv.customer.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    });
  }

  // ── Pivot: by customer ────────────────────────────────────────────────────
  const customerMap = new Map<string, { count: number; total: number; paid: number; due: number }>();
  for (const inv of invoices) {
    const key = inv.customer.name;
    const totalPaid = inv.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
    const cur = customerMap.get(key) ?? { count: 0, total: 0, paid: 0, due: 0 };
    customerMap.set(key, {
      count: cur.count + 1,
      total: cur.total + inv.total,
      paid:  cur.paid + totalPaid,
      due:   cur.due + inv.amountDue,
    });
  }
  const pivotRows: PivotRow[] = Array.from(customerMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([group, { count, total, paid, due }]) => ({ group, count, total, paid, due }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faturas</h2>
          <p className="text-muted-foreground text-sm mt-1">{invoices.length} fatura{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <ViewSwitcher current={currentView} />
      </div>

      <InvoicesFilter />

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sem faturas ainda</p>
          <p className="text-sm text-muted-foreground mt-1">As faturas são geradas a partir de encomendas confirmadas.</p>
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
                    <TableHead>Vencimento</TableHead><TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pago</TableHead><TableHead className="text-right">Em aberto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const cfg = statusConfig[inv.status];
                    const totalPaid = inv.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="p-0">
                          <Link href={`/dashboard/sales/invoices/${inv.id}`} className="flex items-center px-4 py-3 font-mono font-medium hover:underline">{inv.number}</Link>
                        </TableCell>
                        <TableCell className="font-medium">{inv.customer.name}</TableCell>
                        <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(inv.invoiceDate).toLocaleDateString("pt-AO")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("pt-AO") : "—"}</TableCell>
                        <TableCell className="text-right font-semibold">{inv.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-green-600">{totalPaid.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{inv.amountDue.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Cliente" showTotal showPaid showDue />}
        </>
      )}
    </div>
  );
}

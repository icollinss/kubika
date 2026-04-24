import Link from "next/link";
import { getServiceOrders } from "@/lib/actions/field-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Plus, Calendar, MapPin } from "lucide-react";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; accent: string; tagColor: string }> = {
  DRAFT:       { label: "Draft",       variant: "outline",     accent: "border-l-gray-400",   tagColor: "bg-gray-100 text-gray-600" },
  SCHEDULED:   { label: "Scheduled",   variant: "default",     accent: "border-l-blue-500",   tagColor: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", variant: "default",     accent: "border-l-orange-500", tagColor: "bg-orange-100 text-orange-700" },
  COMPLETED:   { label: "Completed",   variant: "secondary",   accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-700" },
  CANCELLED:   { label: "Cancelled",   variant: "destructive", accent: "border-l-red-400",    tagColor: "bg-red-100 text-red-500" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW:    { label: "Low",    className: "text-blue-600" },
  NORMAL: { label: "Normal", className: "text-gray-600" },
  HIGH:   { label: "High",   className: "text-orange-600" },
  URGENT: { label: "Urgent", className: "text-red-600 font-semibold" },
};

const STAGE_ORDER = ["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

interface Props { searchParams: Promise<{ view?: string }> }

export default async function FieldServicePage({ searchParams }: Props) {
  const { view = "list" } = await searchParams;
  const currentView = view as ViewMode;
  const orders = await getServiceOrders();

  // KPI counts
  const grouped = {
    SCHEDULED:   orders.filter((o) => o.status === "SCHEDULED").length,
    IN_PROGRESS: orders.filter((o) => o.status === "IN_PROGRESS").length,
    COMPLETED:   orders.filter((o) => o.status === "COMPLETED").length,
    DRAFT:       orders.filter((o) => o.status === "DRAFT").length,
  };

  // Kanban by status
  const kanbanColumns: KanbanColumn[] = STAGE_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, cards: [],
  }));
  for (const o of orders) {
    const col = kanbanColumns.find((c) => c.id === o.status);
    if (!col) continue;
    col.count++;
    col.cards.push({
      id: o.id, href: `/dashboard/field-service/${o.id}`,
      title: o.title,
      subtitle: o.customer.name,
      tag: priorityConfig[o.priority]?.label,
      tagColor: o.priority === "URGENT" ? "bg-red-100 text-red-700" :
                o.priority === "HIGH"   ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground",
      meta: o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString("pt-AO") : undefined,
    });
  }

  // Pivot by status
  const pivotRows: PivotRow[] = STAGE_ORDER.map((s) => ({
    group: statusConfig[s].label,
    count: orders.filter((o) => o.status === s).length,
    total: 0,
  })).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">Field Service</h2>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button variant="outline" asChild size="sm">
            <Link href="/dashboard/field-service/worksheets">Worksheets</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/field-service/new"><Plus className="h-4 w-4 mr-1" />New Order</Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Scheduled",   count: grouped.SCHEDULED,   color: "text-blue-600" },
          { label: "In Progress", count: grouped.IN_PROGRESS, color: "text-orange-600" },
          { label: "Completed",   count: grouped.COMPLETED,   color: "text-green-600" },
          { label: "Draft",       count: grouped.DRAFT,       color: "text-gray-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wrench className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
          <p className="font-medium">No service orders yet</p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/dashboard/field-service/new">Create your first order</Link>
          </Button>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead><TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead><TableHead>Technician</TableHead>
                    <TableHead>Priority</TableHead><TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead><TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const sc = statusConfig[o.status];
                    const pc = priorityConfig[o.priority];
                    return (
                      <TableRow key={o.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-mono font-medium">
                          <Link href={`/dashboard/field-service/${o.id}`} className="hover:underline">{o.number}</Link>
                        </TableCell>
                        <TableCell className="font-medium max-w-[180px] truncate">{o.title}</TableCell>
                        <TableCell className="text-sm">{o.customer.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {o.technician ? `${o.technician.firstName} ${o.technician.lastName}` : "—"}
                        </TableCell>
                        <TableCell className={`text-sm ${pc.className}`}>{pc.label}</TableCell>
                        <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {o.scheduledAt ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(o.scheduledAt).toLocaleDateString("pt-AO")}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                          {o.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{o.address}</span>
                            </span>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Status" showTotal={false} />}
        </>
      )}
    </div>
  );
}

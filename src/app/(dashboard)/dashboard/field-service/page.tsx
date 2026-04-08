import Link from "next/link";
import { getServiceOrders } from "@/lib/actions/field-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Plus, Calendar, MapPin } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:       { label: "Draft",       variant: "outline" },
  SCHEDULED:   { label: "Scheduled",   variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED:   { label: "Completed",   variant: "secondary" },
  CANCELLED:   { label: "Cancelled",   variant: "destructive" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW:    { label: "Low",    className: "text-blue-600" },
  NORMAL: { label: "Normal", className: "text-gray-600" },
  HIGH:   { label: "High",   className: "text-orange-600" },
  URGENT: { label: "Urgent", className: "text-red-600 font-semibold" },
};

export default async function FieldServicePage() {
  const orders = await getServiceOrders();

  const grouped = {
    DRAFT:       orders.filter((o) => o.status === "DRAFT"),
    SCHEDULED:   orders.filter((o) => o.status === "SCHEDULED"),
    IN_PROGRESS: orders.filter((o) => o.status === "IN_PROGRESS"),
    COMPLETED:   orders.filter((o) => o.status === "COMPLETED"),
    CANCELLED:   orders.filter((o) => o.status === "CANCELLED"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">Field Service</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/field-service/worksheets">Worksheet Templates</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/field-service/new"><Plus className="h-4 w-4 mr-2" />New Service Order</Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Scheduled", count: grouped.SCHEDULED.length, color: "text-blue-600" },
          { label: "In Progress", count: grouped.IN_PROGRESS.length, color: "text-orange-600" },
          { label: "Completed", count: grouped.COMPLETED.length, color: "text-green-600" },
          { label: "Draft", count: grouped.DRAFT.length, color: "text-gray-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Wrench className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-muted-foreground">No service orders yet.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/field-service/new">Create your first order</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const sc = statusConfig[o.status];
                  const pc = priorityConfig[o.priority];
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-medium">{o.number}</TableCell>
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
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/field-service/${o.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

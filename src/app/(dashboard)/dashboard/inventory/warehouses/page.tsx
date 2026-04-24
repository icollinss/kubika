import Link from "next/link";
import { getWarehouses } from "@/lib/actions/warehouse";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, MapPin } from "lucide-react";
import { NewWarehouseDialog } from "./new-warehouse-dialog";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

interface Props { searchParams: Promise<{ view?: string }> }

export default async function WarehousesPage({ searchParams }: Props) {
  const { view = "kanban" } = await searchParams;
  const currentView = view as ViewMode;
  const warehouses = await getWarehouses();

  const pivotRows: PivotRow[] = warehouses.map((wh) => ({
    group: wh.name,
    count: wh._count.locations,
    total: 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <NewWarehouseDialog />
        </div>
      </div>

      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Warehouse className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No warehouses yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first warehouse to start managing stock locations.</p>
        </div>
      ) : (
        <>
          {currentView === "kanban" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {warehouses.map((wh) => (
                <Link key={wh.id} href={`/dashboard/inventory/warehouses/${wh.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{wh.name}</CardTitle>
                        <Badge variant="outline">{wh.shortCode}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{wh._count.locations} location{wh._count.locations !== 1 ? "s" : ""}</span>
                      </div>
                      {wh.address && <p className="text-sm text-muted-foreground mt-1">{wh.address}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((wh) => (
                    <TableRow key={wh.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="p-0">
                        <Link href={`/dashboard/inventory/warehouses/${wh.id}`} className="flex px-4 py-2.5 font-medium hover:underline">
                          {wh.name}
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant="outline">{wh.shortCode}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{wh._count.locations} locations</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{wh.address ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {currentView === "pivot" && (
            <PivotTable rows={pivotRows} groupLabel="Warehouse" showTotal={false} />
          )}
        </>
      )}
    </div>
  );
}

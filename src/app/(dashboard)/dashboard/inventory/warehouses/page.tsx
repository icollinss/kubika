import Link from "next/link";
import { getWarehouses } from "@/lib/actions/warehouse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Warehouse, MapPin } from "lucide-react";
import { NewWarehouseDialog } from "./new-warehouse-dialog";

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewWarehouseDialog />
      </div>

      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Warehouse className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No warehouses yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first warehouse to start managing stock locations.</p>
        </div>
      ) : (
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
                  {wh.address && (
                    <p className="text-sm text-muted-foreground mt-1">{wh.address}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

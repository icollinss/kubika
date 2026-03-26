import { notFound } from "next/navigation";
import Link from "next/link";
import { getWarehouse, deleteWarehouse, createLocation, deleteLocation } from "@/lib/actions/warehouse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Trash2 } from "lucide-react";
import { NewLocationForm } from "./new-location-form";

const locationTypeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  INTERNAL: "default",
  VENDOR: "secondary",
  CUSTOMER: "outline",
  VIRTUAL: "outline",
  TRANSIT: "secondary",
};

interface Props { params: Promise<{ id: string }> }

export default async function WarehouseDetailPage({ params }: Props) {
  const { id } = await params;
  const warehouse = await getWarehouse(id);
  if (!warehouse) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory/warehouses">
              <ChevronLeft className="h-4 w-4 mr-1" />Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{warehouse.name}</h2>
              <Badge variant="outline">{warehouse.shortCode}</Badge>
            </div>
            {warehouse.address && <p className="text-sm text-muted-foreground">{warehouse.address}</p>}
          </div>
        </div>
        <form action={deleteWarehouse.bind(null, id)}>
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="h-4 w-4 mr-2" />Delete
          </Button>
        </form>
      </div>

      {/* Add location */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add Location</CardTitle></CardHeader>
        <CardContent>
          <NewLocationForm warehouseId={id} />
        </CardContent>
      </Card>

      {/* Locations list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Locations ({warehouse.locations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {warehouse.locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Full Path</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouse.locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{loc.fullPath ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={locationTypeColors[loc.locationType]}>{loc.locationType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteLocation.bind(null, loc.id)}>
                        <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

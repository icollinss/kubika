import Link from "next/link";
import { getPurchaseOrders } from "@/lib/actions/purchasing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingBag } from "lucide-react";
import { POFilter } from "./po-filter";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  RECEIVED:   { label: "Received",   variant: "secondary" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

interface Props { searchParams: Promise<{ status?: string; search?: string }> }

export default async function PurchaseOrdersPage({ searchParams }: Props) {
  const { status, search } = await searchParams;
  const orders = await getPurchaseOrders(status, search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchasing/orders/new">
            <Plus className="h-4 w-4 mr-2" />New Purchase Order
          </Link>
        </Button>
      </div>

      <POFilter />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No purchase orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first purchase order to buy from suppliers.</p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Total (AOA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const cfg = statusConfig[order.status];
                return (
                  <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell>
                      <Link href={`/dashboard/purchasing/orders/${order.id}`} className="font-mono font-medium hover:underline">
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{order.supplier.name}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(order.orderDate).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString("pt-AO") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{order._count.lines}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {order.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

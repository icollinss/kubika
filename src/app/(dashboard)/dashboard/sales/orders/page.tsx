import Link from "next/link";
import { getSalesOrders } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart } from "lucide-react";
import { SalesFilter } from "./sales-filter";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  QUOTATION:  { label: "Quotation",  variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  DELIVERED:  { label: "Delivered",  variant: "secondary" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function SalesOrdersPage({ searchParams }: Props) {
  const { status, search } = await searchParams;
  const orders = await getSalesOrders(status, search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Orders</h2>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/orders/new">
            <Plus className="h-4 w-4 mr-2" />New Quotation
          </Link>
        </Button>
      </div>

      <SalesFilter />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first quotation to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead className="text-right">Total (AOA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const cfg = statusConfig[order.status];
                return (
                  <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell>
                      <Link href={`/dashboard/sales/orders/${order.id}`} className="font-mono font-medium hover:underline">
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{order.customer.name}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(order.orderDate).toLocaleDateString("pt-AO")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{order._count.lines}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{order._count.invoices}</TableCell>
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

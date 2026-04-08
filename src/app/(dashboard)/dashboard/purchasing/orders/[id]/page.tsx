import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPurchaseOrder, confirmPurchaseOrder, cancelPurchaseOrder,
  receiveGoods, createBillFromOrder, updatePurchaseOrder,
} from "@/lib/actions/purchasing";
import { getContacts } from "@/lib/actions/contacts";
import { getProducts } from "@/lib/actions/inventory";
import { getAnalyticAccounts } from "@/lib/actions/projects";
import { PurchaseOrderForm } from "@/components/purchasing/purchase-order-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, CheckCircle, XCircle, PackageCheck, FileText } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  RECEIVED:   { label: "Received",   variant: "secondary" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

const billStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  PAID:       { label: "Paid",       variant: "secondary" },
  PARTIAL:    { label: "Partial",    variant: "secondary" },
  OVERDUE:    { label: "Overdue",    variant: "destructive" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

interface Props { params: Promise<{ id: string }> }

export default async function PurchaseOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, contacts, products, analyticAccounts] = await Promise.all([
    getPurchaseOrder(id),
    getContacts(),
    getProducts(),
    getAnalyticAccounts(),
  ]);
  if (!order) notFound();

  const suppliers = contacts.filter((c) => c.type === "SUPPLIER" || c.type === "BOTH");
  const cfg = statusConfig[order.status];
  const canEdit = order.status === "DRAFT";
  const canConfirm = order.status === "DRAFT";
  const canReceive = order.status === "CONFIRMED";
  const canBill = order.status === "RECEIVED" || order.status === "CONFIRMED";
  const canCancel = order.status === "DRAFT" || order.status === "CONFIRMED";
  const update = updatePurchaseOrder.bind(null, id);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/purchasing/orders"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight font-mono">{order.number}</h2>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{order.supplier.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canCancel && (
            <form action={cancelPurchaseOrder.bind(null, id)}>
              <Button variant="outline" size="sm" type="submit"><XCircle className="h-4 w-4 mr-2" />Cancel</Button>
            </form>
          )}
          {canConfirm && (
            <form action={confirmPurchaseOrder.bind(null, id)}>
              <Button variant="outline" size="sm" type="submit"><CheckCircle className="h-4 w-4 mr-2" />Confirm</Button>
            </form>
          )}
          {canReceive && (
            <form action={receiveGoods.bind(null, id)}>
              <Button variant="outline" size="sm" type="submit"><PackageCheck className="h-4 w-4 mr-2" />Receive Goods</Button>
            </form>
          )}
          {canBill && (
            <form action={createBillFromOrder.bind(null, id)}>
              <Button size="sm" type="submit"><FileText className="h-4 w-4 mr-2" />Create Bill</Button>
            </form>
          )}
        </div>
      </div>

      <Tabs defaultValue="lines">
        <TabsList>
          <TabsTrigger value="lines">Order Lines</TabsTrigger>
          {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
          <TabsTrigger value="bills">Bills ({order.bills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lines">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">IVA%</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {line.product.name}
                        {line.product.internalRef && <span className="text-muted-foreground text-xs ml-1">[{line.product.internalRef}]</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{line.description ?? "—"}</TableCell>
                      <TableCell className="text-right">{line.quantity} {line.product.uom?.symbol ?? ""}</TableCell>
                      <TableCell className="text-right">{line.unitPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{line.taxRate}%</TableCell>
                      <TableCell className="text-right font-semibold">{line.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{order.subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{order.taxAmount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{order.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canEdit && (
          <TabsContent value="edit">
            <Card>
              <CardHeader><CardTitle className="text-base">Edit Order</CardTitle></CardHeader>
              <CardContent>
                <PurchaseOrderForm
                  defaultValues={{
                    supplierId: order.supplierId,
                    orderDate: new Date(order.orderDate).toISOString().split("T")[0],
                    expectedDate: order.expectedDate ? new Date(order.expectedDate).toISOString().split("T")[0] : "",
                    notes: order.notes ?? "",
                    lines: order.lines.map((l) => ({
                      productId: l.productId,
                      description: l.description ?? "",
                      quantity: l.quantity,
                      unitPrice: l.unitPrice,
                      taxRate: l.taxRate,
                      sequence: l.sequence,
                    })),
                  }}
                  onSubmit={update}
                  submitLabel="Save Changes"
                  suppliers={suppliers}
                  products={products}
                  analyticAccounts={analyticAccounts}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="bills">
          <Card>
            <CardHeader><CardTitle className="text-base">Supplier Bills</CardTitle></CardHeader>
            <CardContent>
              {order.bills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bills yet.{canBill ? " Click \"Create Bill\" to generate one." : ""}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.bills.map((bill) => {
                      const bc = billStatusConfig[bill.status];
                      return (
                        <TableRow key={bill.id}>
                          <TableCell>
                            <Link href={`/dashboard/purchasing/bills/${bill.id}`} className="font-mono font-medium hover:underline">
                              {bill.number}
                            </Link>
                          </TableCell>
                          <TableCell><Badge variant={bc.variant}>{bc.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(bill.billDate).toLocaleDateString("pt-AO")}</TableCell>
                          <TableCell className="text-right">{bill.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-green-600">{bill.amountPaid.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">{bill.amountDue.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

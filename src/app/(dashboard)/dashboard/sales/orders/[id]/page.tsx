import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalesOrder, confirmOrder, cancelOrder, createInvoiceFromOrder, updateSalesOrder } from "@/lib/actions/sales";
import { getContacts } from "@/lib/actions/contacts";
import { getProducts } from "@/lib/actions/inventory";
import { SalesOrderForm } from "@/components/sales/sales-order-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, FileText, CheckCircle, XCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  QUOTATION:  { label: "Quotation",  variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  DELIVERED:  { label: "Delivered",  variant: "secondary" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

const invoiceStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  PAID:       { label: "Paid",       variant: "secondary" },
  PARTIAL:    { label: "Partial",    variant: "secondary" },
  OVERDUE:    { label: "Overdue",    variant: "destructive" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

interface Props { params: Promise<{ id: string }> }

export default async function SalesOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, contacts, products] = await Promise.all([
    getSalesOrder(id),
    getContacts(undefined, "CUSTOMER"),
    getProducts(),
  ]);
  if (!order) notFound();

  const customers = contacts.filter((c) => c.type === "CUSTOMER" || c.type === "BOTH");
  const cfg = statusConfig[order.status];
  const canEdit = order.status === "QUOTATION";
  const canConfirm = order.status === "QUOTATION";
  const canInvoice = order.status === "CONFIRMED" || order.status === "DELIVERED";
  const canCancel = order.status === "QUOTATION" || order.status === "CONFIRMED";
  const update = updateSalesOrder.bind(null, id);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/sales/orders"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight font-mono">{order.number}</h2>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{order.customer.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canCancel && (
            <form action={cancelOrder.bind(null, id)}>
              <Button variant="outline" size="sm" type="submit">
                <XCircle className="h-4 w-4 mr-2" />Cancel
              </Button>
            </form>
          )}
          {canConfirm && (
            <form action={confirmOrder.bind(null, id)}>
              <Button variant="outline" size="sm" type="submit">
                <CheckCircle className="h-4 w-4 mr-2" />Confirm Order
              </Button>
            </form>
          )}
          {canInvoice && (
            <form action={createInvoiceFromOrder.bind(null, id)}>
              <Button size="sm" type="submit">
                <FileText className="h-4 w-4 mr-2" />Create Invoice
              </Button>
            </form>
          )}
        </div>
      </div>

      <Tabs defaultValue="lines">
        <TabsList>
          <TabsTrigger value="lines">Order Lines</TabsTrigger>
          {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
          <TabsTrigger value="invoices">Invoices ({order.invoices.length})</TabsTrigger>
        </TabsList>

        {/* Lines view */}
        <TabsContent value="lines">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Disc%</TableHead>
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
                      <TableCell className="text-right">{line.discount}%</TableCell>
                      <TableCell className="text-right">{line.taxRate}%</TableCell>
                      <TableCell className="text-right font-semibold">{line.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{order.subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA</span>
                    <span>{order.taxAmount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{order.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit */}
        {canEdit && (
          <TabsContent value="edit">
            <Card>
              <CardHeader><CardTitle className="text-base">Edit Quotation</CardTitle></CardHeader>
              <CardContent>
                <SalesOrderForm
                  defaultValues={{
                    customerId: order.customerId,
                    orderDate: new Date(order.orderDate).toISOString().split("T")[0],
                    expiryDate: order.expiryDate ? new Date(order.expiryDate).toISOString().split("T")[0] : "",
                    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split("T")[0] : "",
                    notes: order.notes ?? "",
                    termsAndConds: order.termsAndConds ?? "",
                    lines: order.lines.map((l) => ({
                      productId: l.productId,
                      description: l.description ?? "",
                      quantity: l.quantity,
                      unitPrice: l.unitPrice,
                      discount: l.discount,
                      taxRate: l.taxRate,
                      sequence: l.sequence,
                    })),
                  }}
                  onSubmit={update}
                  submitLabel="Save Changes"
                  customers={customers}
                  products={products}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
            <CardContent>
              {order.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.{canInvoice ? " Click \"Create Invoice\" to generate one." : ""}</p>
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
                    {order.invoices.map((inv) => {
                      const ic = invoiceStatusConfig[inv.status];
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <Link href={`/dashboard/sales/invoices/${inv.id}`} className="font-mono font-medium hover:underline">
                              {inv.number}
                            </Link>
                          </TableCell>
                          <TableCell><Badge variant={ic.variant}>{ic.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString("pt-AO")}</TableCell>
                          <TableCell className="text-right">{inv.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-green-600">{inv.amountPaid.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">{inv.amountDue.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
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

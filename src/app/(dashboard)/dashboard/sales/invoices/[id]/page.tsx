import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoice, confirmInvoice } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, CheckCircle, Printer } from "lucide-react";
import { PaymentForm } from "./payment-form";
import { WhatsappInvoiceButton } from "./whatsapp-invoice-button";
import { RequestPaymentButton } from "./request-payment-button";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",     variant: "outline" },
  CONFIRMED:  { label: "Confirmed", variant: "default" },
  PAID:       { label: "Paid",      variant: "secondary" },
  PARTIAL:    { label: "Partial",   variant: "secondary" },
  OVERDUE:    { label: "Overdue",   variant: "destructive" },
  CANCELLED:  { label: "Cancelled", variant: "destructive" },
};

const paymentMethodLabel: Record<string, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money (Multicaixa)", CHECK: "Check", CREDIT: "Credit",
};

interface Props { params: Promise<{ id: string }> }

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const cfg = statusConfig[invoice.status];
  const canConfirm = invoice.status === "DRAFT";
  const canPay = invoice.status === "CONFIRMED" || invoice.status === "PARTIAL" || invoice.status === "OVERDUE";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/sales/invoices"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight font-mono">{invoice.number}</h2>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.customer.name}
              {invoice.orderId && invoice.order && <> · <Link href={`/dashboard/sales/orders/${invoice.orderId}`} className="hover:underline">{invoice.order.number}</Link></>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <WhatsappInvoiceButton invoiceId={id} defaultPhone={invoice.customer.phone ?? ""} />
          {canPay && <RequestPaymentButton invoiceId={id} />}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          {canConfirm && (
            <form action={confirmInvoice.bind(null, id)}>
              <Button size="sm" type="submit">
                <CheckCircle className="h-4 w-4 mr-2" />Confirm Invoice
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: invoice.total, className: "font-bold" },
          { label: "Paid", value: invoice.amountPaid, className: "text-green-600 font-bold" },
          { label: "Due", value: invoice.amountDue, className: "text-orange-600 font-bold" },
          { label: "IVA", value: invoice.taxAmount, className: "" },
        ].map(({ label, value, className }) => (
          <Card key={label}>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-xl ${className}`}>{value.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-xs font-normal">AOA</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="lines">
        <TabsList>
          <TabsTrigger value="lines">Lines</TabsTrigger>
          <TabsTrigger value="payments">Payments ({invoice.payments.length})</TabsTrigger>
          {canPay && <TabsTrigger value="record">Record Payment</TabsTrigger>}
        </TabsList>

        {/* Lines */}
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
                  {invoice.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.product.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{line.description ?? "—"}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">{line.unitPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{line.discount}%</TableCell>
                      <TableCell className="text-right">{line.taxRate}%</TableCell>
                      <TableCell className="text-right font-semibold">{line.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{invoice.subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{invoice.taxAmount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{invoice.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments history */}
        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{new Date(p.paidAt).toLocaleDateString("pt-AO")}</TableCell>
                        <TableCell>{paymentMethodLabel[p.method]}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{p.reference ?? "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{p.amount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Record payment */}
        {canPay && (
          <TabsContent value="record">
            <Card>
              <CardHeader><CardTitle className="text-base">Record Payment</CardTitle></CardHeader>
              <CardContent>
                <PaymentForm invoiceId={id} amountDue={invoice.amountDue} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

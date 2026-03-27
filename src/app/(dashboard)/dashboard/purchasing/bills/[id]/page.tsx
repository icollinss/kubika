import { notFound } from "next/navigation";
import Link from "next/link";
import { getBill, confirmBill, recordBillPayment } from "@/lib/actions/purchasing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { BillPaymentForm } from "./bill-payment-form";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  PAID:       { label: "Paid",       variant: "secondary" },
  PARTIAL:    { label: "Partial",    variant: "secondary" },
  OVERDUE:    { label: "Overdue",    variant: "destructive" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

const methodLabel: Record<string, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer",
  MOBILE_MONEY: "Mobile Money (Multicaixa)", CHECK: "Check", CREDIT: "Credit",
};

interface Props { params: Promise<{ id: string }> }

export default async function BillDetailPage({ params }: Props) {
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  const cfg = statusConfig[bill.status];
  const canConfirm = bill.status === "DRAFT";
  const canPay = bill.status === "CONFIRMED" || bill.status === "PARTIAL" || bill.status === "OVERDUE";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/purchasing/bills"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight font-mono">{bill.number}</h2>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {bill.supplier.name}
              {bill.order && <> · <Link href={`/dashboard/purchasing/orders/${bill.orderId}`} className="hover:underline">{bill.order.number}</Link></>}
            </p>
          </div>
        </div>
        {canConfirm && (
          <form action={confirmBill.bind(null, id)}>
            <Button size="sm" type="submit"><CheckCircle className="h-4 w-4 mr-2" />Confirm Bill</Button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",  value: bill.total,      className: "font-bold" },
          { label: "Paid",   value: bill.amountPaid, className: "text-green-600 font-bold" },
          { label: "Due",    value: bill.amountDue,  className: "text-orange-600 font-bold" },
          { label: "IVA",    value: bill.taxAmount,  className: "" },
        ].map(({ label, value, className }) => (
          <Card key={label}>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className={`text-xl ${className}`}>{value.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-xs font-normal">AOA</span></p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="lines">
        <TabsList>
          <TabsTrigger value="lines">Lines</TabsTrigger>
          <TabsTrigger value="payments">Payments ({bill.payments.length})</TabsTrigger>
          {canPay && <TabsTrigger value="record">Record Payment</TabsTrigger>}
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
                  {bill.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.product.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{line.description ?? "—"}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">{line.unitPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">{line.taxRate}%</TableCell>
                      <TableCell className="text-right font-semibold">{line.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{bill.subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{bill.taxAmount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{bill.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent>
              {bill.payments.length === 0 ? (
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
                    {bill.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{new Date(p.paidAt).toLocaleDateString("pt-AO")}</TableCell>
                        <TableCell>{methodLabel[p.method]}</TableCell>
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

        {canPay && (
          <TabsContent value="record">
            <Card>
              <CardHeader><CardTitle className="text-base">Record Payment</CardTitle></CardHeader>
              <CardContent><BillPaymentForm billId={id} amountDue={bill.amountDue} /></CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

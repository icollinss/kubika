import Link from "next/link";
import { getInvoices } from "@/lib/actions/sales";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { InvoicesFilter } from "./invoices-filter";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  PAID:       { label: "Paid",       variant: "secondary" },
  PARTIAL:    { label: "Partial",    variant: "secondary" },
  OVERDUE:    { label: "Overdue",    variant: "destructive" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

interface Props { searchParams: Promise<{ status?: string }> }

export default async function InvoicesPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const invoices = await getInvoices(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground text-sm mt-1">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <InvoicesFilter />

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">Invoices are generated from confirmed sales orders.</p>
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
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const cfg = statusConfig[inv.status];
                const totalPaid = inv.payments.reduce((s, p) => s + p.amount, 0);
                return (
                  <TableRow key={inv.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell>
                      <Link href={`/dashboard/sales/invoices/${inv.id}`} className="font-mono font-medium hover:underline">
                        {inv.number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{inv.customer.name}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(inv.invoiceDate).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("pt-AO") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{inv.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-green-600">{totalPaid.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">{inv.amountDue.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
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

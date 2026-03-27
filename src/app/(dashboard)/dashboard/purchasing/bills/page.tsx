import Link from "next/link";
import { getBills } from "@/lib/actions/purchasing";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt } from "lucide-react";
import { BillsFilter } from "./bills-filter";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT:      { label: "Draft",      variant: "outline" },
  CONFIRMED:  { label: "Confirmed",  variant: "default" },
  PAID:       { label: "Paid",       variant: "secondary" },
  PARTIAL:    { label: "Partial",    variant: "secondary" },
  OVERDUE:    { label: "Overdue",    variant: "destructive" },
  CANCELLED:  { label: "Cancelled",  variant: "destructive" },
};

interface Props { searchParams: Promise<{ status?: string }> }

export default async function BillsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const bills = await getBills(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supplier Bills</h2>
          <p className="text-muted-foreground text-sm mt-1">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <BillsFilter />

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No supplier bills yet</p>
          <p className="text-sm text-muted-foreground mt-1">Bills are generated from purchase orders.</p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const cfg = statusConfig[bill.status];
                const totalPaid = bill.payments.reduce((s, p) => s + p.amount, 0);
                return (
                  <TableRow key={bill.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell>
                      <Link href={`/dashboard/purchasing/bills/${bill.id}`} className="font-mono font-medium hover:underline">
                        {bill.number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{bill.supplier.name}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(bill.billDate).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString("pt-AO") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{bill.total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-green-600">{totalPaid.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">{bill.amountDue.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}</TableCell>
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

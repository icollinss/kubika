import Link from "next/link";
import { getContactsWithBalance } from "@/lib/actions/statements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, AlertTriangle } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

export default async function CustomersStatementsPage() {
  const customers = await getContactsWithBalance("CUSTOMER");

  const totalDue = customers.reduce((s, c) => s + c.totalDue, 0);
  const totalOverdue = customers.reduce((s, c) => s + c.overdue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Statements</h2>
          <p className="text-sm text-muted-foreground">{customers.length} customers with outstanding balances</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-bold">{fmt(totalDue)} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Overdue</p>
                <p className="text-lg font-bold text-orange-600">{fmt(totalOverdue)} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No customers with outstanding balances</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/dashboard/statements/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(c.totalDue)} AOA</TableCell>
                    <TableCell className="text-right">
                      {c.overdue > 0 ? (
                        <span className="text-orange-600 font-medium">{fmt(c.overdue)} AOA</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {c.creditLimit > 0 ? `${fmt(c.creditLimit)} AOA` : "—"}
                    </TableCell>
                    <TableCell>
                      {c.creditLimit > 0 && c.totalDue > c.creditLimit ? (
                        <Badge variant="destructive">Over limit</Badge>
                      ) : c.overdue > 0 ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">Overdue</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300">Current</Badge>
                      )}
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

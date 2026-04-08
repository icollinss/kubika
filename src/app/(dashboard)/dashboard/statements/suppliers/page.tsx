import Link from "next/link";
import { getContactsWithBalance } from "@/lib/actions/statements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, AlertTriangle } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

export default async function SuppliersStatementsPage() {
  const suppliers = await getContactsWithBalance("SUPPLIER");

  const totalDue = suppliers.reduce((s, c) => s + c.totalDue, 0);
  const totalOverdue = suppliers.reduce((s, c) => s + c.overdue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supplier Statements</h2>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers with outstanding balances</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Payable</p>
                <p className="text-lg font-bold">{fmt(totalDue)} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue Payable</p>
                <p className="text-lg font-bold text-red-600">{fmt(totalOverdue)} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No suppliers with outstanding balances</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/dashboard/statements/suppliers/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(s.totalDue)} AOA</TableCell>
                    <TableCell className="text-right">
                      {s.overdue > 0 ? (
                        <span className="text-red-600 font-medium">{fmt(s.overdue)} AOA</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.overdue > 0 ? (
                        <Badge variant="outline" className="text-red-600 border-red-300">Overdue</Badge>
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

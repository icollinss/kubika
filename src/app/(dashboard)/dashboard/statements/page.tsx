import Link from "next/link";
import { getReceivablesSummary, getPayablesSummary } from "@/lib/actions/statements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, AlertTriangle, Users, Building2 } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

function AgingBar({ current, days30, days60, days90, over90, total }: {
  current: number; days30: number; days60: number; days90: number; over90: number; total: number;
}) {
  if (total === 0) return <div className="h-2 bg-muted rounded-full w-full" />;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full gap-px">
      {current > 0 && <div className="bg-green-500" style={{ width: pct(current) }} title={`Current: ${fmt(current)}`} />}
      {days30 > 0 && <div className="bg-yellow-400" style={{ width: pct(days30) }} title={`1-30d: ${fmt(days30)}`} />}
      {days60 > 0 && <div className="bg-orange-400" style={{ width: pct(days60) }} title={`31-60d: ${fmt(days60)}`} />}
      {days90 > 0 && <div className="bg-red-400" style={{ width: pct(days90) }} title={`61-90d: ${fmt(days90)}`} />}
      {over90 > 0 && <div className="bg-red-700" style={{ width: pct(over90) }} title={`90+d: ${fmt(over90)}`} />}
    </div>
  );
}

export default async function StatementsPage() {
  const [receivables, payables] = await Promise.all([
    getReceivablesSummary(),
    getPayablesSummary(),
  ]);

  const totalReceivable = receivables.reduce((s, r) => s + r.total, 0);
  const totalPayable = payables.reduce((s, p) => p.total + s, 0);
  const overdueReceivable = receivables.reduce((s, r) => s + r.days30 + r.days60 + r.days90 + r.over90, 0);
  const overduePayable = payables.reduce((s, p) => s + p.days30 + p.days60 + p.days90 + p.over90, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Statements & Credit</h2>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/statements/customers"><Users className="h-4 w-4 mr-2" />Customers</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/statements/suppliers"><Building2 className="h-4 w-4 mr-2" />Suppliers</Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Receivable</p>
                <p className="text-lg font-bold">{fmt(totalReceivable)} AOA</p>
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
                <p className="text-xs text-muted-foreground">Overdue Receivable</p>
                <p className="text-lg font-bold text-orange-600">{fmt(overdueReceivable)} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Payable</p>
                <p className="text-lg font-bold">{fmt(totalPayable)} AOA</p>
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
                <p className="text-lg font-bold text-red-600">{fmt(overduePayable)} AOA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium">Aging key:</span>
        {[
          { color: "bg-green-500", label: "Current" },
          { color: "bg-yellow-400", label: "1-30 days" },
          { color: "bg-orange-400", label: "31-60 days" },
          { color: "bg-red-400", label: "61-90 days" },
          { color: "bg-red-700", label: "90+ days" },
        ].map((i) => (
          <span key={i.label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm inline-block ${i.color}`} />
            {i.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />Accounts Receivable
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/statements/customers">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {receivables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No outstanding receivables</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="w-28">Aging</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.slice(0, 8).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/dashboard/statements/customers/${r.id}`} className="font-medium hover:underline text-sm">
                          {r.name}
                        </Link>
                        {r.creditLimit > 0 && r.total > r.creditLimit && (
                          <Badge variant="destructive" className="ml-2 text-xs py-0">Over limit</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {fmt(r.total)} AOA
                      </TableCell>
                      <TableCell>
                        <AgingBar {...r} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payables */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-purple-600" />Accounts Payable
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/statements/suppliers">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {payables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No outstanding payables</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="w-28">Aging</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.slice(0, 8).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/dashboard/statements/suppliers/${p.id}`} className="font-medium hover:underline text-sm">
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {fmt(p.total)} AOA
                      </TableCell>
                      <TableCell>
                        <AgingBar {...p} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

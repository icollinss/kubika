import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerStatement } from "@/lib/actions/statements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { CreditSettingsForm } from "./credit-settings-form";

interface Props { params: Promise<{ id: string }> }

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-AO");
}

export default async function CustomerStatementPage({ params }: Props) {
  const { id } = await params;

  let data;
  try {
    data = await getCustomerStatement(id);
  } catch {
    notFound();
  }

  const { contact, rows, aging, totalOutstanding, creditUsedPct } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/statements/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{contact.name}</h2>
          <p className="text-sm text-muted-foreground">Customer Statement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: aging + credit */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{fmt(totalOutstanding)} AOA</p>
              {creditUsedPct !== null && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Credit used</span>
                    <span>{creditUsedPct}% of {fmt(contact.creditLimit)} AOA</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${creditUsedPct >= 100 ? "bg-red-500" : creditUsedPct >= 80 ? "bg-orange-400" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(100, creditUsedPct)}%` }}
                    />
                  </div>
                  {creditUsedPct >= 100 && (
                    <Badge variant="destructive" className="text-xs">Over credit limit</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Current", value: aging.current, color: "text-green-600" },
                { label: "1–30 days", value: aging.days30, color: "text-yellow-600" },
                { label: "31–60 days", value: aging.days60, color: "text-orange-500" },
                { label: "61–90 days", value: aging.days90, color: "text-red-500" },
                { label: "90+ days", value: aging.over90, color: "text-red-700 font-bold" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={row.value > 0 ? row.color : "text-muted-foreground"}>
                    {row.value > 0 ? `${fmt(row.value)} AOA` : "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <CreditSettingsForm
            contactId={id}
            creditLimit={contact.creditLimit}
            creditTermsDays={contact.creditTermsDays}
          />
        </div>

        {/* Right: statement table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />Account Statement
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{fmtDate(row.date)}</TableCell>
                        <TableCell className="text-sm font-mono">{row.reference}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.description}</TableCell>
                        <TableCell className="text-right text-sm">
                          {row.debit > 0 ? fmt(row.debit) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm text-green-600">
                          {row.credit > 0 ? fmt(row.credit) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {fmt(row.balance)}
                        </TableCell>
                        <TableCell>
                          {row.status && (
                            <Badge variant={row.status === "OVERDUE" ? "destructive" : "outline"} className="text-xs">
                              {row.status}
                            </Badge>
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
      </div>
    </div>
  );
}

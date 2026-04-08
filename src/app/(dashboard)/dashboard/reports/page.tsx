import {
  getRevenueSummary,
  getExpensesSummary,
  getMonthlyRevenue,
  getTopCustomers,
  getTopProducts,
  getHrSnapshot,
  getPosSnapshot,
} from "@/lib/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, AlertCircle, Users, Store,
  BarChart3, ShoppingCart, Receipt,
} from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}

function pct(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${w}%` }} />
    </div>
  );
}

export default async function ReportsPage() {
  const [revenue, expenses, monthly, topCustomers, topProducts, hr, pos] = await Promise.all([
    getRevenueSummary(),
    getExpensesSummary(),
    getMonthlyRevenue(),
    getTopCustomers(),
    getTopProducts(),
    getHrSnapshot(),
    getPosSnapshot(),
  ]);

  const revChange = pct(revenue.thisMonth, revenue.lastMonth);
  const maxMonthly = Math.max(...monthly.map((m) => m.revenue), 1);
  const maxCustomer = topCustomers[0]?.total ?? 1;
  const maxProduct = topProducts[0]?.revenue ?? 1;
  const netProfit = revenue.totalRevenue - expenses.totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">Business performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue (this month)</p>
                <p className="text-2xl font-bold mt-1">{fmt(revenue.thisMonth)}</p>
                <p className="text-xs text-muted-foreground">AOA</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
            </div>
            {revChange !== null && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${revChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                {revChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(revChange).toFixed(1)}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold mt-1">{fmt(revenue.outstanding)}</p>
                <p className="text-xs text-muted-foreground">AOA · {revenue.outstandingCount} invoices</p>
              </div>
              <AlertCircle className="h-5 w-5 text-orange-500 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expenses (this month)</p>
                <p className="text-2xl font-bold mt-1">{fmt(expenses.thisMonth)}</p>
                <p className="text-xs text-muted-foreground">AOA</p>
              </div>
              <Receipt className="h-5 w-5 text-red-400 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Net Profit (all time)</p>
                <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {fmt(netProfit)}
                </p>
                <p className="text-xs text-muted-foreground">AOA</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-500 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Revenue — Last 6 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-32">
            {monthly.map((m) => {
              const h = maxMonthly > 0 ? Math.round((m.revenue / maxMonthly) * 100) : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {fmt(m.revenue).split(",")[0]}
                  </span>
                  <div className="w-full rounded-t-md bg-primary/15 relative" style={{ height: "80px" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-md bg-primary transition-all"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top customers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No paid invoices yet.</p>
            ) : (
              topCustomers.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-muted-foreground ml-2 shrink-0">{fmt(c.total)} AOA</span>
                  </div>
                  <MiniBar value={c.total} max={maxCustomer} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Top Products by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sales data yet.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{p.name}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{p.qty} units</Badge>
                      <span className="text-muted-foreground">{fmt(p.revenue)} AOA</span>
                    </div>
                  </div>
                  <MiniBar value={p.revenue} max={maxProduct} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* HR + POS snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              HR Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active employees</span>
              <span className="font-semibold">{hr.employeeCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total payroll paid</span>
              <span className="font-semibold">{fmt(hr.totalPayroll)} AOA</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              POS — This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orders</span>
              <span className="font-semibold">{pos.orderCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-semibold">{fmt(pos.revenue)} AOA</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

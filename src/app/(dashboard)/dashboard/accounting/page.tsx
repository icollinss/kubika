import { getAccounts } from "@/lib/actions/accounting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, TrendingUp, TrendingDown, Scale, FileText, Plus } from "lucide-react";

const typeColor: Record<string, string> = {
  ASSET: "bg-blue-100 text-blue-800",
  LIABILITY: "bg-red-100 text-red-800",
  EQUITY: "bg-purple-100 text-purple-800",
  REVENUE: "bg-green-100 text-green-800",
  EXPENSE: "bg-orange-100 text-orange-800",
};

const typeIcon: Record<string, React.ReactNode> = {
  ASSET: <TrendingUp className="h-4 w-4 text-blue-600" />,
  LIABILITY: <TrendingDown className="h-4 w-4 text-red-600" />,
  EQUITY: <Scale className="h-4 w-4 text-purple-600" />,
  REVENUE: <TrendingUp className="h-4 w-4 text-green-600" />,
  EXPENSE: <TrendingDown className="h-4 w-4 text-orange-600" />,
};

export default async function AccountingPage() {
  const accounts = await getAccounts();

  const grouped: Record<string, typeof accounts> = {};
  for (const acc of accounts) {
    if (!grouped[acc.type]) grouped[acc.type] = [];
    grouped[acc.type].push(acc);
  }

  const quickLinks = [
    { href: "/dashboard/accounting/journal", label: "Journal Entries", icon: BookOpen },
    { href: "/dashboard/accounting/reports/pl", label: "Profit & Loss", icon: TrendingUp },
    { href: "/dashboard/accounting/reports/balance-sheet", label: "Balance Sheet", icon: Scale },
    { href: "/dashboard/accounting/reports/tax", label: "Tax Summary", icon: FileText },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Angola PGC — {accounts.length} accounts</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounting/new-account">
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Link>
        </Button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Accounts by type */}
      {(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const).map((type) => {
        const list = grouped[type] ?? [];
        if (!list.length) return null;
        return (
          <div key={type} className="rounded-lg border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
              {typeIcon[type]}
              <span className="font-semibold text-sm">{type}</span>
              <span className="text-xs text-muted-foreground ml-auto">{list.length} accounts</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Code</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Sub-type</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((acc) => (
                  <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs font-semibold">{acc.code}</td>
                    <td className="px-4 py-2 font-medium">{acc.name}</td>
                    <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{acc.subtype ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className={typeColor[acc.type]}>
                        {acc.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

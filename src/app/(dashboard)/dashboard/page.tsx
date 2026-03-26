import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, Receipt } from "lucide-react";

const stats = [
  { label: "Total Contacts", value: "0", icon: Users, color: "text-blue-500" },
  { label: "Products", value: "0", icon: Package, color: "text-green-500" },
  { label: "Sales Orders", value: "0", icon: ShoppingCart, color: "text-orange-500" },
  { label: "Invoices", value: "0", icon: Receipt, color: "text-purple-500" },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s an overview of your business today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for future modules */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No sales yet. Start by adding contacts and products.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No inventory set up yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

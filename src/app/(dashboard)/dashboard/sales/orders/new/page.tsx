import Link from "next/link";
import { createSalesOrder } from "@/lib/actions/sales";
import { getContacts } from "@/lib/actions/contacts";
import { getProducts } from "@/lib/actions/inventory";
import { getAnalyticAccounts } from "@/lib/actions/projects";
import { SalesOrderForm } from "@/components/sales/sales-order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default async function NewSalesOrderPage() {
  const [contacts, products, analyticAccounts] = await Promise.all([
    getContacts(undefined, "CUSTOMER"),
    getProducts(),
    getAnalyticAccounts(),
  ]);

  const customers = contacts.filter((c) => c.type === "CUSTOMER" || c.type === "BOTH");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sales/orders"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">New Quotation</h2>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
        <CardContent>
          <SalesOrderForm
            onSubmit={createSalesOrder}
            submitLabel="Save Quotation"
            customers={customers}
            products={products}
            analyticAccounts={analyticAccounts}
          />
        </CardContent>
      </Card>
    </div>
  );
}

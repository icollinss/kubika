import Link from "next/link";
import { createSalesOrder } from "@/lib/actions/sales";
import { getContacts } from "@/lib/actions/contacts";
import { getProducts } from "@/lib/actions/inventory";
import { getAnalyticAccounts } from "@/lib/actions/projects";
import { getServerTranslations } from "@/lib/i18n";
import { SalesOrderForm } from "@/components/sales/sales-order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewSalesOrderPage({ searchParams }: Props) {
  const [{ customerId }, t, contacts, products, analyticAccounts] = await Promise.all([
    searchParams,
    getServerTranslations(),
    getContacts(undefined, "CUSTOMER"),
    getProducts(),
    getAnalyticAccounts(),
  ]);

  const customers = contacts.filter((c) => c.type === "CUSTOMER" || c.type === "BOTH");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sales/orders">
            <ChevronLeft className="h-4 w-4 mr-1" />{t.nav.orders}
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{t.contacts.newQuote}</h2>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t.pages.salesOrders.title}</CardTitle></CardHeader>
        <CardContent>
          <SalesOrderForm
            onSubmit={createSalesOrder}
            submitLabel={t.contacts.newQuote}
            customers={customers}
            products={products}
            analyticAccounts={analyticAccounts}
            defaultValues={customerId ? { customerId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}

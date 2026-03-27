import Link from "next/link";
import { createPurchaseOrder } from "@/lib/actions/purchasing";
import { getContacts } from "@/lib/actions/contacts";
import { getProducts } from "@/lib/actions/inventory";
import { PurchaseOrderForm } from "@/components/purchasing/purchase-order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default async function NewPurchaseOrderPage() {
  const [contacts, products] = await Promise.all([getContacts(), getProducts()]);
  const suppliers = contacts.filter((c) => c.type === "SUPPLIER" || c.type === "BOTH");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/purchasing/orders"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">New Purchase Order</h2>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
        <CardContent>
          <PurchaseOrderForm
            onSubmit={createPurchaseOrder}
            submitLabel="Create Purchase Order"
            suppliers={suppliers}
            products={products}
          />
        </CardContent>
      </Card>
    </div>
  );
}

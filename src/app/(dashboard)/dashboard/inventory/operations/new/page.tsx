import Link from "next/link";
import { getLocations } from "@/lib/actions/warehouse";
import { getProducts } from "@/lib/actions/inventory";
import { createStockOperation } from "@/lib/actions/stock-operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { OperationForm } from "./operation-form";

const typeLabels: Record<string, string> = {
  RECEIPT: "New Receipt",
  DELIVERY: "New Delivery",
  INTERNAL: "New Internal Transfer",
  ADJUSTMENT: "New Inventory Adjustment",
  RETURN: "New Return",
  SCRAP: "New Scrap",
};

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewOperationPage({ searchParams }: Props) {
  const { type = "RECEIPT" } = await searchParams;
  const [locations, products] = await Promise.all([getLocations(), getProducts()]);

  const internalLocations = locations.filter((l) => l.locationType === "INTERNAL");
  const vendorLocations = locations.filter((l) => l.locationType === "VENDOR");
  const customerLocations = locations.filter((l) => l.locationType === "CUSTOMER");
  const virtualLocations = locations.filter((l) => l.locationType === "VIRTUAL");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inventory/operations">
            <ChevronLeft className="h-4 w-4 mr-1" />Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{typeLabels[type] ?? "New Operation"}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OperationForm
            moveType={type as "RECEIPT" | "DELIVERY" | "INTERNAL" | "ADJUSTMENT" | "RETURN" | "SCRAP"}
            products={products}
            internalLocations={internalLocations}
            vendorLocations={vendorLocations}
            customerLocations={customerLocations}
            virtualLocations={virtualLocations}
            onSubmit={createStockOperation}
          />
        </CardContent>
      </Card>
    </div>
  );
}

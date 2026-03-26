import Link from "next/link";
import { createProduct, getUoms, getCategories } from "@/lib/actions/inventory";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default async function NewProductPage() {
  const [uoms, categories] = await Promise.all([getUoms(), getCategories()]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inventory/products">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">New Product</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={createProduct}
            submitLabel="Create Product"
            uoms={uoms}
            categories={categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}

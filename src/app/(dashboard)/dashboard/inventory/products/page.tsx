import Link from "next/link";
import { getProducts, getCategories } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { ProductsFilter } from "./products-filter";

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  STORABLE: { label: "Storable", variant: "default" },
  CONSUMABLE: { label: "Consumable", variant: "secondary" },
  SERVICE: { label: "Service", variant: "outline" },
};

const trackingBadge: Record<string, string> = {
  NONE: "",
  LOT: "Lots",
  SERIAL: "Serials",
};

interface Props {
  searchParams: Promise<{ search?: string; categoryId?: string; type?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { search, categoryId, type } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(search, categoryId, type),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/inventory/products/new">
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Link>
        </Button>
      </div>

      <ProductsFilter categories={categories} />

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first product to start tracking inventory.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Ref / SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const badge = typeBadge[product.productType];
                const tracking = trackingBadge[product.trackingType];
                return (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/dashboard/inventory/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {product.internalRef ?? product.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {product.category?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {tracking ? (
                        <Badge variant="outline">{tracking}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.salePrice.toLocaleString("pt-AO")} AOA
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {product.costPrice.toLocaleString("pt-AO")} AOA
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

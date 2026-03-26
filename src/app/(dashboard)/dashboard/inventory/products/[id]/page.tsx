import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProduct, getUoms, getCategories,
  updateProduct, archiveProduct,
  createLot, createSerial, getStockOnHand,
} from "@/lib/actions/inventory";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Archive, AlertTriangle } from "lucide-react";
import { LotForm } from "./lot-form";
import { SerialForm } from "./serial-form";

interface Props { params: Promise<{ id: string }> }

const moveTypeLabel: Record<string, string> = {
  RECEIPT: "Receipt", DELIVERY: "Delivery", INTERNAL: "Transfer",
  ADJUSTMENT: "Adjustment", RETURN: "Return", SCRAP: "Scrap",
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const [product, uoms, categories, stockQty] = await Promise.all([
    getProduct(id),
    getUoms(),
    getCategories(),
    getStockOnHand(id),
  ]);

  if (!product) notFound();

  const update = updateProduct.bind(null, id);
  const isLow = product.productType === "STORABLE" && stockQty <= product.reorderPoint;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inventory/products">
              <ChevronLeft className="h-4 w-4 mr-1" />Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
              {product.internalRef && (
                <Badge variant="outline">{product.internalRef}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{product.category?.name ?? "No category"}</p>
          </div>
        </div>
        <form action={archiveProduct.bind(null, id)}>
          <Button variant="outline" size="sm" type="submit">
            <Archive className="h-4 w-4 mr-2" />Archive
          </Button>
        </form>
      </div>

      {/* Stock summary */}
      {product.productType === "STORABLE" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">On Hand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stockQty}</p>
                {isLow && <AlertTriangle className="h-4 w-4 text-orange-500" />}
              </div>
              {product.uom && <p className="text-xs text-muted-foreground">{product.uom.symbol}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Reorder Point</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{product.reorderPoint}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sale Price</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{product.salePrice.toLocaleString("pt-AO")}</p>
              <p className="text-xs text-muted-foreground">AOA</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cost Price</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{product.costPrice.toLocaleString("pt-AO")}</p>
              <p className="text-xs text-muted-foreground">AOA</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {product.trackingType === "LOT" && <TabsTrigger value="lots">Lots ({product.lots.length})</TabsTrigger>}
          {product.trackingType === "SERIAL" && <TabsTrigger value="serials">Serials ({product.serials.length})</TabsTrigger>}
          <TabsTrigger value="moves">Stock Moves ({product.stockMoves.length})</TabsTrigger>
        </TabsList>

        {/* Details */}
        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle className="text-base">Edit Product</CardTitle></CardHeader>
            <CardContent>
              <ProductForm
                defaultValues={{
                  name: product.name,
                  description: product.description ?? "",
                  sku: product.sku ?? "",
                  barcode: product.barcode ?? "",
                  internalRef: product.internalRef ?? "",
                  salePrice: product.salePrice,
                  costPrice: product.costPrice,
                  categoryId: product.categoryId ?? undefined,
                  productType: product.productType,
                  trackingType: product.trackingType,
                  costingMethod: product.costingMethod,
                  uomId: product.uomId ?? undefined,
                  purchaseUomId: product.purchaseUomId ?? undefined,
                  reorderPoint: product.reorderPoint,
                  reorderQty: product.reorderQty,
                  leadTimeDays: product.leadTimeDays,
                  canBeSold: product.canBeSold,
                  canBePurchased: product.canBePurchased,
                }}
                onSubmit={update}
                submitLabel="Save Changes"
                uoms={uoms}
                categories={categories}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lots */}
        {product.trackingType === "LOT" && (
          <TabsContent value="lots" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Lot / Batch</CardTitle></CardHeader>
              <CardContent>
                <LotForm productId={id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Lots</CardTitle></CardHeader>
              <CardContent>
                {product.lots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lots recorded yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lot Number</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.lots.map((lot) => (
                        <TableRow key={lot.id}>
                          <TableCell className="font-medium">{lot.lotNumber}</TableCell>
                          <TableCell>
                            {lot.expiryDate
                              ? new Date(lot.expiryDate).toLocaleDateString("pt-AO")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(lot.createdAt).toLocaleDateString("pt-AO")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Serials */}
        {product.trackingType === "SERIAL" && (
          <TabsContent value="serials" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Serial Number</CardTitle></CardHeader>
              <CardContent>
                <SerialForm productId={id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Serial Numbers</CardTitle></CardHeader>
              <CardContent>
                {product.serials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No serial numbers recorded yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.serials.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium font-mono">{s.serial}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(s.createdAt).toLocaleDateString("pt-AO")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Stock Moves */}
        <TabsContent value="moves">
          <Card>
            <CardHeader><CardTitle className="text-base">Stock Move History</CardTitle></CardHeader>
            <CardContent>
              {product.stockMoves.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stock movements yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Lot / Serial</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.stockMoves.map((move) => (
                      <TableRow key={move.id}>
                        <TableCell className="text-sm">
                          {new Date(move.movedAt).toLocaleDateString("pt-AO")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{moveTypeLabel[move.moveType]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {move.fromLocation?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {move.toLocation?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {move.lot?.lotNumber ?? move.serial?.serial ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{move.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import type { ProductFormData } from "@/lib/actions/inventory";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  internalRef: z.string().optional(),
  salePrice: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  categoryId: z.string().optional(),
  productType: z.enum(["STORABLE", "CONSUMABLE", "SERVICE"]).default("STORABLE"),
  trackingType: z.enum(["NONE", "LOT", "SERIAL"]).default("NONE"),
  costingMethod: z.enum(["STANDARD_PRICE", "AVERAGE_COST", "FIFO"]).default("AVERAGE_COST"),
  uomId: z.string().optional(),
  purchaseUomId: z.string().optional(),
  reorderPoint: z.coerce.number().min(0).default(0),
  reorderQty: z.coerce.number().min(0).default(0),
  leadTimeDays: z.coerce.number().min(0).default(0),
  canBeSold: z.boolean().default(true),
  canBePurchased: z.boolean().default(true),
});

interface UoM { id: string; name: string; symbol: string }
interface Category { id: string; name: string }

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel?: string;
  uoms?: UoM[];
  categories?: Category[];
}

export function ProductForm({ defaultValues, onSubmit, submitLabel = "Save", uoms = [], categories = [] }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productType: "STORABLE",
      trackingType: "NONE",
      costingMethod: "AVERAGE_COST",
      canBeSold: true,
      canBePurchased: true,
      salePrice: 0,
      costPrice: 0,
      reorderPoint: 0,
      reorderQty: 0,
      leadTimeDays: 0,
      ...defaultValues,
    },
  });

  const productType = watch("productType");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g. Samsung Galaxy A15" />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} placeholder="Product description..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select value={watch("productType")} onValueChange={(v) => setValue("productType", v as ProductFormData["productType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STORABLE">Storable Product</SelectItem>
                  <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={watch("categoryId") ?? "NONE"} onValueChange={(v) => setValue("categoryId", v === "NONE" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No category</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalRef">Internal Reference</Label>
              <Input id="internalRef" {...register("internalRef")} placeholder="e.g. PROD-001" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...register("barcode")} placeholder="e.g. 6223000123456" />
            </div>

            {productType === "STORABLE" && (
              <div className="space-y-2">
                <Label>Tracking</Label>
                <Select value={watch("trackingType")} onValueChange={(v) => setValue("trackingType", v as ProductFormData["trackingType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">By Quantity</SelectItem>
                    <SelectItem value="LOT">By Lot / Batch</SelectItem>
                    <SelectItem value="SERIAL">By Serial Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Unit of Measure</Label>
              <Select value={watch("uomId") ?? "NONE"} onValueChange={(v) => setValue("uomId", v === "NONE" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="Select UoM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {uoms.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-6 sm:col-span-2 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox id="canBeSold" checked={watch("canBeSold")} onCheckedChange={(v) => setValue("canBeSold", !!v)} />
                <Label htmlFor="canBeSold">Can be Sold</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="canBePurchased" checked={watch("canBePurchased")} onCheckedChange={(v) => setValue("canBePurchased", !!v)} />
                <Label htmlFor="canBePurchased">Can be Purchased</Label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Pricing ── */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (AOA)</Label>
              <Input id="salePrice" type="number" step="0.01" {...register("salePrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (AOA)</Label>
              <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} />
            </div>
            <div className="space-y-2">
              <Label>Costing Method</Label>
              <Select value={watch("costingMethod")} onValueChange={(v) => setValue("costingMethod", v as ProductFormData["costingMethod"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD_PRICE">Standard Price</SelectItem>
                  <SelectItem value="AVERAGE_COST">Average Cost (AVCO)</SelectItem>
                  <SelectItem value="FIFO">First In First Out (FIFO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* ── Stock ── */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder Point (min qty)</Label>
              <Input id="reorderPoint" type="number" step="0.01" {...register("reorderPoint")} />
              <p className="text-xs text-muted-foreground">Alert when stock falls below this</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderQty">Reorder Quantity</Label>
              <Input id="reorderQty" type="number" step="0.01" {...register("reorderQty")} />
              <p className="text-xs text-muted-foreground">How much to order when replenishing</p>
            </div>
          </div>
        </TabsContent>

        {/* ── Purchase ── */}
        <TabsContent value="purchase" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Purchase Unit of Measure</Label>
              <Select value={watch("purchaseUomId") ?? "NONE"} onValueChange={(v) => setValue("purchaseUomId", v === "NONE" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="Same as UoM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Same as UoM</SelectItem>
                  {uoms.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
              <Input id="leadTimeDays" type="number" {...register("leadTimeDays")} />
              <p className="text-xs text-muted-foreground">Days to receive after ordering</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-6 border-t mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

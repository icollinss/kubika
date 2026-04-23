"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { OperationFormData } from "@/lib/actions/stock-operations";

const schema = z.object({
  moveType: z.enum(["RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT", "RETURN", "SCRAP"]),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1, "Select a product"),
    quantity: z.number().min(0.001),
    unitCost: z.number().min(0),
    lotId: z.string().optional(),
    serialId: z.string().optional(),
    note: z.string().optional(),
  })).min(1),
});

interface Location { id: string; name: string; fullPath?: string | null }
interface Product { id: string; name: string; internalRef?: string | null; trackingType: string; lots: { id: string; lotNumber: string }[]; serials: { id: string; serial: string }[] }

interface Props {
  moveType: OperationFormData["moveType"];
  products: Product[];
  internalLocations: Location[];
  vendorLocations: Location[];
  customerLocations: Location[];
  virtualLocations: Location[];
  onSubmit: (data: OperationFormData) => Promise<void>;
}

const locationConfig = {
  RECEIPT:    { from: "vendor",   to: "internal",  fromLabel: "Vendor",   toLabel: "Destination" },
  DELIVERY:   { from: "internal", to: "customer",  fromLabel: "From",     toLabel: "Customer" },
  INTERNAL:   { from: "internal", to: "internal",  fromLabel: "From",     toLabel: "To" },
  ADJUSTMENT: { from: null,       to: "internal",  fromLabel: null,       toLabel: "Location" },
  RETURN:     { from: "customer", to: "internal",  fromLabel: "Customer", toLabel: "Destination" },
  SCRAP:      { from: "internal", to: "virtual",   fromLabel: "From",     toLabel: "Scrap Location" },
};

export function OperationForm({ moveType, products, internalLocations, vendorLocations, customerLocations, virtualLocations, onSubmit }: Props) {
  const { register, handleSubmit, setValue, watch, control, formState: { isSubmitting } } = useForm<OperationFormData>({
    resolver: zodResolver(schema),
    defaultValues: { moveType, lines: [{ productId: "", quantity: 1, unitCost: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const cfg = locationConfig[moveType];

  function getLocations(type: string | null) {
    if (type === "vendor") return vendorLocations;
    if (type === "customer") return customerLocations;
    if (type === "virtual") return virtualLocations;
    if (type === "internal") return internalLocations;
    return [];
  }

  function getSelectedProduct(productId: string) {
    return products.find((p) => p.id === productId);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reference</Label>
          <Input {...register("reference")} placeholder="e.g. PO/2026/001" />
        </div>
        <div className="space-y-2">
          <Label>Note</Label>
          <Input {...register("note")} placeholder="Optional note..." />
        </div>
        {cfg.from && (
          <div className="space-y-2">
            <Label>{cfg.fromLabel} *</Label>
            <Select onValueChange={(v) => setValue("fromLocationId", v)}>
              <SelectTrigger><SelectValue placeholder={`Select ${cfg.fromLabel}`} /></SelectTrigger>
              <SelectContent>
                {getLocations(cfg.from).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.fullPath ?? l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {cfg.to && (
          <div className="space-y-2">
            <Label>{cfg.toLabel} *</Label>
            <Select onValueChange={(v) => setValue("toLocationId", v)}>
              <SelectTrigger><SelectValue placeholder={`Select ${cfg.toLabel}`} /></SelectTrigger>
              <SelectContent>
                {getLocations(cfg.to).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.fullPath ?? l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      {/* Product lines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Products</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}>
            <Plus className="h-4 w-4 mr-1" />Add Line
          </Button>
        </div>

        {fields.map((field, idx) => {
          const selectedProduct = getSelectedProduct(watch(`lines.${idx}.productId`));
          return (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-start p-3 border rounded-md">
              {/* Product */}
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <Select onValueChange={(v) => setValue(`lines.${idx}.productId`, v)}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.internalRef ? ` [${p.internalRef}]` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <Input type="number" step="0.01" min="0" {...register(`lines.${idx}.quantity`, { valueAsNumber: true })} />
              </div>

              {/* Unit Cost */}
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Unit Cost (AOA)</Label>
                <Input type="number" step="0.01" min="0" {...register(`lines.${idx}.unitCost`, { valueAsNumber: true })} />
              </div>

              {/* Lot (if LOT tracking) */}
              {selectedProduct?.trackingType === "LOT" && (
                <div className="col-span-6 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Lot</Label>
                  <Select onValueChange={(v) => setValue(`lines.${idx}.lotId`, v)}>
                    <SelectTrigger><SelectValue placeholder="Select lot" /></SelectTrigger>
                    <SelectContent>
                      {selectedProduct.lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>{lot.lotNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Serial (if SERIAL tracking) */}
              {selectedProduct?.trackingType === "SERIAL" && (
                <div className="col-span-6 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Serial</Label>
                  <Select onValueChange={(v) => setValue(`lines.${idx}.serialId`, v)}>
                    <SelectTrigger><SelectValue placeholder="Select serial" /></SelectTrigger>
                    <SelectContent>
                      {selectedProduct.serials.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.serial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Remove */}
              <div className="col-span-2 sm:col-span-1 flex items-end justify-end pb-0.5">
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Confirm Operation
      </Button>
    </form>
  );
}

"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { SalesOrderFormData } from "@/lib/actions/sales";

const schema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().optional(),
  expiryDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
  termsAndConds: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1, "Select a product"),
    description: z.string().optional(),
    quantity: z.coerce.number().min(0.001),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).max(100).default(0),
    taxRate: z.coerce.number().min(0).default(14),
    sequence: z.coerce.number().default(0),
  })).min(1),
});

interface Customer { id: string; name: string }
interface Product { id: string; name: string; internalRef?: string | null; salePrice: number }

interface Props {
  defaultValues?: Partial<SalesOrderFormData>;
  onSubmit: (data: SalesOrderFormData) => Promise<void>;
  submitLabel?: string;
  customers: Customer[];
  products: Product[];
}

function toDateInput(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function SalesOrderForm({ defaultValues, onSubmit, submitLabel = "Save", customers, products }: Props) {
  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<SalesOrderFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      orderDate: toDateInput(new Date()),
      lines: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 14, sequence: 0 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");

  // Live totals
  const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100)), 0);
  const tax = lines.reduce((sum, l) => {
    const s = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100);
    return sum + s * ((l.taxRate || 0) / 100);
  }, 0);
  const total = subtotal + tax;

  function handleProductSelect(idx: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    setValue(`lines.${idx}.productId`, productId);
    if (product) setValue(`lines.${idx}.unitPrice`, product.salePrice);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Customer *</Label>
          <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v)}>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.customerId && <p className="text-destructive text-sm">{errors.customerId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Order Date</Label>
          <Input type="date" {...register("orderDate")} />
        </div>
        <div className="space-y-2">
          <Label>Expiry Date</Label>
          <Input type="date" {...register("expiryDate")} />
        </div>
        <div className="space-y-2">
          <Label>Expected Delivery</Label>
          <Input type="date" {...register("deliveryDate")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} placeholder="Notes visible to customer..." rows={2} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Terms & Conditions</Label>
          <Textarea {...register("termsAndConds")} placeholder="e.g. Payment due within 30 days..." rows={2} />
        </div>
      </div>

      <Separator />

      {/* Order lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Order Lines</Label>
          <Button type="button" variant="outline" size="sm"
            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 14, sequence: fields.length })}>
            <Plus className="h-4 w-4 mr-1" />Add Line
          </Button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground px-3">
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-1">Qty</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-1">Disc%</div>
          <div className="col-span-1">Tax%</div>
          <div className="col-span-1" />
        </div>

        {fields.map((field, idx) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-md">
            <div className="col-span-12 sm:col-span-4">
              <Select value={watch(`lines.${idx}.productId`)} onValueChange={(v) => handleProductSelect(idx, v)}>
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
            <div className="col-span-8 sm:col-span-2">
              <Input {...register(`lines.${idx}.description`)} placeholder="Description" />
            </div>
            <div className="col-span-4 sm:col-span-1">
              <Input type="number" step="0.01" min="0" {...register(`lines.${idx}.quantity`)} />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <Input type="number" step="0.01" min="0" {...register(`lines.${idx}.unitPrice`)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input type="number" step="0.1" min="0" max="100" {...register(`lines.${idx}.discount`)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input type="number" step="0.1" min="0" {...register(`lines.${idx}.taxRate`)} />
            </div>
            <div className="col-span-2 sm:col-span-1 flex justify-end">
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA</span>
            <span>{tax.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

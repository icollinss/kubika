"use client";

import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { PurchaseOrderFormData } from "@/lib/actions/purchasing";

const schema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1),
    description: z.string().optional(),
    quantity: z.coerce.number().min(0.001),
    unitPrice: z.coerce.number().min(0),
    taxRate: z.coerce.number().min(0).default(14),
    sequence: z.coerce.number().default(0),
  })).min(1),
});

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; internalRef?: string | null; costPrice: number }
interface AnalyticAccount { id: string; code: string; name: string }

interface Props {
  defaultValues?: Partial<PurchaseOrderFormData>;
  onSubmit: (data: PurchaseOrderFormData) => Promise<void>;
  submitLabel?: string;
  suppliers: Supplier[];
  products: Product[];
  analyticAccounts?: AnalyticAccount[];
}

export function PurchaseOrderForm({ defaultValues, onSubmit, submitLabel = "Save", suppliers, products, analyticAccounts = [] }: Props) {
  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(schema) as Resolver<PurchaseOrderFormData>,
    defaultValues: {
      orderDate: new Date().toISOString().split("T")[0],
      lines: [{ productId: "", quantity: 1, unitPrice: 0, taxRate: 14, sequence: 0 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");

  const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
  const tax = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * ((l.taxRate || 0) / 100)), 0);
  const total = subtotal + tax;

  function handleProductSelect(idx: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    setValue(`lines.${idx}.productId`, productId);
    if (product) setValue(`lines.${idx}.unitPrice`, product.costPrice);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Supplier *</Label>
          <Select value={watch("supplierId")} onValueChange={(v) => setValue("supplierId", v)}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.supplierId && <p className="text-destructive text-sm">{errors.supplierId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Order Date</Label>
          <Input type="date" {...register("orderDate")} />
        </div>
        <div className="space-y-2">
          <Label>Expected Delivery</Label>
          <Input type="date" {...register("expectedDate")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} placeholder="Internal notes..." rows={2} />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Order Lines</Label>
          <Button type="button" variant="outline" size="sm"
            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, taxRate: 14, sequence: fields.length })}>
            <Plus className="h-4 w-4 mr-1" />Add Line
          </Button>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground px-3">
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Unit Cost</div>
          <div className="col-span-1">IVA%</div>
          <div className="col-span-1" />
        </div>

        {fields.map((field, idx) => (
          <div key={field.id} className="space-y-2 p-3 border rounded-md">
            <div className="grid grid-cols-12 gap-2 items-start">
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
              <div className="col-span-4 sm:col-span-2">
                <Input type="number" step="0.01" min="0" {...register(`lines.${idx}.quantity`)} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input type="number" step="0.01" min="0" {...register(`lines.${idx}.unitPrice`)} />
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
            {analyticAccounts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Analytic Account:</span>
                <Select
                  value={watch(`lines.${idx}.analyticAccountId`) || "__none__"}
                  onValueChange={(v) => setValue(`lines.${idx}.analyticAccountId`, v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="h-7 text-xs w-64">
                    <SelectValue placeholder="— None —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {analyticAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.code} · {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{subtotal.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{tax.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span></div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

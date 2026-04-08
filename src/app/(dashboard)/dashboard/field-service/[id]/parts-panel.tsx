"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { addServicePart, removeServicePart } from "@/lib/actions/field-service";

interface Product { id: string; name: string; internalRef: string | null; salePrice: number }
interface Part {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  product: { name: string; internalRef: string | null; salePrice: number };
}

interface Props {
  orderId: string;
  parts: Part[];
  products: Product[];
  readOnly?: boolean;
}

export function PartsPanel({ orderId, parts, products, readOnly }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const totalCost = parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) setUnitCost(String(product.salePrice));
  }

  async function handleAdd() {
    if (!productId) return;
    setAdding(true);
    try {
      await addServicePart(orderId, productId, parseFloat(quantity) || 1, parseFloat(unitCost) || 0);
      setProductId("");
      setQuantity("1");
      setUnitCost("0");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(partId: string) {
    setRemoving(partId);
    try {
      await removeServicePart(partId);
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-4">
      {parts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {!readOnly && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.product.name}
                  {p.product.internalRef && <span className="text-muted-foreground text-xs ml-1">[{p.product.internalRef}]</span>}
                </TableCell>
                <TableCell className="text-right">{p.quantity}</TableCell>
                <TableCell className="text-right">{p.unitCost.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</TableCell>
                <TableCell className="text-right font-semibold">{(p.quantity * p.unitCost).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-7 w-7"
                      disabled={removing !== null}
                      onClick={() => handleRemove(p.id)}
                    >
                      {removing === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No parts recorded yet.</p>
      )}

      {parts.length > 0 && (
        <div className="flex justify-end text-sm">
          <span className="font-semibold">Total parts cost: {totalCost.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} AOA</span>
        </div>
      )}

      {!readOnly && (
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Add Part</p>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-5 space-y-1">
              <Label className="text-xs">Product</Label>
              <Select value={productId} onValueChange={handleProductChange}>
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
            <div className="col-span-4 sm:col-span-2 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input type="number" min="0.001" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="col-span-5 sm:col-span-3 space-y-1">
              <Label className="text-xs">Unit Cost (AOA)</Label>
              <Input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <Button onClick={handleAdd} disabled={adding || !productId} className="w-full">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

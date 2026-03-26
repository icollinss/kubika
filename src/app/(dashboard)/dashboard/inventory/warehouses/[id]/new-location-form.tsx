"use client";

import { useState } from "react";
import { createLocation } from "@/lib/actions/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function NewLocationForm({ warehouseId }: { warehouseId: string }) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("INTERNAL");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    await createLocation({
      name: data.get("name") as string,
      locationType: type as "INTERNAL" | "VENDOR" | "CUSTOMER" | "VIRTUAL" | "TRANSIT",
      warehouseId,
      fullPath: data.get("fullPath") as string || undefined,
    });
    form.reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input name="name" required placeholder="e.g. Shelf A" className="w-40" />
      </div>
      <div className="space-y-2">
        <Label>Path</Label>
        <Input name="fullPath" placeholder="e.g. LDA/Stock/Shelf A" className="w-52" />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="INTERNAL">Internal</SelectItem>
            <SelectItem value="VENDOR">Vendor</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
            <SelectItem value="VIRTUAL">Virtual</SelectItem>
            <SelectItem value="TRANSIT">Transit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Location
      </Button>
    </form>
  );
}

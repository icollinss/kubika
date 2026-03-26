"use client";

import { useState } from "react";
import { createSerial } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function SerialForm({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    await createSerial({
      serial: data.get("serial") as string,
      productId,
    });
    form.reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="space-y-2">
        <Label htmlFor="serial">Serial Number *</Label>
        <Input id="serial" name="serial" required placeholder="e.g. SN-ABC123456" className="w-56" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Serial
      </Button>
    </form>
  );
}

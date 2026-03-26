"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWarehouse } from "@/lib/actions/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortCode: z.string().min(1).max(5),
  address: z.string().optional(),
});

export function NewWarehouseDialog() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />New Warehouse</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Warehouse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(async (data) => { await createWarehouse(data); setOpen(false); })} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Warehouse Name *</Label>
            <Input {...register("name")} placeholder="e.g. Luanda Main Warehouse" />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Short Code *</Label>
            <Input {...register("shortCode")} placeholder="e.g. LDA" maxLength={5} className="uppercase" />
            <p className="text-xs text-muted-foreground">Max 5 characters, used in location paths</p>
            {errors.shortCode && <p className="text-destructive text-sm">{errors.shortCode.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input {...register("address")} placeholder="e.g. Rua da Missão, Luanda" />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Warehouse
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

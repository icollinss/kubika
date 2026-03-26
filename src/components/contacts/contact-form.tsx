"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ContactFormData } from "@/lib/actions/contacts";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Angola"),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]).default("CUSTOMER"),
});

interface ContactFormProps {
  defaultValues?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  submitLabel?: string;
}

export function ContactForm({ defaultValues, onSubmit, submitLabel = "Save" }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      country: "Angola",
      type: "CUSTOMER",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Full Name / Company Name *</Label>
          <Input id="name" {...register("name")} placeholder="e.g. João Silva" />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select value={watch("type")} onValueChange={(v) => setValue("type", v as ContactFormData["type"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="SUPPLIER">Supplier</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tax ID */}
        <div className="space-y-2">
          <Label htmlFor="taxId">NIF (Tax ID)</Label>
          <Input id="taxId" {...register("taxId")} placeholder="e.g. 5000123456" />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
          {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+244 9XX XXX XXX" />
        </div>

        {/* Address */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} placeholder="Street address" />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="e.g. Luanda" />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} placeholder="Angola" />
        </div>

        {/* Notes */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" {...register("notes")} placeholder="Any additional notes..." />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

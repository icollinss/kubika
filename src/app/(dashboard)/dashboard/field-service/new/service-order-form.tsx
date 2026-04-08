"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ServiceOrderFormData } from "@/lib/actions/field-service";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  technicianId: z.string().optional(),
  scheduledAt: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  worksheetId: z.string().optional(),
  notes: z.string().optional(),
});

interface Customer { id: string; name: string }
interface Employee { id: string; firstName: string; lastName: string }
interface Template { id: string; name: string }

interface Props {
  defaultValues?: Partial<ServiceOrderFormData>;
  onSubmit: (data: ServiceOrderFormData) => Promise<void>;
  submitLabel?: string;
  customers: Customer[];
  employees: Employee[];
  templates: Template[];
}

export function ServiceOrderForm({ defaultValues, onSubmit, submitLabel = "Save", customers, employees, templates }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ServiceOrderFormData>({
    resolver: zodResolver(schema) as Resolver<ServiceOrderFormData>,
    defaultValues: { priority: "NORMAL", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Title *</Label>
          <Input {...register("title")} placeholder="e.g. AC unit repair at client office" />
          {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea {...register("description")} placeholder="Describe the issue or work to be done..." rows={3} />
        </div>

        <div className="space-y-2">
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
          <Label>Technician</Label>
          <Select value={watch("technicianId") || "__none__"} onValueChange={(v) => setValue("technicianId", v === "__none__" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Assign technician" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Unassigned —</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as "LOW" | "NORMAL" | "HIGH" | "URGENT")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Scheduled Date/Time</Label>
          <Input type="datetime-local" {...register("scheduledAt")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Service Address</Label>
          <Input {...register("address")} placeholder="e.g. Rua dos Coqueiros 123, Luanda" />
          <p className="text-xs text-muted-foreground">Enter the full address where the technician will attend.</p>
        </div>

        <div className="space-y-2">
          <Label>Latitude (optional)</Label>
          <Input type="number" step="any" {...register("latitude")} placeholder="-8.8368" />
        </div>
        <div className="space-y-2">
          <Label>Longitude (optional)</Label>
          <Input type="number" step="any" {...register("longitude")} placeholder="13.2343" />
        </div>

        {templates.length > 0 && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Worksheet Template</Label>
            <Select value={watch("worksheetId") || "__none__"} onValueChange={(v) => setValue("worksheetId", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select a worksheet template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The technician will fill out this form on-site.</p>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label>Internal Notes</Label>
          <Textarea {...register("notes")} placeholder="Internal notes..." rows={2} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

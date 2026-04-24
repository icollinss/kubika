"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BillsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <Select defaultValue={searchParams.get("status") ?? "ALL"}
      onValueChange={(v) => {
        const params = new URLSearchParams(searchParams.toString());
        if (v !== "ALL") params.set("status", v);
        else params.delete("status");
        router.push(`/dashboard/purchasing/bills?${params.toString()}`);
      }}>
      <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All statuses</SelectItem>
        <SelectItem value="DRAFT">Draft</SelectItem>
        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
        <SelectItem value="PARTIAL">Partial</SelectItem>
        <SelectItem value="PAID">Paid</SelectItem>
        <SelectItem value="OVERDUE">Overdue</SelectItem>
        <SelectItem value="CANCELLED">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  );
}

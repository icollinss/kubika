"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OperationsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Select
      defaultValue={searchParams.get("type") ?? "ALL"}
      onValueChange={(v) => {
        const params = new URLSearchParams();
        if (v !== "ALL") params.set("type", v);
        router.push(`/dashboard/inventory/operations?${params.toString()}`);
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue placeholder="All types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All operations</SelectItem>
        <SelectItem value="RECEIPT">Receipts</SelectItem>
        <SelectItem value="DELIVERY">Deliveries</SelectItem>
        <SelectItem value="INTERNAL">Transfers</SelectItem>
        <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
        <SelectItem value="RETURN">Returns</SelectItem>
        <SelectItem value="SCRAP">Scrap</SelectItem>
      </SelectContent>
    </Select>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useCallback } from "react";

export function ContactsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/dashboard/contacts?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          className="pl-9"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => update("search", e.target.value)}
        />
      </div>
      <Select
        defaultValue={searchParams.get("type") ?? "ALL"}
        onValueChange={(v) => update("type", v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          <SelectItem value="CUSTOMER">Customers</SelectItem>
          <SelectItem value="SUPPLIER">Suppliers</SelectItem>
          <SelectItem value="BOTH">Both</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

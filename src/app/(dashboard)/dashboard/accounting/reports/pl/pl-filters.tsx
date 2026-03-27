"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PLFilters({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const from = fd.get("from") as string;
    const to = fd.get("to") as string;
    router.push(`/dashboard/accounting/reports/pl?from=${from}&to=${to}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <Label className="text-xs">From</Label>
        <Input name="from" type="date" defaultValue={defaultFrom} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To</Label>
        <Input name="to" type="date" defaultValue={defaultTo} className="h-8 text-sm" />
      </div>
      <Button type="submit" size="sm">Apply</Button>
    </form>
  );
}

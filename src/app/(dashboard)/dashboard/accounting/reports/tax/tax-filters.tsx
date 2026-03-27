"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function TaxFilters({ defaultPeriod }: { defaultPeriod: string }) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    router.push(`/dashboard/accounting/reports/tax?period=${fd.get("period")}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="space-y-1">
        <Label className="text-xs">Period (YYYY-MM)</Label>
        <Input name="period" type="month" defaultValue={defaultPeriod} className="h-8 text-sm" />
      </div>
      <Button type="submit" size="sm">Apply</Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function BSFilters({ defaultAsOf }: { defaultAsOf: string }) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    router.push(`/dashboard/accounting/reports/balance-sheet?asOf=${fd.get("asOf")}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="space-y-1">
        <Label className="text-xs">As of Date</Label>
        <Input name="asOf" type="date" defaultValue={defaultAsOf} className="h-8 text-sm" />
      </div>
      <Button type="submit" size="sm">Apply</Button>
    </form>
  );
}

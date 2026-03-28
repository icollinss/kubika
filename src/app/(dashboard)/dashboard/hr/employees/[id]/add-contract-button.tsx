"use client";

import { useState } from "react";
import { createContract } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddContractButton({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractType, setContractType] = useState("PERMANENT");
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createContract({
        employeeId,
        contractType: contractType as "PERMANENT" | "FIXED_TERM" | "PART_TIME" | "INTERN" | "CONSULTANT",
        startDate: fd.get("startDate") as string,
        endDate: fd.get("endDate") as string || undefined,
        basicSalary: parseFloat(fd.get("basicSalary") as string),
        allowances: parseFloat(fd.get("allowances") as string || "0"),
        workingHours: parseFloat(fd.get("workingHours") as string || "8"),
        notes: fd.get("notes") as string || undefined,
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Contract</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["PERMANENT", "FIXED_TERM", "PART_TIME", "INTERN", "CONSULTANT"].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input name="startDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Basic Salary (AOA) *</Label>
              <Input name="basicSalary" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-1.5">
              <Label>Allowances (AOA)</Label>
              <Input name="allowances" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input name="endDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Working Hours/Day</Label>
              <Input name="workingHours" type="number" step="0.5" min="1" max="24" defaultValue="8" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input name="notes" placeholder="Optional" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Contract
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

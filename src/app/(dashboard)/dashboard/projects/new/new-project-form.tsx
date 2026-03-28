"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AnalyticAccount { id: string; code: string; name: string }
interface Employee { id: string; firstName: string; lastName: string }

export function NewProjectForm({ analyticAccounts, employees }: { analyticAccounts: AnalyticAccount[]; employees: Employee[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("MEDIUM");
  const [analyticId, setAnalyticId] = useState("");
  const [managerId, setManagerId] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const project = await createProject({
        name: fd.get("name") as string,
        description: fd.get("description") as string || undefined,
        startDate: fd.get("startDate") as string || undefined,
        endDate: fd.get("endDate") as string || undefined,
        budget: parseFloat(fd.get("budget") as string || "0"),
        priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        analyticAccountId: analyticId || undefined,
        managerId: managerId || undefined,
      });
      router.push(`/dashboard/projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  }

  const Sel = ({ value, onChange, placeholder, children }: { value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode }) => (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— None —</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Project Name *</Label>
        <Input name="name" required placeholder="e.g. Warehouse Expansion" />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea name="description" rows={3} placeholder="Project overview..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input name="startDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input name="endDate" type="date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Budget (AOA)</Label>
          <Input name="budget" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Analytic Account</Label>
          <Sel value={analyticId} onChange={setAnalyticId} placeholder="Select account">
            {analyticAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.code} · {a.name}</SelectItem>
            ))}
          </Sel>
        </div>
        <div className="space-y-2">
          <Label>Project Manager</Label>
          <Sel value={managerId} onChange={setManagerId} placeholder="Select manager">
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
            ))}
          </Sel>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Project
      </Button>
    </form>
  );
}

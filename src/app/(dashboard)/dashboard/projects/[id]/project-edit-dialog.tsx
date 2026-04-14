"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";

interface AnalyticAccount { id: string; code: string; name: string }

interface Project {
  id: string;
  name: string;
  description: string | null;
  budget: number;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  analyticAccountId: string | null;
}

interface Props {
  project: Project;
  analyticAccounts: AnalyticAccount[];
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function ProjectEditDialog({ project, analyticAccounts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    budget: project.budget.toString(),
    priority: project.priority,
    startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
    endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
    analyticAccountId: project.analyticAccountId ?? "__none__",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        budget: parseFloat(form.budget) || 0,
        priority: form.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        analyticAccountId: form.analyticAccountId === "__none__" ? undefined : form.analyticAccountId,
      });
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Project Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Budget (AOA)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Analytic Account</Label>
            <Select
              value={form.analyticAccountId}
              onValueChange={(v) => setForm({ ...form, analyticAccountId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {analyticAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {analyticAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No analytic accounts yet.{" "}
                <a href="/dashboard/accounting/analytic" className="underline">Create one first.</a>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

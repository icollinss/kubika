"use client";

import { useState } from "react";
import { logTime } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface TimesheetEntry {
  id: string;
  hours: number;
  date: Date;
  description: string | null;
  employee: { firstName: string; lastName: string };
  task: { title: string } | null;
}

export function TimesheetSection({
  projectId, timesheets, employees, tasks,
}: {
  projectId: string;
  timesheets: TimesheetEntry[];
  employees: { id: string; name: string }[];
  tasks: { id: string; title: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [taskId, setTaskId] = useState("");
  const router = useRouter();

  const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await logTime({
        projectId,
        taskId: taskId || undefined,
        employeeId,
        date: fd.get("date") as string,
        hours: parseFloat(fd.get("hours") as string),
        description: fd.get("description") as string || undefined,
      });
      setAdding(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Timesheets</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{totalHours.toFixed(1)}h total</span>
          <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Time
          </Button>
        </div>
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b bg-muted/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id} className="text-sm">{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Task</Label>
            <Select value={taskId || "__none__"} onValueChange={(v) => setTaskId(v === "__none__" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="No task" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No task</SelectItem>
                {tasks.map((t) => <SelectItem key={t.id} value={t.id} className="text-sm">{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date *</Label>
            <Input name="date" type="date" className="h-8 text-sm" defaultValue={new Date().toISOString().split("T")[0]} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hours *</Label>
            <Input name="hours" type="number" step="0.25" min="0.25" max="24" className="h-8 text-sm" defaultValue="1" required />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Description</Label>
            <Input name="description" className="h-8 text-sm" placeholder="What was done..." />
          </div>
          <div className="col-span-2 flex gap-2 items-end">
            <Button type="submit" size="sm" disabled={loading || !employeeId}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {timesheets.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">No time logged yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Employee</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Task</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">Description</th>
              <th className="px-4 py-2 text-right">Hours</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2 text-muted-foreground">{format(new Date(t.date), "dd/MM/yyyy")}</td>
                <td className="px-4 py-2 font-medium">{t.employee.firstName} {t.employee.lastName}</td>
                <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{t.task?.title ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{t.description ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono">{t.hours.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t font-semibold">
              <td className="px-4 py-2" colSpan={4}>Total Hours</td>
              <td className="px-4 py-2 text-right font-mono">{totalHours.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

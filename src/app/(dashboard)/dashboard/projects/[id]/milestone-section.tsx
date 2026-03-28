"use client";

import { useState } from "react";
import { createMilestone, toggleMilestone } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  dueDate: Date | null;
  isDone: boolean;
  tasks: { id: string; status: string }[];
}

export function MilestoneSection({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const router = useRouter();

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createMilestone({ projectId, name, dueDate: dueDate || undefined });
      setName("");
      setDueDate("");
      setAdding(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    await toggleMilestone(id, projectId);
    router.refresh();
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">Milestones</span>
        <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {adding && (
        <div className="px-4 py-3 border-b flex gap-2 items-center flex-wrap bg-muted/20">
          <Input
            className="h-8 text-sm flex-1 min-w-40"
            placeholder="Milestone name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Input
            className="h-8 text-sm w-36"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      )}

      {milestones.length === 0 && !adding ? (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">No milestones yet.</p>
      ) : (
        <div className="divide-y">
          {milestones.map((ms) => {
            const taskTotal = ms.tasks.length;
            const taskDone = ms.tasks.filter((t) => t.status === "DONE").length;
            const pct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
            return (
              <div key={ms.id} className="px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => handleToggle(ms.id)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {ms.isDone
                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                    : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${ms.isDone ? "line-through text-muted-foreground" : ""}`}>
                    {ms.name}
                  </p>
                  {taskTotal > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden max-w-32">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{taskDone}/{taskTotal}</span>
                    </div>
                  )}
                </div>
                {ms.dueDate && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(ms.dueDate), "dd MMM")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

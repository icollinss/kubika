"use client";

import { useState } from "react";
import { createTask, updateTaskStatus } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assigneeId: string | null;
  estimatedHours: number;
}

interface Props {
  projectId: string;
  tasks: Task[];
  milestones: { id: string; name: string }[];
  employees: { id: string; name: string }[];
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "TODO", label: "To Do", color: "bg-gray-100" },
  { status: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100" },
  { status: "IN_REVIEW", label: "In Review", color: "bg-yellow-100" },
  { status: "DONE", label: "Done", color: "bg-green-100" },
];

const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export function TaskBoard({ projectId, tasks, milestones, employees }: Props) {
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [milestoneId, setMilestoneId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdd(status: TaskStatus) {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({
        projectId,
        title,
        status,
        priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        milestoneId: milestoneId || undefined,
        assigneeId: assigneeId || undefined,
      });
      setTitle("");
      setPriority("MEDIUM");
      setMilestoneId("");
      setAssigneeId("");
      setAddingTo(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(taskId: string, status: TaskStatus) {
    await updateTaskStatus(taskId, projectId, status);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Tasks</h3>
        <Button size="sm" variant="outline" onClick={() => setAddingTo("TODO")}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {columns.map(({ status, label, color }) => {
          const colTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="rounded-lg border overflow-hidden">
              <div className={`px-3 py-2 border-b flex items-center justify-between ${color}`}>
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>

              <div className="p-2 space-y-2 min-h-20">
                {colTasks.map((task) => (
                  <div key={task.id} className="rounded-md border bg-card p-2.5 space-y-1.5 text-xs">
                    <p className="font-medium text-sm leading-tight">{task.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-xs py-0 ${priorityColor[task.priority]}`}>
                        {task.priority}
                      </Badge>
                      {task.estimatedHours > 0 && (
                        <span className="text-muted-foreground">{task.estimatedHours}h</span>
                      )}
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1 flex-wrap pt-0.5">
                      {columns.filter((c) => c.status !== status).map((c) => (
                        <button
                          key={c.status}
                          onClick={() => handleMove(task.id, c.status)}
                          className="text-xs text-muted-foreground hover:text-primary underline"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add task form for this column */}
                {addingTo === status && (
                  <div className="space-y-2 pt-1">
                    <Input
                      className="h-7 text-xs"
                      placeholder="Task title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd(status)}
                      autoFocus
                    />
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {milestones.length > 0 && (
                      <Select value={milestoneId || "__none__"} onValueChange={(v) => setMilestoneId(v === "__none__" ? "" : v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Milestone" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No milestone</SelectItem>
                          {milestones.map((m) => <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {employees.length > 0 && (
                      <Select value={assigneeId || "__none__"} onValueChange={(v) => setAssigneeId(v === "__none__" ? "" : v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Assignee" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Unassigned</SelectItem>
                          {employees.map((e) => <SelectItem key={e.id} value={e.id} className="text-xs">{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => handleAdd(status)} disabled={loading || !title.trim()}>
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setAddingTo(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {addingTo !== status && (
                  <button
                    onClick={() => setAddingTo(status)}
                    className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-1 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

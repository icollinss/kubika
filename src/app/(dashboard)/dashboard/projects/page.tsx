import { getProjects, getProjectStats } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FolderKanban, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default async function ProjectsPage() {
  const [projects, stats] = await Promise.all([getProjects(), getProjectStats()]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: FolderKanban, color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, icon: TrendingUp, color: "text-blue-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600" },
          { label: "Over Budget", value: stats.overBudget, icon: AlertTriangle, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border p-4 flex items-center gap-3">
            <Icon className={`h-8 w-8 ${color}`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      {projects.length === 0 ? (
        <div className="border rounded-lg py-20 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No projects yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard/projects/new">Create First Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const totalTasks = p.tasks.length;
            const doneTasks = p.tasks.filter((t) => t.status === "DONE").length;
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            const totalMilestones = p.milestones.length;
            const doneMilestones = p.milestones.filter((m) => m.isDone).length;

            return (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="rounded-lg border p-5 hover:bg-muted/30 transition-colors space-y-4 block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{p.reference}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${priorityColor[p.priority]}`}>
                    {p.priority}
                  </Badge>
                </div>

                {p.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                )}

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tasks: {doneTasks}/{totalTasks}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    <span>{doneMilestones}/{totalMilestones} milestones</span>
                    {p.budget > 0 && (
                      <span>Budget: {p.budget.toLocaleString("pt-AO", { maximumFractionDigits: 0 })} AOA</span>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusColor[p.status]}`}>{p.status.replace("_", " ")}</Badge>
                </div>

                {p.endDate && (
                  <p className="text-xs text-muted-foreground">Due: {format(new Date(p.endDate), "dd MMM yyyy")}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

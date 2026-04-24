import { getProjects, getProjectStats } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Plus, FolderKanban, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; accent: string; tagColor: string; badgeClass: string }> = {
  DRAFT:       { label: "Draft",       accent: "border-l-gray-400",   tagColor: "bg-gray-100 text-gray-700",   badgeClass: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "In Progress", accent: "border-l-blue-500",   tagColor: "bg-blue-100 text-blue-800",   badgeClass: "bg-blue-100 text-blue-800" },
  ON_HOLD:     { label: "On Hold",     accent: "border-l-yellow-500", tagColor: "bg-yellow-100 text-yellow-800",badgeClass: "bg-yellow-100 text-yellow-800" },
  COMPLETED:   { label: "Completed",   accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-800", badgeClass: "bg-green-100 text-green-800" },
  CANCELLED:   { label: "Cancelled",   accent: "border-l-red-400",    tagColor: "bg-red-100 text-red-800",     badgeClass: "bg-red-100 text-red-800" },
};

const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600", MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700", URGENT: "bg-red-100 text-red-700",
};

const STATUS_ORDER = ["DRAFT", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

interface Props { searchParams: Promise<{ view?: string }> }

export default async function ProjectsPage({ searchParams }: Props) {
  const { view = "kanban" } = await searchParams;
  const currentView = view as ViewMode;
  const [projects, stats] = await Promise.all([getProjects(), getProjectStats()]);

  // Kanban by status
  const kanbanColumns: KanbanColumn[] = STATUS_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, total: 0, cards: [],
  }));
  for (const p of projects) {
    const col = kanbanColumns.find((c) => c.id === p.status);
    if (!col) continue;
    col.count++;
    col.total = (col.total ?? 0) + (p.budget ?? 0);
    const doneTasks = p.tasks.filter((t: { status: string }) => t.status === "DONE").length;
    const totalTasks = p.tasks.length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    col.cards.push({
      id: p.id, href: `/dashboard/projects/${p.id}`,
      title: p.name,
      subtitle: p.reference ?? undefined,
      value: p.budget > 0 ? p.budget : undefined,
      tag: p.priority,
      tagColor: priorityColor[p.priority] ?? "bg-muted text-muted-foreground",
      meta: totalTasks > 0 ? `${progress}% done` : undefined,
    });
  }

  // Pivot by status
  const pivotRows: PivotRow[] = STATUS_ORDER.map((s) => {
    const group = projects.filter((p) => p.status === s);
    return {
      group: statusConfig[s].label,
      count: group.length,
      total: group.reduce((sum, p) => sum + (p.budget ?? 0), 0),
    };
  }).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild size="sm">
            <Link href="/dashboard/projects/new"><Plus className="mr-2 h-4 w-4" />New Project</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",       value: stats.total,      icon: FolderKanban,  color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, icon: TrendingUp,    color: "text-blue-600" },
          { label: "Completed",   value: stats.completed,  icon: CheckCircle2,  color: "text-green-600" },
          { label: "Over Budget", value: stats.overBudget, icon: AlertTriangle, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border p-4 flex items-center gap-3">
            <Icon className={`h-8 w-8 ${color}`} />
            <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="border rounded-lg py-20 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No projects yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard/projects/new">Create First Project</Link>
          </Button>
        </div>
      ) : (
        <>
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}

          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden sm:table-cell">Progress</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Budget (AOA)</TableHead>
                    <TableHead className="hidden sm:table-cell">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => {
                    const doneTasks = p.tasks.filter((t: { status: string }) => t.status === "DONE").length;
                    const totalTasks = p.tasks.length;
                    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="p-0">
                          <Link href={`/dashboard/projects/${p.id}`} className="flex flex-col px-4 py-2.5 hover:underline">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusConfig[p.status]?.badgeClass ?? ""}`}>
                            {statusConfig[p.status]?.label ?? p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${priorityColor[p.priority] ?? ""}`}>{p.priority}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell">
                          {p.budget > 0 ? p.budget.toLocaleString("pt-AO", { maximumFractionDigits: 0 }) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                          {p.endDate ? format(new Date(p.endDate), "dd/MM/yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Status" showTotal />}
        </>
      )}
    </div>
  );
}

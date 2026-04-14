import { getProject, getAnalyticAccounts } from "@/lib/actions/projects";
import { getEmployees } from "@/lib/actions/hr";
import { ProjectEditDialog } from "./project-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ProjectStatusSelect } from "./project-status-select";
import { MilestoneSection } from "./milestone-section";
import { TaskBoard } from "./task-board";
import { BudgetSection } from "./budget-section";
import { TimesheetSection } from "./timesheet-section";

const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const [project, employees, analyticAccounts] = await Promise.all([
    getProject(params.id),
    getEmployees(),
    getAnalyticAccounts(),
  ]);
  if (!project) notFound();

  // Flatten all tasks (milestoned + unattached)
  const allTasks = [
    ...project.tasks,
    ...project.milestones.flatMap((m) => m.tasks),
  ];

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalExpenses = project.expenses.reduce((s, e) => s + e.amount, 0);
  const totalHours = project.timesheets.reduce((s, t) => s + t.hours, 0);

  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline" className={priorityColor[project.priority]}>{project.priority}</Badge>
          </div>
          <p className="text-sm font-mono text-muted-foreground mt-1">{project.reference}</p>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ProjectEditDialog project={project} analyticAccounts={analyticAccounts} />
          <ProjectStatusSelect projectId={project.id} currentStatus={project.status} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Progress", value: `${progress}%`, sub: `${doneTasks}/${totalTasks} tasks` },
          { label: "Budget", value: project.budget > 0 ? fmt(project.budget) : "—", sub: "AOA" },
          { label: "Spent", value: fmt(totalExpenses), sub: project.budget > 0 ? `${Math.round((totalExpenses / project.budget) * 100)}% of budget` : "AOA" },
          { label: "Hours Logged", value: totalHours.toFixed(1), sub: "hours" },
          { label: "Milestones", value: `${project.milestones.filter((m) => m.isDone).length}/${project.milestones.length}`, sub: "completed" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Dates & info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm rounded-lg border p-4">
        <div>
          <span className="text-muted-foreground text-xs">Start Date</span>
          <p className="mt-0.5">{project.startDate ? format(new Date(project.startDate), "dd MMM yyyy") : "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">End Date</span>
          <p className="mt-0.5">{project.endDate ? format(new Date(project.endDate), "dd MMM yyyy") : "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Analytic Account</span>
          <p className="mt-0.5">{project.analyticAccount ? `${project.analyticAccount.code} · ${project.analyticAccount.name}` : "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Budget vs Spent</span>
          <p className={`mt-0.5 font-mono ${totalExpenses > project.budget && project.budget > 0 ? "text-red-600 font-bold" : ""}`}>
            {fmt(totalExpenses)} / {project.budget > 0 ? fmt(project.budget) : "—"}
          </p>
        </div>
      </div>

      {/* Milestones */}
      <MilestoneSection projectId={project.id} milestones={project.milestones} />

      {/* Task board */}
      <TaskBoard
        projectId={project.id}
        tasks={allTasks}
        milestones={project.milestones.map((m) => ({ id: m.id, name: m.name }))}
        employees={employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))}
      />

      {/* Budget / Expenses */}
      <BudgetSection
        projectId={project.id}
        expenses={project.expenses}
        budget={project.budget}
      />

      {/* Timesheets */}
      <TimesheetSection
        projectId={project.id}
        timesheets={project.timesheets}
        employees={employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }))}
        tasks={allTasks.map((t) => ({ id: t.id, title: t.title }))}
      />
    </div>
  );
}

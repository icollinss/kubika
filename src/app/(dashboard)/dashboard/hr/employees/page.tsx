import { getEmployees } from "@/lib/actions/hr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Plus, UserCheck, UserX, Clock } from "lucide-react";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const statusConfig: Record<string, { label: string; accent: string; tagColor: string; badgeClass: string }> = {
  ACTIVE:     { label: "Active",     accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-800",  badgeClass: "bg-green-100 text-green-800" },
  ON_LEAVE:   { label: "On Leave",   accent: "border-l-yellow-500", tagColor: "bg-yellow-100 text-yellow-800",badgeClass: "bg-yellow-100 text-yellow-800" },
  SUSPENDED:  { label: "Suspended",  accent: "border-l-orange-500", tagColor: "bg-orange-100 text-orange-800",badgeClass: "bg-orange-100 text-orange-800" },
  TERMINATED: { label: "Terminated", accent: "border-l-red-500",    tagColor: "bg-red-100 text-red-800",     badgeClass: "bg-red-100 text-red-800" },
};

const STATUS_ORDER = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"];

interface Props { searchParams: Promise<{ view?: string }> }

export default async function EmployeesPage({ searchParams }: Props) {
  const { view = "list" } = await searchParams;
  const currentView = view as ViewMode;
  const employees = await getEmployees();

  const active     = employees.filter((e) => e.status === "ACTIVE").length;
  const onLeave    = employees.filter((e) => e.status === "ON_LEAVE").length;
  const terminated = employees.filter((e) => e.status === "TERMINATED").length;

  // Kanban by status
  const kanbanColumns: KanbanColumn[] = STATUS_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, cards: [],
  }));
  for (const emp of employees) {
    const col = kanbanColumns.find((c) => c.id === emp.status);
    if (!col) continue;
    col.count++;
    col.cards.push({
      id: emp.id, href: `/dashboard/hr/employees/${emp.id}`,
      title: `${emp.firstName} ${emp.lastName}`,
      subtitle: emp.jobTitle ?? undefined,
      tag: emp.department?.name ?? undefined,
      tagColor: "bg-muted text-muted-foreground",
      initials: `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase(),
    });
  }

  // Pivot by department
  const deptMap = new Map<string, number>();
  for (const emp of employees) {
    const dept = emp.department?.name ?? "No Department";
    deptMap.set(dept, (deptMap.get(dept) ?? 0) + 1);
  }
  const pivotRows: PivotRow[] = Array.from(deptMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({ group, count, total: 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">{employees.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild size="sm">
            <Link href="/dashboard/hr/employees/new"><Plus className="mr-2 h-4 w-4" />New Employee</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-green-600" />
          <div><p className="text-2xl font-bold">{active}</p><p className="text-xs text-muted-foreground">Active</p></div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-yellow-600" />
          <div><p className="text-2xl font-bold">{onLeave}</p><p className="text-xs text-muted-foreground">On Leave</p></div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <UserX className="h-8 w-8 text-red-600" />
          <div><p className="text-2xl font-bold">{terminated}</p><p className="text-xs text-muted-foreground">Terminated</p></div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="border rounded-lg py-20 text-center">
          <p className="text-muted-foreground text-sm">No employees yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard/hr/employees/new">Add First Employee</Link>
          </Button>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="hidden sm:table-cell">Job Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Department</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Salary (AOA)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const contract = emp.contracts[0];
                    return (
                      <TableRow key={emp.id} className="hover:bg-muted/20 cursor-pointer">
                        <TableCell className="p-0">
                          <Link href={`/dashboard/hr/employees/${emp.id}`} className="flex flex-col px-4 py-2.5 hover:underline">
                            <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                            <span className="text-xs text-muted-foreground font-mono">{emp.employeeNumber}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{emp.jobTitle ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">{emp.department?.name ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono hidden sm:table-cell">
                          {contract ? (contract.basicSalary + contract.allowances).toLocaleString("pt-AO", { minimumFractionDigits: 2 }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig[emp.status]?.badgeClass ?? ""}>
                            {statusConfig[emp.status]?.label ?? emp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Department" showTotal={false} />}
        </>
      )}
    </div>
  );
}

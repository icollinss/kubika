import { getEmployees } from "@/lib/actions/hr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, UserCheck, UserX, Clock } from "lucide-react";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_LEAVE: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  TERMINATED: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

export default async function EmployeesPage() {
  const employees = await getEmployees();

  const active = employees.filter((e) => e.status === "ACTIVE").length;
  const onLeave = employees.filter((e) => e.status === "ON_LEAVE").length;
  const terminated = employees.filter((e) => e.status === "TERMINATED").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">{employees.length} total</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hr/employees/new">
            <Plus className="mr-2 h-4 w-4" /> New Employee
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold">{active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-yellow-600" />
          <div>
            <p className="text-2xl font-bold">{onLeave}</p>
            <p className="text-xs text-muted-foreground">On Leave</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <UserX className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-2xl font-bold">{terminated}</p>
            <p className="text-xs text-muted-foreground">Terminated</p>
          </div>
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
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Job Title</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Department</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Salary (AOA)</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const contract = emp.contracts[0];
                return (
                  <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{emp.employeeNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{emp.jobTitle ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{emp.department?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono hidden sm:table-cell">
                      {contract
                        ? (contract.basicSalary + contract.allowances).toLocaleString("pt-AO", { minimumFractionDigits: 2 })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColor[emp.status] ?? ""}>
                        {statusLabel[emp.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/hr/employees/${emp.id}`} className="text-xs text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

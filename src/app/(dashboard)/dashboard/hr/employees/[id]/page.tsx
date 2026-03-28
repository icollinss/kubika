import { getEmployee } from "@/lib/actions/hr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AddContractButton } from "./add-contract-button";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_LEAVE: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  TERMINATED: "bg-red-100 text-red-800",
};

const contractTypeLabel: Record<string, string> = {
  PERMANENT: "Permanent",
  FIXED_TERM: "Fixed-Term",
  PART_TIME: "Part-Time",
  INTERN: "Intern",
  CONSULTANT: "Consultant",
};

export default async function EmployeePage({ params }: { params: { id: string } }) {
  const emp = await getEmployee(params.id);
  if (!emp) notFound();

  const activeContract = emp.contracts.find((c) => c.status === "ACTIVE");
  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{emp.firstName} {emp.lastName}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{emp.employeeNumber}</p>
        </div>
        <Badge variant="outline" className={statusColor[emp.status] ?? ""}>{emp.status}</Badge>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-lg border p-4 text-sm">
        {[
          ["Job Title", emp.jobTitle ?? "—"],
          ["Department", emp.department?.name ?? "—"],
          ["Email", emp.email ?? "—"],
          ["Phone", emp.phone ?? "—"],
          ["NIF", emp.nif ?? "—"],
          ["INSS", emp.inssNumber ?? "—"],
          ["Hire Date", format(new Date(emp.hireDate), "dd/MM/yyyy")],
          ["Date of Birth", emp.dateOfBirth ? format(new Date(emp.dateOfBirth), "dd/MM/yyyy") : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="text-muted-foreground text-xs">{label}</span>
            <p className="font-medium mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Active Contract */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b">
          <span className="font-semibold text-sm">Active Contract</span>
          <AddContractButton employeeId={emp.id} />
        </div>
        {activeContract ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Type</span>
              <p className="font-medium mt-0.5">{contractTypeLabel[activeContract.contractType]}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Basic Salary</span>
              <p className="font-mono font-medium mt-0.5">{fmt(activeContract.basicSalary)} AOA</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Allowances</span>
              <p className="font-mono font-medium mt-0.5">{fmt(activeContract.allowances)} AOA</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Gross Salary</span>
              <p className="font-mono font-bold mt-0.5">{fmt(activeContract.basicSalary + activeContract.allowances)} AOA</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Start Date</span>
              <p className="font-medium mt-0.5">{format(new Date(activeContract.startDate), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">End Date</span>
              <p className="font-medium mt-0.5">{activeContract.endDate ? format(new Date(activeContract.endDate), "dd/MM/yyyy") : "Open-ended"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Working Hours/Day</span>
              <p className="font-medium mt-0.5">{activeContract.workingHours}h</p>
            </div>
          </div>
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No active contract.</p>
        )}
      </div>

      {/* Payslip History */}
      {emp.payslips.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b font-semibold text-sm">Payslip History</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Period</th>
                <th className="px-4 py-2 text-right font-medium">Gross</th>
                <th className="px-4 py-2 text-right font-medium">IRT</th>
                <th className="px-4 py-2 text-right font-medium">Net</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {emp.payslips.map((ps) => (
                <tr key={ps.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2 font-mono text-xs">{ps.period}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(ps.grossSalary)}</td>
                  <td className="px-4 py-2 text-right font-mono text-red-600">{fmt(ps.irtAmount)}</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{fmt(ps.netSalary)}</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className={ps.status === "PAID" ? "bg-green-100 text-green-800" : ps.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}>
                      {ps.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/dashboard/hr/payroll/${ps.id}`} className="text-xs text-primary hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

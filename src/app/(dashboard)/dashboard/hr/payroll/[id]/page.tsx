import { getPayslip } from "@/lib/actions/hr";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PayslipActions } from "./payslip-actions";

const statusColor: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
};

export default async function PayslipPage({ params }: { params: { id: string } }) {
  const ps = await getPayslip(params.id);
  if (!ps) notFound();

  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  const earnings = ps.lines.filter((l) => l.type === "EARNING");
  const deductions = ps.lines.filter((l) => l.type === "DEDUCTION");

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{ps.number}</h1>
          <p className="text-sm text-muted-foreground mt-1">Period: {ps.period}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={statusColor[ps.status] ?? ""}>{ps.status}</Badge>
          <PayslipActions payslipId={ps.id} status={ps.status} />
        </div>
      </div>

      {/* Employee Info */}
      <div className="rounded-lg border p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Employee</span>
          <p className="font-semibold mt-0.5">{ps.employee.firstName} {ps.employee.lastName}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Employee Number</span>
          <p className="font-mono mt-0.5">{ps.employee.employeeNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Department</span>
          <p className="mt-0.5">{ps.employee.department?.name ?? "—"}</p>
        </div>
        {ps.paidAt && (
          <div>
            <span className="text-muted-foreground text-xs">Paid On</span>
            <p className="mt-0.5">{format(new Date(ps.paidAt), "dd/MM/yyyy")}</p>
          </div>
        )}
      </div>

      {/* Pay Lines */}
      <div className="rounded-lg border overflow-hidden">
        {earnings.length > 0 && (
          <>
            <div className="bg-green-50 px-4 py-2 border-b text-xs font-semibold text-green-800">Earnings</div>
            {earnings.map((l) => (
              <div key={l.id} className="flex justify-between px-4 py-2 text-sm border-b">
                <span>{l.label}</span>
                <span className="font-mono">{fmt(l.amount)}</span>
              </div>
            ))}
          </>
        )}

        <div className="flex justify-between px-4 py-2 text-sm font-semibold bg-muted/30 border-b">
          <span>Gross Salary</span>
          <span className="font-mono">{fmt(ps.grossSalary)}</span>
        </div>

        {deductions.length > 0 && (
          <>
            <div className="bg-red-50 px-4 py-2 border-b text-xs font-semibold text-red-800">Deductions</div>
            {deductions.map((l) => (
              <div key={l.id} className="flex justify-between px-4 py-2 text-sm border-b">
                <span>{l.label}</span>
                <span className="font-mono text-red-600">{fmt(l.amount)}</span>
              </div>
            ))}
          </>
        )}

        {/* Summary */}
        <div className="px-4 py-3 space-y-1.5 text-sm border-t bg-muted/10">
          <div className="flex justify-between text-muted-foreground">
            <span>INSS (Employer 8%)</span>
            <span className="font-mono text-orange-600">{fmt(ps.inssEmployer)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Net Salary</span>
            <span className="font-mono text-green-700">{fmt(ps.netSalary)} AOA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

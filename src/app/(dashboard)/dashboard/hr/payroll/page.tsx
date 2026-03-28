import { getPayslips } from "@/lib/actions/hr";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { GeneratePayrollButton } from "./generate-payroll-button";

interface SearchParams { period?: string }

const statusColor: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
};

export default async function PayrollPage({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const period = searchParams.period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const payslips = await getPayslips(period);

  const totalGross = payslips.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalIRT = payslips.reduce((s, p) => s + p.irtAmount, 0);
  const totalINSS = payslips.reduce((s, p) => s + p.inssEmployee + p.inssEmployer, 0);

  const fmt = (n: number) => n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">Period: {period}</p>
        </div>
        <GeneratePayrollButton period={period} />
      </div>

      {/* Period selector */}
      <form method="get" className="flex gap-2 items-center">
        <input
          name="period"
          type="month"
          defaultValue={period}
          className="border rounded-md px-3 py-1.5 text-sm h-9"
        />
        <button type="submit" className="border rounded-md px-3 py-1.5 text-sm h-9 hover:bg-muted transition-colors">
          Apply
        </button>
      </form>

      {/* Summary cards */}
      {payslips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Gross Payroll", value: fmt(totalGross), color: "text-foreground" },
            { label: "Total IRT", value: fmt(totalIRT), color: "text-red-600" },
            { label: "Total INSS", value: fmt(totalINSS), color: "text-orange-600" },
            { label: "Net Payroll", value: fmt(totalNet), color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {payslips.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <p className="text-muted-foreground text-sm">No payslips for {period}.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Generate Payroll" to create payslips for all active employees.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Gross (AOA)</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">IRT</th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">INSS</th>
                <th className="px-4 py-3 text-right font-medium">Net (AOA)</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payslips.map((ps) => (
                <tr key={ps.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{ps.employee.firstName} {ps.employee.lastName}</div>
                    <div className="text-xs font-mono text-muted-foreground">{ps.number}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono hidden sm:table-cell">{fmt(ps.grossSalary)}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 hidden sm:table-cell">{fmt(ps.irtAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-orange-600 hidden sm:table-cell">{fmt(ps.inssEmployee)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{fmt(ps.netSalary)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColor[ps.status] ?? ""}>{ps.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
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

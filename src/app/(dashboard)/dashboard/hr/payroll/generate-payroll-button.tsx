"use client";

import { useState } from "react";
import { generatePayroll } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export function GeneratePayrollButton({ period }: { period: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    if (!confirm(`Generate payroll for ${period}? This will create payslips for all active employees with active contracts.`)) return;
    setLoading(true);
    const result = await generatePayroll(period);
    setLoading(false);
    router.refresh();
    if (result.generated === 0) alert("No new payslips to generate (all employees may already have payslips for this period).");
    else alert(`Generated ${result.generated} payslip(s).`);
  }

  return (
    <Button onClick={handleGenerate} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
      Generate Payroll
    </Button>
  );
}

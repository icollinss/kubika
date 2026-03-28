"use client";

import { useState } from "react";
import { confirmPayslip, markPayslipPaid } from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export function PayslipActions({ payslipId, status }: { payslipId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      await confirmPayslip(payslipId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    setLoading(true);
    try {
      await markPayslipPaid(payslipId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "PAID") return null;

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <Button size="sm" variant="outline" onClick={handleConfirm} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1 h-3.5 w-3.5" />}
          Confirm
        </Button>
      )}
      {status === "CONFIRMED" && (
        <Button size="sm" onClick={handlePay} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CreditCard className="mr-1 h-3.5 w-3.5" />}
          Mark Paid
        </Button>
      )}
    </div>
  );
}

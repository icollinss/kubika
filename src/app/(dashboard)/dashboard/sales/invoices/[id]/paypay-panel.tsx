"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Smartphone, RefreshCw, X, QrCode, Copy, CheckCircle, AlertCircle,
} from "lucide-react";
import {
  generateMcxReference,
  generateAppReference,
  refreshReferenceStatus,
  cancelPaymentReference,
} from "@/lib/actions/paypay";

type Ref = {
  id: string;
  method: string;
  entity: string | null;
  reference: string | null;
  payUrl: string | null;
  amount: number;
  status: string;
  expiresAt: Date | null;
  paidAt: Date | null;
  providerRef: string | null;
  createdAt: Date;
};

interface Props {
  invoiceId: string;
  amountDue: number;
  existingRefs: Ref[];
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  PAID:      "bg-green-100 text-green-700",
  EXPIRED:   "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pendente",
  PAID:      "Pago",
  EXPIRED:   "Expirado",
  CANCELLED: "Cancelado",
};

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-AO");
}

export function PayPayPanel({ invoiceId, amountDue, existingRefs: initial }: Props) {
  const [refs, setRefs]     = useState<Ref[]>(initial);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const activeRef = refs.find((r) => r.status === "PENDING");
  const paidRef   = refs.find((r) => r.status === "PAID");

  function handleError(e: unknown) {
    setError(e instanceof Error ? e.message : "Erro inesperado");
  }

  function genMcx() {
    setError("");
    startTransition(async () => {
      try {
        const r = await generateMcxReference(invoiceId);
        setRefs((prev) => [r as unknown as Ref, ...prev]);
      } catch (e) { handleError(e); }
    });
  }

  function genApp() {
    setError("");
    startTransition(async () => {
      try {
        const r = await generateAppReference(invoiceId);
        setRefs((prev) => [r as unknown as Ref, ...prev]);
      } catch (e) { handleError(e); }
    });
  }

  function refresh(id: string) {
    setError("");
    startTransition(async () => {
      try {
        const r = await refreshReferenceStatus(id);
        setRefs((prev) => prev.map((x) => x.id === id ? r as unknown as Ref : x));
      } catch (e) { handleError(e); }
    });
  }

  function cancel(id: string) {
    setError("");
    startTransition(async () => {
      try {
        await cancelPaymentReference(id);
        setRefs((prev) => prev.map((x) => x.id === id ? { ...x, status: "CANCELLED" } : x));
      } catch (e) { handleError(e); }
    });
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  if (paidRef) {
    return (
      <Card className="border-green-200 bg-green-50/40">
        <CardContent className="pt-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Pago via PayPay Africa</p>
            <p className="text-xs text-green-600">
              {fmtDate(paidRef.paidAt ?? null)} · Ref: {paidRef.providerRef ?? paidRef.reference ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          Multicaixa Express / PayPay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Active reference */}
        {activeRef && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {activeRef.method === "MCX" ? "Referência Multicaixa" : "PayPay App"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[activeRef.status]}`}>
                {STATUS_LABEL[activeRef.status]}
              </span>
            </div>

            {activeRef.method === "MCX" && activeRef.entity && activeRef.reference && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Entidade</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-2xl font-bold font-mono tracking-widest">{activeRef.entity}</p>
                    <button onClick={() => copy(activeRef.entity!, "entity")} className="text-muted-foreground hover:text-foreground">
                      {copied === "entity" ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Referência</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-2xl font-bold font-mono tracking-widest">{activeRef.reference}</p>
                    <button onClick={() => copy(activeRef.reference!, "reference")} className="text-muted-foreground hover:text-foreground">
                      {copied === "reference" ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground mb-1">Montante</p>
                  <p className="text-xl font-bold font-mono">{fmt(activeRef.amount)} AOA</p>
                </div>
              </div>
            )}

            {activeRef.method === "PAYPAY_APP" && activeRef.payUrl && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Partilhe este link ou QR code com o cliente</p>
                <div className="flex items-center gap-2 p-2 bg-background rounded border font-mono text-xs break-all">
                  {activeRef.payUrl}
                  <button onClick={() => copy(activeRef.payUrl!, "payUrl")} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {copied === "payUrl" ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {activeRef.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expira em: {fmtDate(activeRef.expiresAt)}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => refresh(activeRef.id)} disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span className="ml-2">Verificar pagamento</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancel(activeRef.id)} disabled={pending} className="text-destructive hover:text-destructive">
                <X className="h-3.5 w-3.5 mr-1.5" />Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Generate buttons */}
        {!activeRef && amountDue > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Gere uma referência de pagamento para <span className="font-semibold font-mono">{fmt(amountDue)} AOA</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={genMcx} disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Smartphone className="mr-2 h-3.5 w-3.5" />}
                Referência Multicaixa
              </Button>
              <Button size="sm" variant="outline" onClick={genApp} disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <QrCode className="mr-2 h-3.5 w-3.5" />}
                PayPay App / QR
              </Button>
            </div>
          </div>
        )}

        {/* History */}
        {refs.filter((r) => r.status !== "PENDING").length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Histórico</p>
              {refs.filter((r) => r.status !== "PENDING").map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{r.method === "MCX" ? `${r.entity} / ${r.reference}` : "PayPay App"}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{fmt(r.amount)} AOA</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

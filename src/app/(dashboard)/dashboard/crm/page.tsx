import Link from "next/link";
import { getLeads, getPipelineSummary } from "@/lib/actions/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";
import { CrmKanbanBoard } from "@/components/crm/crm-kanban-board";

type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

const statusConfig: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  NEW:       { label: "Novo",        variant: "outline" },
  CONTACTED: { label: "Contactado",  variant: "secondary" },
  QUALIFIED: { label: "Qualificado", variant: "default" },
  PROPOSAL:  { label: "Proposta",    variant: "default" },
  WON:       { label: "Ganho",       variant: "secondary" },
  LOST:      { label: "Perdido",     variant: "destructive" },
};

const statusLabel: Record<LeadStatus, string> = {
  NEW: "Novo", CONTACTED: "Contactado", QUALIFIED: "Qualificado",
  PROPOSAL: "Proposta", WON: "Ganho", LOST: "Perdido",
};

const sourceLabel: Record<LeadSource, string> = {
  FACEBOOK: "Facebook", INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok", YOUTUBE: "YouTube", WHATSAPP: "WhatsApp",
  WEBSITE: "Website", REFERRAL: "Referral", MANUAL: "Manual", OTHER: "Other",
};

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 });
}

interface Props { searchParams: Promise<{ view?: string }> }

export default async function CrmPage({ searchParams }: Props) {
  const { view = "kanban" } = await searchParams;
  const currentView = (view as ViewMode) || "kanban";

  const [leads, pipeline] = await Promise.all([
    getLeads(),
    getPipelineSummary(),
  ]);

  const activeLeads = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const wonCount = leads.filter((l) => l.status === "WON").length;

  // Pivot: by status
  const pivotRows: PivotRow[] = (["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as LeadStatus[]).map((s) => {
    const group = leads.filter((l) => l.status === s);
    return {
      group: statusLabel[s],
      count: group.length,
      total: group.reduce((sum, l) => sum + (l.expectedValue ?? 0), 0),
    };
  }).filter((r) => r.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CRM Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            {activeLeads.length} leads activos · {wonCount} ganhos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild size="sm">
            <Link href="/dashboard/crm/leads/new">
              <Plus className="h-4 w-4 mr-2" />Novo Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pipeline.map((s) => (
          <Card key={s.status}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{statusLabel[s.status as LeadStatus]}</p>
              <p className="text-2xl font-bold mt-1">{s.count}</p>
              {s.value > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{fmt(s.value)} AOA</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-medium">Sem leads ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione o seu primeiro lead para começar.</p>
        </div>
      ) : (
        <>
          {currentView === "kanban" && <CrmKanbanBoard leads={leads} />}

          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Valor Previsto</TableHead>
                    <TableHead>Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="p-0">
                        <Link
                          href={`/dashboard/crm/leads/${lead.id}`}
                          className="flex flex-col px-4 py-2.5 hover:underline"
                        >
                          <span className="font-medium">{lead.name}</span>
                          {lead.email && (
                            <span className="text-xs text-muted-foreground">{lead.email}</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.company ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {sourceLabel[lead.source as LeadSource]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[lead.status as LeadStatus].variant}>
                          {statusConfig[lead.status as LeadStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {lead.expectedValue ? `${fmt(lead.expectedValue)} AOA` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("pt-AO")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {currentView === "pivot" && (
            <PivotTable rows={pivotRows} groupLabel="Estado" showTotal />
          )}
        </>
      )}
    </div>
  );
}

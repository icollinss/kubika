import Link from "next/link";
import { getLeads } from "@/lib/actions/crm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

const statusConfig: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; accent: string; tagColor: string }> = {
  NEW:       { label: "Novo",       variant: "outline",     accent: "border-l-blue-400",   tagColor: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "Contactado", variant: "secondary",   accent: "border-l-yellow-400", tagColor: "bg-yellow-100 text-yellow-700" },
  QUALIFIED: { label: "Qualificado",variant: "default",     accent: "border-l-purple-500", tagColor: "bg-purple-100 text-purple-700" },
  PROPOSAL:  { label: "Proposta",   variant: "default",     accent: "border-l-orange-500", tagColor: "bg-orange-100 text-orange-700" },
  WON:       { label: "Ganho",      variant: "secondary",   accent: "border-l-green-500",  tagColor: "bg-green-100 text-green-700" },
  LOST:      { label: "Perdido",    variant: "destructive", accent: "border-l-red-400",    tagColor: "bg-red-100 text-red-500" },
};

const sourceLabel: Record<LeadSource, string> = {
  FACEBOOK: "Facebook", INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok", YOUTUBE: "YouTube", WHATSAPP: "WhatsApp",
  WEBSITE: "Website", REFERRAL: "Referral", MANUAL: "Manual", OTHER: "Other",
};

const STAGE_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

function fmt(n: number) { return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 }); }

interface Props { searchParams: Promise<{ view?: string }> }

export default async function LeadsListPage({ searchParams }: Props) {
  const { view = "list" } = await searchParams;
  const leads = await getLeads();
  const currentView = (view as ViewMode) || "list";

  // ── Kanban ────────────────────────────────────────────────────────────────
  const kanbanColumns: KanbanColumn[] = STAGE_ORDER.map((s) => ({
    id: s, label: statusConfig[s].label, accent: statusConfig[s].accent,
    count: 0, total: 0, cards: [],
  }));
  for (const l of leads) {
    const col = kanbanColumns.find((k) => k.id === l.status);
    if (!col) continue;
    col.count++;
    col.total = (col.total ?? 0) + (l.expectedValue ?? 0);
    col.cards.push({
      id: l.id, href: `/dashboard/crm/leads/${l.id}`,
      title: l.name,
      subtitle: l.company ?? l.email ?? undefined,
      tag: sourceLabel[l.source as LeadSource],
      tagColor: "bg-muted text-muted-foreground",
      value: l.expectedValue ?? undefined,
      initials: l.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
    });
  }

  // ── Pivot: by source ──────────────────────────────────────────────────────
  const sourceMap = new Map<string, { count: number; total: number }>();
  for (const l of leads) {
    const key = sourceLabel[l.source as LeadSource] ?? l.source;
    const cur = sourceMap.get(key) ?? { count: 0, total: 0 };
    sourceMap.set(key, { count: cur.count + 1, total: cur.total + (l.expectedValue ?? 0) });
  }
  const pivotRows: PivotRow[] = Array.from(sourceMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([group, { count, total }]) => ({ group, count, total }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Todos os Leads</h2>
          <p className="text-sm text-muted-foreground">{leads.length} leads no total</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild size="sm">
            <Link href="/dashboard/crm/leads/new"><Plus className="h-4 w-4 mr-2" />Novo Lead</Link>
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-medium">Sem leads ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione o seu primeiro lead para começar.</p>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead><TableHead>Empresa</TableHead>
                    <TableHead>Fonte</TableHead><TableHead>Estado</TableHead>
                    <TableHead className="text-right">Valor Previsto</TableHead>
                    <TableHead>Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="p-0">
                        <Link href={`/dashboard/crm/leads/${lead.id}`} className="flex flex-col px-4 py-2.5 hover:underline">
                          <span className="font-medium">{lead.name}</span>
                          {lead.email && <span className="text-xs text-muted-foreground">{lead.email}</span>}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.company ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{sourceLabel[lead.source as LeadSource]}</Badge></TableCell>
                      <TableCell><Badge variant={statusConfig[lead.status as LeadStatus].variant}>{statusConfig[lead.status as LeadStatus].label}</Badge></TableCell>
                      <TableCell className="text-right text-sm">{lead.expectedValue ? `${fmt(lead.expectedValue)} AOA` : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString("pt-AO")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Fonte" showTotal />}
        </>
      )}
    </div>
  );
}

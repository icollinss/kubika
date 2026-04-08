import Link from "next/link";
import { getLeads, getPipelineSummary } from "@/lib/actions/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

const statusColors: Record<LeadStatus, string> = {
  NEW:       "bg-blue-50 border-blue-200 dark:bg-blue-950/30",
  CONTACTED: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30",
  QUALIFIED: "bg-purple-50 border-purple-200 dark:bg-purple-950/30",
  PROPOSAL:  "bg-orange-50 border-orange-200 dark:bg-orange-950/30",
  WON:       "bg-green-50 border-green-200 dark:bg-green-950/30",
  LOST:      "bg-red-50 border-red-200 dark:bg-red-950/30",
};

const statusLabel: Record<LeadStatus, string> = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  PROPOSAL: "Proposal", WON: "Won", LOST: "Lost",
};

const sourceBadge: Partial<Record<LeadSource, { label: string; color: string }>> = {
  FACEBOOK:  { label: "Facebook",  color: "bg-blue-600 text-white" },
  INSTAGRAM: { label: "Instagram", color: "bg-pink-500 text-white" },
  LINKEDIN:  { label: "LinkedIn",  color: "bg-sky-700 text-white" },
  TIKTOK:    { label: "TikTok",    color: "bg-black text-white" },
  YOUTUBE:   { label: "YouTube",   color: "bg-red-600 text-white" },
  WHATSAPP:  { label: "WhatsApp",  color: "bg-green-600 text-white" },
  WEBSITE:   { label: "Website",   color: "bg-slate-600 text-white" },
  REFERRAL:  { label: "Referral",  color: "bg-violet-600 text-white" },
  MANUAL:    { label: "Manual",    color: "bg-gray-500 text-white" },
};

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 });
}

const PIPELINE_STAGES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"];

export default async function CrmPage() {
  const [leads, pipeline] = await Promise.all([
    getLeads({ status: undefined }),
    getPipelineSummary(),
  ]);

  const activeLeads = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const wonCount = leads.filter((l) => l.status === "WON").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CRM Pipeline</h2>
          <p className="text-sm text-muted-foreground">{activeLeads.length} active leads · {wonCount} won</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/crm/leads">All Leads</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/crm/leads/new"><Plus className="h-4 w-4 mr-2" />Add Lead</Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pipeline.map((s) => (
          <Card key={s.status}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{statusLabel[s.status as LeadStatus]}</p>
              <p className="text-2xl font-bold mt-1">{s.count}</p>
              {s.value > 0 && <p className="text-xs text-muted-foreground mt-0.5">{fmt(s.value)} AOA</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage);
          return (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {statusLabel[stage]} ({stageLeads.length})
                </span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {stageLeads.map((lead) => {
                  const src = sourceBadge[lead.source];
                  return (
                    <Link key={lead.id} href={`/dashboard/crm/leads/${lead.id}`}>
                      <Card className={`cursor-pointer hover:shadow-md transition-shadow border ${statusColors[stage]} mb-2`}>
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-sm font-semibold leading-tight">{lead.name}</p>
                          {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                          <div className="flex items-center justify-between">
                            {src && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${src.color}`}>
                                {src.label}
                              </span>
                            )}
                            {lead.expectedValue && (
                              <span className="text-xs font-medium text-muted-foreground">
                                {fmt(lead.expectedValue)} AOA
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
                {stageLeads.length === 0 && (
                  <div className="h-16 rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

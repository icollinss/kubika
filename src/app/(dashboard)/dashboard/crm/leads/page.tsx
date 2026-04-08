import Link from "next/link";
import { getLeads } from "@/lib/actions/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

const statusVariant: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "outline", CONTACTED: "secondary", QUALIFIED: "default",
  PROPOSAL: "default", WON: "secondary", LOST: "destructive",
};

const sourceLabel: Record<LeadSource, string> = {
  FACEBOOK: "Facebook", INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok", YOUTUBE: "YouTube", WHATSAPP: "WhatsApp",
  WEBSITE: "Website", REFERRAL: "Referral", MANUAL: "Manual", OTHER: "Other",
};

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 });
}

export default async function LeadsListPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Leads</h2>
          <p className="text-sm text-muted-foreground">{leads.length} leads total</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/crm/leads/new"><Plus className="h-4 w-4 mr-2" />Add Lead</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No leads yet. Add your first lead.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Expected Value</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/dashboard/crm/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.company ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{sourceLabel[lead.source]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

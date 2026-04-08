import { notFound } from "next/navigation";
import Link from "next/link";
import { getLead } from "@/lib/actions/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MessageCircle, Building2, Briefcase } from "lucide-react";
type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
import { LeadDetailClient } from "./lead-detail-client";

interface Props { params: Promise<{ id: string }> }

const statusVariant: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "outline", CONTACTED: "secondary", QUALIFIED: "default",
  PROPOSAL: "default", WON: "secondary", LOST: "destructive",
};

const sourceLabel: Record<LeadSource, string> = {
  FACEBOOK: "Facebook", INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok", YOUTUBE: "YouTube", WHATSAPP: "WhatsApp",
  WEBSITE: "Website", REFERRAL: "Referral", MANUAL: "Manual", OTHER: "Other",
};

const PIPELINE: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 });
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/crm"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">{lead.name}</h2>
            <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
            <Badge variant="outline" className="text-xs">{sourceLabel[lead.source]}</Badge>
          </div>
          {lead.company && <p className="text-sm text-muted-foreground">{lead.jobTitle ? `${lead.jobTitle} at ` : ""}{lead.company}</p>}
        </div>
      </div>

      {/* Pipeline progress bar */}
      <div className="flex items-center gap-1">
        {PIPELINE.filter((s) => s !== "LOST").map((stage) => (
          <div
            key={stage}
            className={`flex-1 h-1.5 rounded-full ${
              PIPELINE.indexOf(lead.status) >= PIPELINE.indexOf(stage) && lead.status !== "LOST"
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: contact info + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                  <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">
                    {lead.whatsapp}
                  </a>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.jobTitle && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{lead.jobTitle}</span>
                </div>
              )}
              {lead.expectedValue && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Expected Value</p>
                  <p className="font-bold text-base">{fmt(lead.expectedValue)} AOA</p>
                </div>
              )}
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {lead.convertedToId && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-green-700 font-medium">Converted to Customer</p>
                <Link href={`/dashboard/contacts/${lead.convertedToId}`} className="text-sm text-green-800 hover:underline font-semibold">
                  View Contact →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: activities + status actions */}
        <div className="lg:col-span-2">
          <LeadDetailClient lead={lead} />
        </div>
      </div>
    </div>
  );
}

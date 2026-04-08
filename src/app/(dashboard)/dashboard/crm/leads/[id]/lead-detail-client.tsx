"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Phone, Mail, MessageCircle, Users, CheckCircle, XCircle } from "lucide-react";
import { addLeadActivity, updateLeadStatus, convertLead } from "@/lib/actions/crm";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

const ACTIVITY_TYPES = [
  { value: "NOTE",     label: "Note",     icon: MessageSquare },
  { value: "CALL",     label: "Call",     icon: Phone },
  { value: "EMAIL",    label: "Email",    icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "MEETING",  label: "Meeting",  icon: Users },
];

const STATUS_FLOW: { status: LeadStatus; label: string }[] = [
  { status: "NEW",       label: "New" },
  { status: "CONTACTED", label: "Mark Contacted" },
  { status: "QUALIFIED", label: "Qualify" },
  { status: "PROPOSAL",  label: "Send Proposal" },
];

type Lead = {
  id: string;
  status: LeadStatus;
  convertedToId: string | null;
  activities: { id: string; type: string; body: string; createdAt: Date }[];
};

export function LeadDetailClient({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [actType, setActType] = useState("NOTE");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  async function handleActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await addLeadActivity(lead.id, actType, body.trim());
      setBody("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(status: LeadStatus) {
    await updateLeadStatus(lead.id, status);
    router.refresh();
  }

  async function handleConvert() {
    if (!confirm("Convert this lead to a customer contact?")) return;
    setConverting(true);
    try {
      await convertLead(lead.id);
      router.refresh();
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status actions */}
      {lead.status !== "WON" && lead.status !== "LOST" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Move Stage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => (
              <Button
                key={s.status}
                size="sm"
                variant={s.status === lead.status ? "default" : "outline"}
                onClick={() => handleStatus(s.status)}
                disabled={s.status === lead.status}
              >
                {s.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="text-green-700 border-green-400" onClick={() => handleStatus("WON")}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />Won
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleStatus("LOST")}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />Lost
            </Button>
            {!lead.convertedToId && (
              <Button size="sm" onClick={handleConvert} disabled={converting} className="ml-auto">
                {converting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Convert to Customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Log activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Log Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivity} className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {ACTIVITY_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActType(value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    actType === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3 w-3" />{label}
                </button>
              ))}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Add a ${actType.toLowerCase()} note...`}
              rows={2}
            />
            <Button type="submit" size="sm" disabled={saving || !body.trim()}>
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Log
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activity feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Activity ({lead.activities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
          ) : (
            <div className="space-y-3">
              {lead.activities.map((act) => {
                const t = ACTIVITY_TYPES.find((a) => a.value === act.type);
                const Icon = t?.icon ?? MessageSquare;
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{t?.label ?? act.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(act.createdAt).toLocaleString("pt-AO")}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 whitespace-pre-wrap">{act.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { createLead } from "@/lib/actions/crm";

type LeadSource = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "WHATSAPP" | "WEBSITE" | "REFERRAL" | "MANUAL" | "OTHER";

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: "FACEBOOK",  label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN",  label: "LinkedIn" },
  { value: "TIKTOK",    label: "TikTok" },
  { value: "YOUTUBE",   label: "YouTube" },
  { value: "WHATSAPP",  label: "WhatsApp" },
  { value: "WEBSITE",   label: "Website" },
  { value: "REFERRAL",  label: "Referral" },
  { value: "MANUAL",    label: "Manual / Walk-in" },
  { value: "OTHER",     label: "Other" },
];

export function LeadForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", whatsapp: "",
    company: "", jobTitle: "", source: "MANUAL" as LeadSource,
    expectedValue: "", notes: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const lead = await createLead({
        name: form.name.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        company: form.company || undefined,
        jobTitle: form.jobTitle || undefined,
        source: form.source,
        expectedValue: form.expectedValue ? parseFloat(form.expectedValue) : undefined,
        notes: form.notes || undefined,
      });
      router.push(`/dashboard/crm/leads/${lead.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Contact person name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+244 912 345 678" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+244 912 345 678" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="e.g. CEO, Procurement Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Source *</Label>
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Expected Value (AOA)</Label>
              <Input
                type="number" min="0" step="1000"
                value={form.expectedValue}
                onChange={(e) => set("expectedValue", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Any relevant notes..." />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings } from "lucide-react";
import { updateCreditSettings } from "@/lib/actions/statements";

interface Props {
  contactId: string;
  creditLimit: number;
  creditTermsDays: number;
}

export function CreditSettingsForm({ contactId, creditLimit, creditTermsDays }: Props) {
  const router = useRouter();
  const [limit, setLimit] = useState(String(creditLimit));
  const [terms, setTerms] = useState(String(creditTermsDays));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCreditSettings(contactId, {
        creditLimit: parseFloat(limit) || 0,
        creditTermsDays: parseInt(terms) || 30,
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Settings className="h-3.5 w-3.5" />Credit Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Credit Limit (AOA)</Label>
          <Input
            type="number"
            min="0"
            step="1000"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0 = no limit"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Payment Terms (days)</Label>
          <Input
            type="number"
            min="0"
            max="365"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

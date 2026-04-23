"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface Props {
  action: (note: string) => Promise<void>;
}

export function ContactNoteForm({ action }: Props) {
  const { t } = useLanguage();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await action(note.trim());
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.contacts.addNotePlaceholder}
        rows={3}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving || !note.trim()}>
          {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
          {t.contacts.addNote}
        </Button>
      </div>
    </form>
  );
}

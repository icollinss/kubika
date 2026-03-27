"use client";

import { useState } from "react";
import { postJournalEntry } from "@/lib/actions/accounting";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function PostEntryButton({ entryId }: { entryId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePost() {
    setLoading(true);
    await postJournalEntry(entryId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button onClick={handlePost} disabled={loading} variant="default" size="sm">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
      Post Entry
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { updateServiceOrderStatus } from "@/lib/actions/field-service";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  currentStatus: string;
}

const transitions: Record<string, { label: string; next: string; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]> = {
  DRAFT: [
    { label: "Schedule", next: "SCHEDULED", icon: CalendarClock, variant: "outline" },
    { label: "Cancel", next: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  SCHEDULED: [
    { label: "Start Work", next: "IN_PROGRESS", icon: PlayCircle, variant: "default" },
    { label: "Cancel", next: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  IN_PROGRESS: [
    { label: "Mark Complete", next: "COMPLETED", icon: CheckCircle2, variant: "default" },
    { label: "Cancel", next: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function StatusButtons({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const buttons = transitions[currentStatus] ?? [];
  if (buttons.length === 0) return null;

  async function handleTransition(next: string) {
    setLoading(next);
    try {
      await updateServiceOrderStatus(orderId, next);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map((b) => (
        <Button
          key={b.next}
          variant={b.variant}
          size="sm"
          disabled={loading !== null}
          onClick={() => handleTransition(b.next)}
        >
          {loading === b.next ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <b.icon className="h-4 w-4 mr-2" />}
          {b.label}
        </Button>
      ))}
    </div>
  );
}

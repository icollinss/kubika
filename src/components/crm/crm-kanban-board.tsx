"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { updateLeadStatus } from "@/lib/actions/crm";

export interface CrmLead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  source: string;
  status: string;
  expectedValue: number | null;
}

interface ColumnConfig {
  id: string;
  label: string;
  accent: string;
  headerColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: "NEW",       label: "Novo",        accent: "border-l-blue-400",   headerColor: "text-blue-600" },
  { id: "CONTACTED", label: "Contactado",  accent: "border-l-yellow-400", headerColor: "text-yellow-600" },
  { id: "QUALIFIED", label: "Qualificado", accent: "border-l-purple-500", headerColor: "text-purple-600" },
  { id: "PROPOSAL",  label: "Proposta",    accent: "border-l-orange-500", headerColor: "text-orange-600" },
  { id: "WON",       label: "Ganho",       accent: "border-l-green-500",  headerColor: "text-green-600" },
  { id: "LOST",      label: "Perdido",     accent: "border-l-red-400",    headerColor: "text-red-500" },
];

const SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook", INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok", YOUTUBE: "YouTube", WHATSAPP: "WhatsApp",
  WEBSITE: "Website", REFERRAL: "Referral", MANUAL: "Manual", OTHER: "Other",
};

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Single card (used both in column and in drag overlay) ─────────────────────
function LeadCard({
  lead,
  accent,
  isDragging = false,
}: {
  lead: CrmLead;
  accent: string;
  isDragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm border-l-4 select-none",
        accent,
        isDragging ? "opacity-50" : "hover:shadow-md transition-shadow"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
          {getInitials(lead.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{lead.name}</p>
          {(lead.company || lead.email) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {lead.company ?? lead.email}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
              {SOURCE_LABELS[lead.source] ?? lead.source}
            </span>
            {lead.expectedValue != null && (
              <span className="text-xs font-mono font-semibold ml-auto">
                {fmt(lead.expectedValue)} AOA
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Draggable card wrapper ────────────────────────────────────────────────────
function DraggableCard({ lead, accent }: { lead: CrmLead; accent: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead, accent },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <Link
        href={`/dashboard/crm/leads/${lead.id}`}
        onClick={(e) => {
          // Prevent navigation if this was a drag gesture
          if (isDragging) e.preventDefault();
        }}
      >
        <LeadCard lead={lead} accent={accent} isDragging={isDragging} />
      </Link>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────────────────────
function DroppableColumn({
  config,
  leads,
  isOver,
}: {
  config: ColumnConfig;
  leads: CrmLead[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: config.id });
  const total = leads.reduce((s, l) => s + (l.expectedValue ?? 0), 0);

  return (
    <div className="flex-shrink-0 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", config.headerColor)}>{config.label}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {leads.length}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs font-mono text-muted-foreground">{fmt(total)} AOA</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-24 rounded-lg p-1 transition-colors",
          isOver && "bg-muted/50 ring-2 ring-inset ring-primary/20"
        )}
      >
        {leads.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Arrastar aqui
          </div>
        )}
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} accent={config.accent} />
        ))}
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
export function CrmKanbanBoard({ leads: initialLeads }: { leads: CrmLead[] }) {
  const [leads, setLeads] = useState<CrmLead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;
  const activeColumn = activeLead ? COLUMNS.find((c) => c.id === activeLead.status) : null;

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setOverId((over?.id as string) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveId(null);
      setOverId(null);

      if (!over) return;
      const leadId = active.id as string;
      const newStatus = over.id as string;

      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.status === newStatus) return;

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );

      try {
        await updateLeadStatus(leadId, newStatus as Parameters<typeof updateLeadStatus>[1]);
      } catch {
        // Revert on error
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
        );
      }
    },
    [leads]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            config={col}
            leads={leads.filter((l) => l.status === col.id)}
            isOver={overId === col.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead && activeColumn ? (
          <div className="rotate-2 opacity-95 shadow-xl w-72">
            <LeadCard lead={activeLead} accent={activeColumn.accent} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

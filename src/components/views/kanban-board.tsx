import Link from "next/link";
import { cn } from "@/lib/utils";

export interface KanbanCard {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  tag?: string;
  tagColor?: string;
  value?: number;
  meta?: string;
  initials?: string;
}

export interface KanbanColumn {
  id: string;
  label: string;
  accent: string;   // tailwind border-l color e.g. "border-l-blue-500"
  count: number;
  total?: number;
  cards: KanbanCard[];
}

function fmt(n: number) {
  return n.toLocaleString("pt-AO", { minimumFractionDigits: 0 });
}

export function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.id} className="flex-shrink-0 w-72">
          {/* Column header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {col.count}
              </span>
            </div>
            {col.total !== undefined && (
              <span className="text-xs font-mono text-muted-foreground">
                {fmt(col.total)} AOA
              </span>
            )}
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {col.cards.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Sem registos
              </div>
            )}
            {col.cards.map((card) => (
              <Link key={card.id} href={card.href}>
                <div className={cn(
                  "rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4",
                  col.accent
                )}>
                  <div className="flex items-start gap-2.5">
                    {card.initials && (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                        {card.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{card.title}</p>
                      {card.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{card.subtitle}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {card.tag && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", card.tagColor ?? "bg-muted text-muted-foreground")}>
                            {card.tag}
                          </span>
                        )}
                        {card.value !== undefined && (
                          <span className="text-xs font-mono font-semibold ml-auto">
                            {fmt(card.value)} AOA
                          </span>
                        )}
                        {card.meta && !card.value && (
                          <span className="text-[10px] text-muted-foreground ml-auto">{card.meta}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

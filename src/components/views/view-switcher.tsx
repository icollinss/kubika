"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { List, LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "kanban" | "pivot";

const VIEWS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: "list",   icon: List,        label: "Lista" },
  { mode: "kanban", icon: LayoutGrid,  label: "Kanban" },
  { mode: "pivot",  icon: Table2,      label: "Pivot" },
];

export function ViewSwitcher({ current }: { current: ViewMode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useSearchParams();

  function switchView(mode: ViewMode) {
    const next = new URLSearchParams(params.toString());
    if (mode === "list") next.delete("view");
    else next.set("view", mode);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
      {VIEWS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          title={label}
          onClick={() => switchView(mode)}
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded transition-colors",
            current === mode
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

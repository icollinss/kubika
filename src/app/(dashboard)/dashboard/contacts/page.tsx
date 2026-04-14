import Link from "next/link";
import { getContacts } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { ContactsFilter } from "./contacts-filter";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  CUSTOMER: { label: "Cliente",    variant: "default" },
  SUPPLIER: { label: "Fornecedor", variant: "secondary" },
  BOTH:     { label: "Ambos",      variant: "outline" },
};

const typeAccent: Record<string, string> = {
  CUSTOMER: "border-l-blue-500",
  SUPPLIER: "border-l-purple-500",
  BOTH:     "border-l-emerald-500",
};

interface Props {
  searchParams: Promise<{ search?: string; type?: string; view?: string }>;
}

export default async function ContactsPage({ searchParams }: Props) {
  const { search, type, view = "list" } = await searchParams;
  const contacts = await getContacts(search, type);
  const currentView = (view as ViewMode) || "list";

  // ── Kanban ────────────────────────────────────────────────────────────────
  const kanbanColumns: KanbanColumn[] = [
    { id: "CUSTOMER", label: "Clientes",     accent: "border-l-blue-500",    count: 0, cards: [] },
    { id: "SUPPLIER", label: "Fornecedores", accent: "border-l-purple-500",  count: 0, cards: [] },
    { id: "BOTH",     label: "Ambos",        accent: "border-l-emerald-500", count: 0, cards: [] },
  ];
  for (const c of contacts) {
    const col = kanbanColumns.find((k) => k.id === c.type);
    if (!col) continue;
    col.count++;
    col.cards.push({
      id:       c.id,
      href:     `/dashboard/contacts/${c.id}`,
      title:    c.name,
      subtitle: c.email ?? c.phone ?? c.city ?? undefined,
      tag:      c.city ?? undefined,
      initials: c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    });
  }

  // ── Pivot: by city ────────────────────────────────────────────────────────
  const cityMap = new Map<string, number>();
  for (const c of contacts) {
    const key = c.city ?? "Sem cidade";
    cityMap.set(key, (cityMap.get(key) ?? 0) + 1);
  }
  const pivotRows: PivotRow[] = Array.from(cityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({ group, count }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contactos</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {contacts.length} contacto{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild>
            <Link href="/dashboard/contacts/new">
              <Plus className="h-4 w-4 mr-2" />Novo Contacto
            </Link>
          </Button>
        </div>
      </div>

      <ContactsFilter />

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sem contactos ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione o seu primeiro cliente ou fornecedor.</p>
        </div>
      ) : (
        <>
          {/* ── LIST ── */}
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => {
                    const badge = typeBadge[contact.type];
                    return (
                      <TableRow key={contact.id} className="cursor-pointer">
                        <TableCell className="font-medium p-0">
                          <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full hover:underline">
                            {contact.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/contacts/${contact.id}`} className="block py-1">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground p-0">
                          <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full">{contact.email ?? "—"}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground p-0">
                          <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full">{contact.phone ?? "—"}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground p-0">
                          <Link href={`/dashboard/contacts/${contact.id}`} className="flex items-center px-4 py-3 w-full">{contact.city ?? "—"}</Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ── KANBAN ── */}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}

          {/* ── PIVOT ── */}
          {currentView === "pivot" && (
            <PivotTable rows={pivotRows} groupLabel="Cidade" showTotal={false} />
          )}
        </>
      )}
    </div>
  );
}

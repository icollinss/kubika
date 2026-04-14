import Link from "next/link";
import { getProducts, getCategories } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { ProductsFilter } from "./products-filter";
import { ViewSwitcher, type ViewMode } from "@/components/views/view-switcher";
import { KanbanBoard, type KanbanColumn } from "@/components/views/kanban-board";
import { PivotTable, type PivotRow } from "@/components/views/pivot-table";

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline"; accent: string }> = {
  STORABLE:   { label: "Armazém",    variant: "default",   accent: "border-l-blue-500" },
  CONSUMABLE: { label: "Consumível", variant: "secondary", accent: "border-l-amber-500" },
  SERVICE:    { label: "Serviço",    variant: "outline",   accent: "border-l-purple-500" },
};

const trackingBadge: Record<string, string> = {
  NONE: "", LOT: "Lotes", SERIAL: "Série",
};

interface Props {
  searchParams: Promise<{ search?: string; categoryId?: string; type?: string; view?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { search, categoryId, type, view = "list" } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(search, categoryId, type),
    getCategories(),
  ]);
  const currentView = (view as ViewMode) || "list";

  // ── Kanban: by type ───────────────────────────────────────────────────────
  const kanbanColumns: KanbanColumn[] = ["STORABLE", "CONSUMABLE", "SERVICE"].map((t) => ({
    id: t, label: typeBadge[t].label, accent: typeBadge[t].accent,
    count: 0, cards: [],
  }));
  for (const p of products) {
    const col = kanbanColumns.find((k) => k.id === p.productType);
    if (!col) continue;
    col.count++;
    col.cards.push({
      id: p.id, href: `/dashboard/inventory/products/${p.id}`,
      title: p.name,
      subtitle: p.category?.name ?? p.internalRef ?? p.sku ?? undefined,
      tag: trackingBadge[p.trackingType] || undefined,
      value: p.salePrice,
      initials: p.name.substring(0, 2).toUpperCase(),
    });
  }

  // ── Pivot: by category ────────────────────────────────────────────────────
  const catMap = new Map<string, { count: number; total: number }>();
  for (const p of products) {
    const key = p.category?.name ?? "Sem categoria";
    const cur = catMap.get(key) ?? { count: 0, total: 0 };
    catMap.set(key, { count: cur.count + 1, total: cur.total + p.salePrice });
  }
  const pivotRows: PivotRow[] = Array.from(catMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([group, { count, total }]) => ({ group, count, total }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground text-sm mt-1">{products.length} produto{products.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher current={currentView} />
          <Button asChild>
            <Link href="/dashboard/inventory/products/new"><Plus className="h-4 w-4 mr-2" />Novo Produto</Link>
          </Button>
        </div>
      </div>

      <ProductsFilter categories={categories} />

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Sem produtos ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione o seu primeiro produto para começar o inventário.</p>
        </div>
      ) : (
        <>
          {currentView === "list" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead><TableHead>Ref / SKU</TableHead>
                    <TableHead>Categoria</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Rastreio</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const badge = typeBadge[product.productType];
                    const tracking = trackingBadge[product.trackingType];
                    return (
                      <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="p-0">
                          <Link href={`/dashboard/inventory/products/${product.id}`} className="flex items-center px-4 py-3 font-medium hover:underline">{product.name}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{product.internalRef ?? product.sku ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{product.category?.name ?? "—"}</TableCell>
                        <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                        <TableCell>{tracking ? <Badge variant="outline">{tracking}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                        <TableCell className="text-right font-medium">{product.salePrice.toLocaleString("pt-AO")} AOA</TableCell>
                        <TableCell className="text-right text-muted-foreground">{product.costPrice.toLocaleString("pt-AO")} AOA</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {currentView === "kanban" && <KanbanBoard columns={kanbanColumns} />}
          {currentView === "pivot" && <PivotTable rows={pivotRows} groupLabel="Categoria" showTotal extraColumns={[{ key: "avgPrice", label: "Preço Médio (AOA)", format: "currency" }]} />}
        </>
      )}
    </div>
  );
}

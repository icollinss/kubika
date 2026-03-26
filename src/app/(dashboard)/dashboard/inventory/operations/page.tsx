import Link from "next/link";
import { getOperations } from "@/lib/actions/stock-operations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ClipboardList, RotateCcw, Trash2, Plus } from "lucide-react";
import { OperationsFilter } from "./operations-filter";

const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  RECEIPT:    { label: "Receipt",    variant: "default",     icon: ArrowDownToLine },
  DELIVERY:   { label: "Delivery",   variant: "secondary",   icon: ArrowUpFromLine },
  INTERNAL:   { label: "Transfer",   variant: "outline",     icon: ArrowLeftRight },
  ADJUSTMENT: { label: "Adjustment", variant: "outline",     icon: ClipboardList },
  RETURN:     { label: "Return",     variant: "secondary",   icon: RotateCcw },
  SCRAP:      { label: "Scrap",      variant: "destructive", icon: Trash2 },
};

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function OperationsPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const operations = await getOperations(type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Operations</h2>
          <p className="text-muted-foreground text-sm mt-1">{operations.length} operation{operations.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory/operations/new?type=ADJUSTMENT">
              <ClipboardList className="h-4 w-4 mr-2" />Adjustment
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory/operations/new?type=INTERNAL">
              <ArrowLeftRight className="h-4 w-4 mr-2" />Transfer
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory/operations/new?type=DELIVERY">
              <ArrowUpFromLine className="h-4 w-4 mr-2" />Delivery
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/inventory/operations/new?type=RECEIPT">
              <ArrowDownToLine className="h-4 w-4 mr-2" />Receipt
            </Link>
          </Button>
        </div>
      </div>

      <OperationsFilter />

      {operations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No operations yet</p>
          <p className="text-sm text-muted-foreground mt-1">Record a receipt, delivery, or adjustment to start tracking stock movements.</p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Lot / Serial</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => {
                const cfg = typeConfig[op.moveType];
                const Icon = cfg.icon;
                return (
                  <TableRow key={op.id}>
                    <TableCell className="text-sm">{new Date(op.movedAt).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <Icon className="h-3 w-3" />{cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {op.product.name}
                      {op.product.internalRef && <span className="text-muted-foreground text-xs ml-1">[{op.product.internalRef}]</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{op.fromLocation?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{op.toLocation?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {op.lot?.lotNumber ?? op.serial?.serial ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{op.reference ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{op.quantity}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

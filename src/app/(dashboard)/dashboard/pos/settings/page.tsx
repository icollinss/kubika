import { getPosConfigs } from "@/lib/actions/pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Store } from "lucide-react";
import Link from "next/link";
import { ConfigForm } from "./config-form";
import { ConfigActions } from "./config-actions";

export default async function PosSettingsPage() {
  const configs = await getPosConfigs();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/pos"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">POS Terminals</h2>
      </div>

      {/* Existing configs */}
      {configs.length > 0 && (
        <div className="space-y-3">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{config.name}</p>
                        {!config.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description || `Tax: ${config.defaultTaxRate}% · Discounts: ${config.allowDiscount ? "on" : "off"} · ${config._count.sessions} sessions`}
                      </p>
                    </div>
                  </div>
                  <ConfigActions config={{ id: config.id, name: config.name, isActive: config.isActive }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create new config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {configs.length === 0 ? "Create your first POS terminal" : "Add another terminal"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigForm />
        </CardContent>
      </Card>
    </div>
  );
}

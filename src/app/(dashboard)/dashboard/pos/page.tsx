import Link from "next/link";
import { getPosConfigs } from "@/lib/actions/pos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Store, Plus, Settings, CircleDot } from "lucide-react";
import { OpenSessionButton } from "./open-session-button";

export default async function PosPage() {
  const configs = await getPosConfigs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold tracking-tight">Point of Sale</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/pos/settings">
              <Settings className="h-4 w-4 mr-2" />Manage Terminals
            </Link>
          </Button>
        </div>
      </div>

      {configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 border-2 border-dashed rounded-xl">
          <Store className="h-12 w-12 text-muted-foreground opacity-40" />
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold">No POS terminals configured</p>
            <p className="text-sm text-muted-foreground">Create your first terminal to start selling.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/pos/settings">
              <Plus className="h-4 w-4 mr-2" />Create Terminal
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => {
            const openSession = config.sessions[0] ?? null;
            return (
              <Card key={config.id} className={`flex flex-col transition-shadow hover:shadow-md ${!config.isActive ? "opacity-60" : ""}`}>
                <CardContent className="pt-6 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${config.isActive ? "bg-primary/10" : "bg-muted"}`}>
                        <Store className={`h-5 w-5 ${config.isActive ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{config.name}</p>
                        {config.description && (
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        )}
                      </div>
                    </div>
                    {!config.isActive && <Badge variant="outline">Inactive</Badge>}
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Default tax rate</span>
                      <span>{config.defaultTaxRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Total sessions</span>
                      <span>{config._count.sessions}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Discounts</span>
                      <span>{config.allowDiscount ? "Allowed" : "Disabled"}</span>
                    </div>
                  </div>

                  {openSession && (
                    <div className="mt-4 flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <CircleDot className="h-3.5 w-3.5 text-green-600 animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">
                          Session {openSession.number} open
                        </p>
                        <p className="text-xs text-green-600/70">
                          Since {new Date(openSession.openedAt).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-4 gap-2">
                  {config.isActive ? (
                    openSession ? (
                      <Button className="flex-1" asChild>
                        <Link href={`/dashboard/pos/session/${openSession.id}`}>
                          Resume Terminal
                        </Link>
                      </Button>
                    ) : (
                      <OpenSessionButton configId={config.id} configName={config.name} className="flex-1" />
                    )
                  ) : (
                    <Button variant="outline" className="flex-1" disabled>Inactive</Button>
                  )}
                  <Button variant="ghost" size="icon" asChild title="Configure">
                    <Link href={`/dashboard/pos/settings?edit=${config.id}`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {/* Add new tile */}
          <Link
            href="/dashboard/pos/settings"
            className="flex flex-col items-center justify-center min-h-[220px] border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors gap-3"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add Terminal</span>
          </Link>
        </div>
      )}
    </div>
  );
}

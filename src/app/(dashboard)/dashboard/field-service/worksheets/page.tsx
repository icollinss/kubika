import { getWorksheetTemplates } from "@/lib/actions/field-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";
import { TemplateManager } from "./template-manager";

export default async function WorksheetTemplatesPage() {
  const templates = await getWorksheetTemplates();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/field-service"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Worksheet Templates</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Create reusable worksheet templates that technicians fill out on-site. Each template defines the fields the technician must complete.
      </p>

      <TemplateManager templates={templates} />

      {templates.length > 0 && (
        <div className="space-y-3">
          {templates.map((t) => {
            const fields = (t.fields as { id: string; label: string; type: string; required?: boolean }[]) ?? [];
            return (
              <Card key={t.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{t.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{t._count?.orders ?? 0} orders</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {fields.map((f) => (
                      <span key={f.id} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                        <span>{f.label}</span>
                        <span className="text-muted-foreground">({f.type})</span>
                        {f.required && <span className="text-destructive">*</span>}
                      </span>
                    ))}
                    {fields.length === 0 && <span className="text-xs text-muted-foreground">No fields defined</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

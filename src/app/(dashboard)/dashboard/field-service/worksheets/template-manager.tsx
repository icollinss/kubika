"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { createWorksheetTemplate, deleteWorksheetTemplate } from "@/lib/actions/field-service";

type FieldType = "text" | "textarea" | "number" | "checkbox" | "select";

interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string; // comma-separated for select type
}

interface Template { id: string; name: string }
interface Props { templates: Template[] }

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "text",     label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number",   label: "Number" },
  { value: "checkbox", label: "Checkbox (Yes/No)" },
  { value: "select",   label: "Dropdown" },
];

export function TemplateManager({ templates }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function addField() {
    setFields((prev) => [...prev, {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      required: false,
      options: "",
    }]);
  }

  function updateField(id: string, key: keyof FieldDef, value: unknown) {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, [key]: value } : f));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSave() {
    if (!name.trim() || fields.length === 0) return;
    setSaving(true);
    try {
      const payload = fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        ...(f.type === "select" ? { options: f.options.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
      }));
      await createWorksheetTemplate(name.trim(), payload);
      setOpen(false);
      setName("");
      setFields([]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteWorksheetTemplate(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
      <div className="flex gap-2">
        {templates.map((t) => (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deletingId !== null}
            onClick={() => handleDelete(t.id)}
          >
            {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
            Delete {t.name}
          </Button>
        ))}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Worksheet Template</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AC Service Checklist"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Fields</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add Field
                  </Button>
                </div>

                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No fields yet. Click "Add Field" to start.</p>
                )}

                {fields.map((field, idx) => (
                  <div key={field.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground font-mono">Field {idx + 1}</span>
                      <div className="flex-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, "label", e.target.value)}
                          placeholder="e.g. Issue found"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={field.type} onValueChange={(v) => updateField(field.id, "type", v as FieldType)}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((ft) => (
                              <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {field.type === "select" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={field.options}
                          onChange={(e) => updateField(field.id, "options", e.target.value)}
                          placeholder="Pass, Fail, Pending"
                          className="h-8"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`req-${field.id}`}
                        checked={field.required}
                        onChange={(e) => updateField(field.id, "required", e.target.checked)}
                        className="h-3.5 w-3.5"
                      />
                      <label htmlFor={`req-${field.id}`} className="text-xs text-muted-foreground">Required field</label>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                disabled={saving || !name.trim() || fields.length === 0 || fields.some((f) => !f.label.trim())}
                onClick={handleSave}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Eraser, CheckCircle2 } from "lucide-react";
import { saveWorksheetData } from "@/lib/actions/field-service";
import { useRouter } from "next/navigation";

interface WorksheetField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select";
  required?: boolean;
  options?: string[];
}

interface Template {
  id: string;
  name: string;
  fields: unknown;
}

interface Props {
  orderId: string;
  template: Template;
  savedData: Record<string, unknown>;
  savedSignature?: string;
  readOnly?: boolean;
}

function SignatureCanvas({
  value,
  onChange,
  readOnly,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
  readOnly?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height),
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || readOnly) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current!.toDataURL("image/png"));
  }

  function clearSignature() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>
      {!readOnly && (
        <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>
          <Eraser className="h-3.5 w-3.5 mr-1.5" />Clear Signature
        </Button>
      )}
    </div>
  );
}

export function WorksheetForm({ orderId, template, savedData, savedSignature, readOnly }: Props) {
  const router = useRouter();
  const fields = (template.fields as WorksheetField[]) ?? [];
  const [data, setData] = useState<Record<string, unknown>>(savedData);
  const [signature, setSignature] = useState<string>(savedSignature ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField(id: string, value: unknown) {
    setData((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveWorksheetData(orderId, data, signature || undefined);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground">This worksheet has no fields.</p>;
  }

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              value={(data[field.id] as string) ?? ""}
              onChange={(e) => setField(field.id, e.target.value)}
              disabled={readOnly}
            />
          )}

          {field.type === "textarea" && (
            <Textarea
              value={(data[field.id] as string) ?? ""}
              onChange={(e) => setField(field.id, e.target.value)}
              rows={3}
              disabled={readOnly}
            />
          )}

          {field.type === "number" && (
            <Input
              type="number"
              value={(data[field.id] as string) ?? ""}
              onChange={(e) => setField(field.id, e.target.value)}
              disabled={readOnly}
            />
          )}

          {field.type === "checkbox" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.id}
                checked={!!(data[field.id])}
                onCheckedChange={(checked) => setField(field.id, !!checked)}
                disabled={readOnly}
              />
              <label htmlFor={field.id} className="text-sm text-muted-foreground cursor-pointer">
                {field.label}
              </label>
            </div>
          )}

          {field.type === "select" && field.options && (
            <Select
              value={(data[field.id] as string) ?? ""}
              onValueChange={(v) => setField(field.id, v)}
              disabled={readOnly}
            >
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      {/* Signature */}
      <div className="space-y-2">
        <Label>Customer Signature</Label>
        <SignatureCanvas
          value={signature || undefined}
          onChange={setSignature}
          readOnly={readOnly}
        />
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Worksheet
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />Saved
            </span>
          )}
        </div>
      )}

      {readOnly && savedSignature && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Signature captured</p>
          <img src={savedSignature} alt="Customer signature" className="border rounded-lg max-h-32" />
        </div>
      )}
    </div>
  );
}

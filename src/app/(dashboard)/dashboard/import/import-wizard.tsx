"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileSpreadsheet, Users, Package, Target,
  CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft, Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { importContacts, importProducts, importLeads, type ImportRow } from "@/lib/actions/import";

// ─── Template column definitions ─────────────────────────────────────────────

const TEMPLATES = {
  contacts: {
    label: "Contacts",
    icon: Users,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40",
    columns: ["name*", "email", "phone", "whatsapp", "type", "address", "city", "country", "taxId", "notes"],
    sample: [
      { name: "Empresa Angola Lda", email: "info@empresa.ao", phone: "+244912345678", type: "CUSTOMER", city: "Luanda", country: "Angola" },
      { name: "Fornecedor SA", email: "compras@fornecedor.ao", phone: "+244923456789", type: "SUPPLIER", city: "Benguela", country: "Angola" },
    ],
    action: importContacts,
  },
  products: {
    label: "Products",
    icon: Package,
    color: "bg-green-50 text-green-600 dark:bg-green-950/40",
    columns: ["name*", "ref", "description", "type", "salePrice", "costPrice"],
    sample: [
      { name: "Laptop HP 15", ref: "LPT-001", type: "STORABLE", salePrice: "150000", costPrice: "120000" },
      { name: "Consultoria IT", ref: "SRV-001", type: "SERVICE", salePrice: "50000", costPrice: "0" },
    ],
    action: importProducts,
  },
  leads: {
    label: "CRM Leads",
    icon: Target,
    color: "bg-red-50 text-red-600 dark:bg-red-950/40",
    columns: ["name*", "email", "phone", "whatsapp", "company", "jobTitle", "source", "notes"],
    sample: [
      { name: "João Silva", email: "joao@empresa.ao", company: "Empresa Angola", source: "FACEBOOK" },
      { name: "Maria Santos", email: "maria@co.ao", company: "Tech Co", source: "LINKEDIN" },
    ],
    action: importLeads,
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportWizard() {
  const [step, setStep] = useState<"pick" | "upload" | "preview" | "result">("pick");
  const [type, setType] = useState<TemplateKey>("contacts");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null);
  const [parseError, setParseError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate(key: TemplateKey) {
    const tpl = TEMPLATES[key];
    const ws = XLSX.utils.json_to_sheet([...tpl.sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tpl.label);
    XLSX.writeFile(wb, `kubika_${key}_template.xlsx`);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        let parsed: ImportRow[] = [];

        if (file.name.endsWith(".csv")) {
          const text = typeof data === "string" ? data : new TextDecoder().decode(data as ArrayBuffer);
          parsed = parseCSV(text);
        } else {
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          parsed = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
        }

        if (parsed.length === 0) {
          setParseError("No data rows found in file.");
          return;
        }
        setRows(parsed);
        setStep("preview");
      } catch {
        setParseError("Could not parse file. Make sure it's a valid CSV or Excel file.");
      }
    };

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  function parseCSV(text: string): ImportRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: ImportRow = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return row;
    });
  }

  async function handleImport() {
    setLoading(true);
    try {
      const tpl = TEMPLATES[type];
      const res = await (tpl.action as (rows: ImportRow[]) => Promise<typeof result>)(rows);
      setResult(res);
      setStep("result");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("pick");
    setRows([]);
    setResult(null);
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const tpl = TEMPLATES[type];
  const previewRows = rows.slice(0, 5);
  const previewCols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4">
      {/* ── Step 1: Pick type ── */}
      {step === "pick" && (
        <div className="space-y-4">
          <p className="text-sm font-medium">What would you like to import?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(TEMPLATES) as [TemplateKey, typeof TEMPLATES[TemplateKey]][]).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`text-left p-4 rounded-xl border-2 transition-colors space-y-2 ${
                  type === key ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${t.color}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.columns.join(", ")}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => downloadTemplate(type)}>
              <Download className="h-4 w-4 mr-2" />Download {tpl.label} Template
            </Button>
            <Button size="sm" onClick={() => setStep("upload")}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Upload file ── */}
      {step === "upload" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <tpl.icon className="h-4 w-4" />Import {tpl.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-sm">Click to upload CSV or Excel file</p>
              <p className="text-xs text-muted-foreground mt-1">.csv, .xls, .xlsx supported</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {parseError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4 shrink-0" />{parseError}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
              <Upload className="h-3.5 w-3.5 shrink-0" />
              Required columns: <span className="font-mono font-medium">{tpl.columns.filter(c => c.endsWith("*")).join(", ").replace(/\*/g, "")}</span>
              &nbsp;· Optional: <span className="font-mono">{tpl.columns.filter(c => !c.endsWith("*")).join(", ")}</span>
            </div>

            <Button variant="outline" size="sm" onClick={() => setStep("pick")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview — {rows.length} rows detected</CardTitle>
              <Badge variant="secondary">Showing first {Math.min(5, rows.length)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
              <table className="text-xs w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {previewCols.map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      {previewCols.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > 5 && (
              <p className="text-xs text-muted-foreground">+ {rows.length - 5} more rows</p>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setRows([]); }}>
                <ArrowLeft className="h-4 w-4 mr-2" />Change File
              </Button>
              <Button size="sm" onClick={handleImport} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import {rows.length} {tpl.label}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Result ── */}
      {step === "result" && result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">{result.success} records imported successfully</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">{result.errors.length} errors</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">Row {err.row}: {err.message}</p>
                ))}
              </div>
            )}

            <Button onClick={reset}>
              Import More Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { ImportWizard } from "./import-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import Data</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV or Excel file to bulk-import contacts, products, or CRM leads
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}

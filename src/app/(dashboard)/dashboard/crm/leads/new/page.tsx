import { LeadForm } from "../lead-form";

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Lead</h2>
        <p className="text-sm text-muted-foreground">Add a new sales lead to your pipeline</p>
      </div>
      <LeadForm />
    </div>
  );
}

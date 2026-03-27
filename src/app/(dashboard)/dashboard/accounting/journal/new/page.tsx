import { getAccounts } from "@/lib/actions/accounting";
import { NewJournalEntryForm } from "./new-journal-entry-form";

export default async function NewJournalEntryPage() {
  const accounts = await getAccounts();
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">New Journal Entry</h1>
      <NewJournalEntryForm accounts={accounts} />
    </div>
  );
}

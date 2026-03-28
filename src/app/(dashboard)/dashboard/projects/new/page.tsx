import { getAnalyticAccounts } from "@/lib/actions/projects";
import { getEmployees } from "@/lib/actions/hr";
import { NewProjectForm } from "./new-project-form";

export default async function NewProjectPage() {
  const [analyticAccounts, employees] = await Promise.all([
    getAnalyticAccounts(),
    getEmployees(),
  ]);
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">New Project</h1>
      <NewProjectForm analyticAccounts={analyticAccounts} employees={employees} />
    </div>
  );
}

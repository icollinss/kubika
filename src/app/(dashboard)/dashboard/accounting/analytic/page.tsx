import { getAllAnalyticAccounts } from "@/lib/actions/projects";
import { AnalyticAccountsClient } from "./analytic-accounts-client";

export default async function AnalyticAccountsPage() {
  const accounts = await getAllAnalyticAccounts();
  return <AnalyticAccountsClient accounts={accounts} />;
}

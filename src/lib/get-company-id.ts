import { cache } from "react";
import { auth } from "@/auth";

export const getCompanyId = cache(async (): Promise<string> => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const companyId = session.user.companyId;
  if (!companyId) throw new Error("No company found");
  return companyId;
});

import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getCompanyId = cache(async (): Promise<string> => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Fast path: companyId already in JWT (sessions after the auth.ts update)
  if (session.user.companyId) return session.user.companyId;

  // Fallback: DB lookup for existing sessions issued before companyId was added to JWT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true },
  });
  if (!user?.companyId) throw new Error("No company found");
  return user.companyId;
});

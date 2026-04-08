"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getCompanyIdAndId() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthenticated");
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
    include: { company: true },
  });
  if (!user.companyId) throw new Error("No company");
  return user;
}

export async function getCompany() {
  const user = await getCompanyIdAndId();
  return user.company;
}

export async function updateCompany(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
}) {
  const user = await getCompanyIdAndId();
  await prisma.company.update({
    where: { id: user.companyId! },
    data,
  });
  revalidatePath("/dashboard/company");
}

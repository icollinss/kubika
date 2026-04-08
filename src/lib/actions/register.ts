"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function registerCompany(data: {
  companyName: string;
  country: string;
  currency: string;
  userName: string;
  email: string;
  password: string;
}) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const hashed = await hash(data.password, 12);

  // Create company + admin user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.companyName,
        country: data.country,
        currency: data.currency,
      },
    });

    const user = await tx.user.create({
      data: {
        name: data.userName,
        email: data.email,
        password: hashed,
        role: "ADMIN",
        companyId: company.id,
      },
    });

    return { company, user };
  });

  return result;
}

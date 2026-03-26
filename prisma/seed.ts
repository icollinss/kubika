import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("kubika123", 12);

  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "My Company",
      country: "Angola",
      currency: "AOA",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@kubika.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@kubika.com",
      password,
      role: "ADMIN",
      companyId: company.id,
    },
  });

  console.log("✅ Seeded:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

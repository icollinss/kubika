import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("kubika123", 12);

  // Company
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: { id: "default-company", name: "My Company", country: "Angola", currency: "AOA" },
  });

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@kubika.com" },
    update: {},
    create: { name: "Admin User", email: "admin@kubika.com", password, role: "ADMIN", companyId: company.id },
  });

  // Units of Measure
  const uoms = [
    { name: "Unit", symbol: "un", category: "Unit", isBase: true, ratio: 1 },
    { name: "Dozen", symbol: "dz", category: "Unit", isBase: false, ratio: 12 },
    { name: "Box", symbol: "box", category: "Unit", isBase: false, ratio: 1 },
    { name: "Kilogram", symbol: "kg", category: "Weight", isBase: true, ratio: 1 },
    { name: "Gram", symbol: "g", category: "Weight", isBase: false, ratio: 0.001 },
    { name: "Tonne", symbol: "t", category: "Weight", isBase: false, ratio: 1000 },
    { name: "Litre", symbol: "L", category: "Volume", isBase: true, ratio: 1 },
    { name: "Millilitre", symbol: "mL", category: "Volume", isBase: false, ratio: 0.001 },
    { name: "Metre", symbol: "m", category: "Length", isBase: true, ratio: 1 },
    { name: "Centimetre", symbol: "cm", category: "Length", isBase: false, ratio: 0.01 },
    { name: "Hour", symbol: "hr", category: "Time", isBase: true, ratio: 1 },
    { name: "Day", symbol: "day", category: "Time", isBase: false, ratio: 8 },
  ];

  for (const uom of uoms) {
    await prisma.unitOfMeasure.upsert({
      where: { id: `uom-${uom.symbol}-${company.id}` },
      update: {},
      create: { id: `uom-${uom.symbol}-${company.id}`, ...uom, companyId: company.id },
    });
  }

  // Product Categories
  const categories = [
    { id: `cat-electronics-${company.id}`, name: "Electronics" },
    { id: `cat-food-${company.id}`, name: "Food & Beverages" },
    { id: `cat-clothing-${company.id}`, name: "Clothing & Textiles" },
    { id: `cat-construction-${company.id}`, name: "Construction Materials" },
    { id: `cat-services-${company.id}`, name: "Services" },
    { id: `cat-consumables-${company.id}`, name: "Consumables" },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: { ...cat, companyId: company.id },
    });
  }

  // Default Warehouse + Locations
  const warehouse = await prisma.warehouse.upsert({
    where: { id: `wh-main-${company.id}` },
    update: {},
    create: { id: `wh-main-${company.id}`, name: "Main Warehouse", shortCode: "LDA", companyId: company.id },
  });

  const locations = [
    { id: `loc-stock-${company.id}`, name: "Stock", locationType: "INTERNAL" as const, fullPath: "LDA/Stock" },
    { id: `loc-input-${company.id}`, name: "Input", locationType: "INTERNAL" as const, fullPath: "LDA/Input" },
    { id: `loc-output-${company.id}`, name: "Output", locationType: "INTERNAL" as const, fullPath: "LDA/Output" },
    { id: `loc-vendor-${company.id}`, name: "Vendors", locationType: "VENDOR" as const, fullPath: "Vendors" },
    { id: `loc-customer-${company.id}`, name: "Customers", locationType: "CUSTOMER" as const, fullPath: "Customers" },
    { id: `loc-virtual-${company.id}`, name: "Virtual", locationType: "VIRTUAL" as const, fullPath: "Virtual" },
    { id: `loc-scrap-${company.id}`, name: "Scrap", locationType: "VIRTUAL" as const, fullPath: "Virtual/Scrap" },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: {},
      create: { ...loc, warehouseId: ["VENDOR","CUSTOMER","VIRTUAL"].includes(loc.locationType) ? undefined : warehouse.id, companyId: company.id },
    });
  }

  console.log("✅ Seeded company:", company.name);
  console.log("✅ Seeded user:", admin.email);
  console.log("✅ Seeded", uoms.length, "units of measure");
  console.log("✅ Seeded", categories.length, "product categories");
  console.log("✅ Seeded warehouse:", warehouse.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

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

  // Chart of Accounts — Angola PGC (Plano Geral de Contabilidade)
  const accounts = [
    // ASSETS (Classe 1 & 2)
    { code: "1000", name: "Assets",                    type: "ASSET",     subtype: "Group" },
    { code: "1100", name: "Current Assets",            type: "ASSET",     subtype: "Group" },
    { code: "1110", name: "Cash",                      type: "ASSET",     subtype: "Current Asset" },
    { code: "1111", name: "Cash - Main",               type: "ASSET",     subtype: "Current Asset" },
    { code: "1120", name: "Bank Accounts",             type: "ASSET",     subtype: "Current Asset" },
    { code: "1121", name: "Bank - BAI",                type: "ASSET",     subtype: "Current Asset" },
    { code: "1122", name: "Bank - BFA",                type: "ASSET",     subtype: "Current Asset" },
    { code: "1130", name: "Accounts Receivable",       type: "ASSET",     subtype: "Current Asset" },
    { code: "1140", name: "IVA Recoverable",           type: "ASSET",     subtype: "Current Asset" },
    { code: "1150", name: "Inventory",                 type: "ASSET",     subtype: "Current Asset" },
    { code: "1200", name: "Fixed Assets",              type: "ASSET",     subtype: "Group" },
    { code: "1210", name: "Equipment",                 type: "ASSET",     subtype: "Fixed Asset" },
    { code: "1220", name: "Vehicles",                  type: "ASSET",     subtype: "Fixed Asset" },
    { code: "1230", name: "Buildings",                 type: "ASSET",     subtype: "Fixed Asset" },
    { code: "1290", name: "Accumulated Depreciation",  type: "ASSET",     subtype: "Fixed Asset" },

    // LIABILITIES (Classe 3 & 4)
    { code: "2000", name: "Liabilities",               type: "LIABILITY",  subtype: "Group" },
    { code: "2100", name: "Current Liabilities",       type: "LIABILITY",  subtype: "Group" },
    { code: "2110", name: "Accounts Payable",          type: "LIABILITY",  subtype: "Current Liability" },
    { code: "2120", name: "IVA Payable",               type: "LIABILITY",  subtype: "Current Liability" },
    { code: "2130", name: "IRT Payable",               type: "LIABILITY",  subtype: "Current Liability" },
    { code: "2140", name: "Income Tax Payable (II)",   type: "LIABILITY",  subtype: "Current Liability" },
    { code: "2150", name: "Salaries Payable",          type: "LIABILITY",  subtype: "Current Liability" },
    { code: "2200", name: "Long-term Liabilities",     type: "LIABILITY",  subtype: "Group" },
    { code: "2210", name: "Bank Loans",                type: "LIABILITY",  subtype: "Long-term Liability" },

    // EQUITY (Classe 5)
    { code: "3000", name: "Equity",                    type: "EQUITY",    subtype: "Group" },
    { code: "3100", name: "Share Capital",             type: "EQUITY",    subtype: "Equity" },
    { code: "3200", name: "Retained Earnings",         type: "EQUITY",    subtype: "Equity" },
    { code: "3300", name: "Current Year Profit/Loss",  type: "EQUITY",    subtype: "Equity" },

    // REVENUE (Classe 7)
    { code: "4000", name: "Revenue",                   type: "REVENUE",   subtype: "Group" },
    { code: "4100", name: "Sales Revenue",             type: "REVENUE",   subtype: "Operating Revenue" },
    { code: "4110", name: "Product Sales",             type: "REVENUE",   subtype: "Operating Revenue" },
    { code: "4120", name: "Service Revenue",           type: "REVENUE",   subtype: "Operating Revenue" },
    { code: "4200", name: "Other Revenue",             type: "REVENUE",   subtype: "Other Revenue" },
    { code: "4210", name: "Interest Income",           type: "REVENUE",   subtype: "Other Revenue" },

    // EXPENSES (Classe 6)
    { code: "5000", name: "Expenses",                  type: "EXPENSE",   subtype: "Group" },
    { code: "5100", name: "Cost of Goods Sold",        type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5200", name: "Operating Expenses",        type: "EXPENSE",   subtype: "Group" },
    { code: "5210", name: "Salaries & Wages",          type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5220", name: "Rent Expense",              type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5230", name: "Utilities",                 type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5240", name: "Transport & Logistics",     type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5250", name: "Marketing & Advertising",   type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5260", name: "Office Supplies",           type: "EXPENSE",   subtype: "Operating Expense" },
    { code: "5300", name: "Tax Expenses",              type: "EXPENSE",   subtype: "Tax" },
    { code: "5310", name: "IVA Expense",               type: "EXPENSE",   subtype: "Tax" },
    { code: "5320", name: "IRT Expense",               type: "EXPENSE",   subtype: "Tax" },
    { code: "5400", name: "Financial Expenses",        type: "EXPENSE",   subtype: "Financial" },
    { code: "5410", name: "Bank Charges",              type: "EXPENSE",   subtype: "Financial" },
    { code: "5420", name: "Interest Expense",          type: "EXPENSE",   subtype: "Financial" },
    { code: "5500", name: "Depreciation",              type: "EXPENSE",   subtype: "Operating Expense" },
  ] as const;

  for (const acc of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { id: `acc-${acc.code}-${company.id}` },
      update: {},
      create: { id: `acc-${acc.code}-${company.id}`, ...acc, companyId: company.id },
    });
  }

  console.log("✅ Seeded company:", company.name);
  console.log("✅ Seeded user:", admin.email);
  console.log("✅ Seeded", uoms.length, "units of measure");
  console.log("✅ Seeded", categories.length, "product categories");
  console.log("✅ Seeded warehouse:", warehouse.name);
  console.log("✅ Seeded", accounts.length, "chart of accounts");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

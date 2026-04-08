"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Receipt,
  BarChart3, Settings, Building2, Warehouse, ClipboardList,
  FileText, ShoppingBag, BookOpen, TrendingUp, Scale, Users2,
  Banknote, FolderKanban, ChevronDown, ChevronRight, Store,
  Wrench, CreditCard, Target, Globe, Upload, Wallet,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const n = t.nav;

  const [inventoryOpen,  setInventoryOpen]  = useState(pathname.startsWith("/dashboard/inventory"));
  const [salesOpen,      setSalesOpen]      = useState(pathname.startsWith("/dashboard/sales"));
  const [purchasingOpen, setPurchasingOpen] = useState(pathname.startsWith("/dashboard/purchasing"));
  const [accountingOpen, setAccountingOpen] = useState(pathname.startsWith("/dashboard/accounting"));
  const [hrOpen,         setHrOpen]         = useState(pathname.startsWith("/dashboard/hr"));
  const [fieldServiceOpen, setFieldServiceOpen] = useState(pathname.startsWith("/dashboard/field-service"));
  const [crmOpen,        setCrmOpen]        = useState(pathname.startsWith("/dashboard/crm"));

  type Group = {
    label: string; icon: React.ElementType; key: string; basePath: string;
    children: { href: string; label: string; icon: React.ElementType }[];
  };
  type Leaf = { href: string; label: string; icon: React.ElementType };

  const navItems: (Group | Leaf)[] = [
    { href: "/dashboard",          label: n.dashboard,  icon: LayoutDashboard },
    { href: "/dashboard/contacts", label: n.contacts,   icon: Users },
    {
      label: n.inventory, icon: Package, key: "inventory", basePath: "/dashboard/inventory",
      children: [
        { href: "/dashboard/inventory/products",   label: n.products,   icon: Package },
        { href: "/dashboard/inventory/operations", label: n.operations, icon: ClipboardList },
        { href: "/dashboard/inventory/warehouses", label: n.warehouses, icon: Warehouse },
      ],
    },
    {
      label: n.sales, icon: ShoppingCart, key: "sales", basePath: "/dashboard/sales",
      children: [
        { href: "/dashboard/sales/orders",   label: n.orders,   icon: ShoppingCart },
        { href: "/dashboard/sales/invoices", label: n.invoices, icon: FileText },
      ],
    },
    {
      label: n.purchasing, icon: ShoppingBag, key: "purchasing", basePath: "/dashboard/purchasing",
      children: [
        { href: "/dashboard/purchasing/orders", label: n.purchaseOrders, icon: ShoppingBag },
        { href: "/dashboard/purchasing/bills",  label: n.supplierBills,  icon: Receipt },
      ],
    },
    {
      label: n.accounting, icon: Receipt, key: "accounting", basePath: "/dashboard/accounting",
      children: [
        { href: "/dashboard/accounting",                       label: n.chartOfAccounts, icon: BookOpen },
        { href: "/dashboard/accounting/journal",               label: n.journalEntries,  icon: FileText },
        { href: "/dashboard/accounting/reports/pl",            label: n.profitLoss,      icon: TrendingUp },
        { href: "/dashboard/accounting/reports/balance-sheet", label: n.balanceSheet,    icon: Scale },
        { href: "/dashboard/accounting/currencies",            label: n.currencies,      icon: Globe },
      ],
    },
    {
      label: n.hrPayroll, icon: Users2, key: "hr", basePath: "/dashboard/hr",
      children: [
        { href: "/dashboard/hr/employees", label: n.employees, icon: Users2 },
        { href: "/dashboard/hr/payroll",   label: n.payroll,   icon: Banknote },
      ],
    },
    { href: "/dashboard/projects", label: n.projects, icon: FolderKanban },
    {
      label: n.crm, icon: Target, key: "crm", basePath: "/dashboard/crm",
      children: [
        { href: "/dashboard/crm",       label: n.pipeline, icon: Target },
        { href: "/dashboard/crm/leads", label: n.allLeads, icon: Users2 },
      ],
    },
    { href: "/dashboard/pos", label: n.pointOfSale, icon: Store },
    {
      label: n.fieldService, icon: Wrench, key: "fieldservice", basePath: "/dashboard/field-service",
      children: [
        { href: "/dashboard/field-service",            label: n.serviceOrders, icon: Wrench },
        { href: "/dashboard/field-service/worksheets", label: n.worksheets,    icon: FileText },
      ],
    },
    { href: "/dashboard/statements", label: n.statements, icon: CreditCard },
    { href: "/dashboard/import",     label: n.importData,  icon: Upload },
    { href: "/dashboard/reports",    label: n.reports,     icon: BarChart3 },
  ];

  const bottomItems = [
    { href: "/dashboard/settings/payments", label: n.payments, icon: Wallet },
    { href: "/dashboard/company",           label: n.company,  icon: Building2 },
    { href: "/dashboard/settings",          label: n.settings, icon: Settings },
  ];

  const openMap: Record<string, boolean> = {
    inventory: inventoryOpen, sales: salesOpen, purchasing: purchasingOpen,
    accounting: accountingOpen, hr: hrOpen, fieldservice: fieldServiceOpen, crm: crmOpen,
  };
  const toggleMap: Record<string, () => void> = {
    inventory:   () => setInventoryOpen(!inventoryOpen),
    sales:       () => setSalesOpen(!salesOpen),
    purchasing:  () => setPurchasingOpen(!purchasingOpen),
    accounting:  () => setAccountingOpen(!accountingOpen),
    hr:          () => setHrOpen(!hrOpen),
    fieldservice:() => setFieldServiceOpen(!fieldServiceOpen),
    crm:         () => setCrmOpen(!crmOpen),
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r">
      {/* Brand */}
      <div className="px-6 py-5 border-b">
        <h1 className="text-xl font-bold tracking-tight">Kubika</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Business Platform</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if ("children" in item) {
            const group = item as Group;
            const isActive = pathname.startsWith(group.basePath);
            const isOpen = openMap[group.key] ?? false;
            const toggle = toggleMap[group.key] ?? (() => {});
            return (
              <div key={group.key}>
                <button
                  onClick={toggle}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="h-4 w-4 shrink-0" />
                    {group.label}
                  </span>
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {group.children.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                          pathname === href || pathname.startsWith(href + "/")
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const leaf = item as Leaf;
          return (
            <Link
              key={leaf.href}
              href={leaf.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === leaf.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <leaf.icon className="h-4 w-4 shrink-0" />
              {leaf.label}
            </Link>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div className="border-t px-1 py-2">
        <LanguageSwitcher />
      </div>

      {/* Bottom nav */}
      <div className="px-3 pb-4 space-y-1">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

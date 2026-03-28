"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  Building2,
  Warehouse,
  ClipboardList,
  FileText,
  ShoppingBag,
  BookOpen,
  TrendingUp,
  Scale,
  Users2,
  Banknote,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

type NavLeaf = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string; icon: React.ElementType; key: string; basePath: string; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  {
    label: "Inventory", icon: Package, key: "inventory", basePath: "/dashboard/inventory",
    children: [
      { href: "/dashboard/inventory/products", label: "Products", icon: Package },
      { href: "/dashboard/inventory/operations", label: "Operations", icon: ClipboardList },
      { href: "/dashboard/inventory/warehouses", label: "Warehouses", icon: Warehouse },
    ],
  },
  {
    label: "Sales", icon: ShoppingCart, key: "sales", basePath: "/dashboard/sales",
    children: [
      { href: "/dashboard/sales/orders", label: "Orders", icon: ShoppingCart },
      { href: "/dashboard/sales/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Purchasing", icon: ShoppingBag, key: "purchasing", basePath: "/dashboard/purchasing",
    children: [
      { href: "/dashboard/purchasing/orders", label: "Purchase Orders", icon: ShoppingBag },
      { href: "/dashboard/purchasing/bills", label: "Supplier Bills", icon: Receipt },
    ],
  },
  {
    label: "Accounting", icon: Receipt, key: "accounting", basePath: "/dashboard/accounting",
    children: [
      { href: "/dashboard/accounting", label: "Chart of Accounts", icon: BookOpen },
      { href: "/dashboard/accounting/journal", label: "Journal Entries", icon: FileText },
      { href: "/dashboard/accounting/reports/pl", label: "Profit & Loss", icon: TrendingUp },
      { href: "/dashboard/accounting/reports/balance-sheet", label: "Balance Sheet", icon: Scale },
    ],
  },
  {
    label: "HR & Payroll", icon: Users2, key: "hr", basePath: "/dashboard/hr",
    children: [
      { href: "/dashboard/hr/employees", label: "Employees", icon: Users2 },
      { href: "/dashboard/hr/payroll", label: "Payroll", icon: Banknote },
    ],
  },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const bottomItems = [
  { href: "/dashboard/company", label: "Company", icon: Building2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [inventoryOpen, setInventoryOpen] = useState(pathname.startsWith("/dashboard/inventory"));
  const [salesOpen, setSalesOpen] = useState(pathname.startsWith("/dashboard/sales"));
  const [purchasingOpen, setPurchasingOpen] = useState(pathname.startsWith("/dashboard/purchasing"));
  const [accountingOpen, setAccountingOpen] = useState(pathname.startsWith("/dashboard/accounting"));
  const [hrOpen, setHrOpen] = useState(pathname.startsWith("/dashboard/hr"));

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
            const group = item as NavGroup;
            const isActive = pathname.startsWith(group.basePath);
            const isOpen = group.key === "sales" ? salesOpen : group.key === "purchasing" ? purchasingOpen : group.key === "accounting" ? accountingOpen : group.key === "hr" ? hrOpen : inventoryOpen;
            const toggle = group.key === "sales" ? () => setSalesOpen(!salesOpen) : group.key === "purchasing" ? () => setPurchasingOpen(!purchasingOpen) : group.key === "accounting" ? () => setAccountingOpen(!accountingOpen) : group.key === "hr" ? () => setHrOpen(!hrOpen) : () => setInventoryOpen(!inventoryOpen);
            return (
              <div key={group.label}>
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
                          pathname === href || pathname.startsWith(href)
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t space-y-1">
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

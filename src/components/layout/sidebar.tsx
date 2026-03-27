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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
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
  { href: "/dashboard/accounting", label: "Accounting", icon: Receipt },
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
            const isActive = pathname.startsWith(item.basePath);
            const isOpen = item.key === "sales" ? salesOpen : item.key === "purchasing" ? purchasingOpen : inventoryOpen;
            const toggle = item.key === "sales" ? () => setSalesOpen(!salesOpen) : item.key === "purchasing" ? () => setPurchasingOpen(!purchasingOpen) : () => setInventoryOpen(!inventoryOpen);
            return (
              <div key={item.label}>
                <button
                  onClick={toggle}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {item.children.map(({ href, label, icon: Icon }) => (
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

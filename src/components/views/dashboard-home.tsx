"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users, Package, ShoppingCart, Receipt, BarChart3,
  Target, ShoppingBag, FileText, BookOpen, Users2, FolderKanban,
  Store, Wrench, Settings, Building2, Upload, LayoutGrid,
  TrendingUp, AlertTriangle, RefreshCw, ArrowRight, Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useLanguage } from "@/contexts/language-context";
import type { Locale } from "@/lib/i18n";

export type DashboardStats = {
  contacts: number;
  products: number;
  salesOrdersThisMonth: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  revenueThisMonth: number;
  overdueInvoices: number;
};

export type RecentSale = {
  id: string;
  number: string;
  customer: string;
  total: number;
  status: string;
  date: Date;
};

interface Props {
  userName: string;
  stats: DashboardStats;
  recentSales: RecentSale[];
  view: "apps" | "overview";
}

function fmtAOA(n: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: Date, locale: Locale) {
  const intlLocale = locale === "pt" ? "pt-AO" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

export function DashboardHome({ userName, stats, recentSales, view: initialView }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useLanguage();

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const switchView = (v: "apps" | "overview") => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", v);
    router.push(`${pathname}?${params.toString()}`);
  };

  const view = initialView;

  const apps = [
    { label: t.nav.contacts,       href: "/dashboard/contacts",           icon: Users,        bg: "bg-cyan-500"    },
    { label: t.nav.crm,            href: "/dashboard/crm",                icon: Target,       bg: "bg-rose-500"    },
    { label: t.nav.sales,          href: "/dashboard/sales/orders",       icon: ShoppingCart, bg: "bg-orange-500"  },
    { label: t.nav.invoices,       href: "/dashboard/sales/invoices",     icon: FileText,     bg: "bg-indigo-500"  },
    { label: t.nav.purchasing,     href: "/dashboard/purchasing/orders",  icon: ShoppingBag,  bg: "bg-purple-500"  },
    { label: t.nav.inventory,      href: "/dashboard/inventory/products", icon: Package,      bg: "bg-emerald-500" },
    { label: t.nav.accounting,     href: "/dashboard/accounting",         icon: BookOpen,     bg: "bg-teal-500"    },
    { label: t.nav.hrPayroll,      href: "/dashboard/hr/employees",       icon: Users2,       bg: "bg-pink-500"    },
    { label: t.nav.projects,       href: "/dashboard/projects",           icon: FolderKanban, bg: "bg-violet-500"  },
    { label: t.nav.pointOfSale,    href: "/dashboard/pos",                icon: Store,        bg: "bg-amber-500"   },
    { label: t.nav.fieldService,   href: "/dashboard/field-service",      icon: Wrench,       bg: "bg-yellow-600"  },
    { label: t.nav.payments,       href: "/dashboard/settings/payments",  icon: Wallet,       bg: "bg-blue-500"    },
    { label: t.nav.reports,        href: "/dashboard/reports",            icon: BarChart3,    bg: "bg-slate-500"   },
    { label: t.nav.importData,     href: "/dashboard/import",             icon: Upload,       bg: "bg-lime-600"    },
    { label: t.nav.company,        href: "/dashboard/company",            icon: Building2,    bg: "bg-stone-500"   },
    { label: t.nav.settings,       href: "/dashboard/settings",           icon: Settings,     bg: "bg-gray-500"    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      QUOTATION: { label: t.status.quotation, variant: "secondary"    },
      CONFIRMED: { label: t.status.confirmed, variant: "default"      },
      DELIVERED: { label: t.status.delivered, variant: "outline"      },
      CANCELLED: { label: t.status.cancelled, variant: "destructive"  },
    };
    return map[status] ?? { label: status, variant: "secondary" as const };
  };

  const statCards = [
    {
      label: t.nav.contacts,
      value: stats.contacts.toLocaleString(),
      icon: Users,
      color: "text-cyan-500",
      href: "/dashboard/contacts",
    },
    {
      label: t.dashboard.activeProducts,
      value: stats.products.toLocaleString(),
      icon: Package,
      color: "text-emerald-500",
      href: "/dashboard/inventory/products",
    },
    {
      label: t.dashboard.ordersThisMonth,
      value: stats.salesOrdersThisMonth.toLocaleString(),
      icon: ShoppingCart,
      color: "text-orange-500",
      href: "/dashboard/sales/orders",
    },
    {
      label: t.dashboard.unpaidInvoicesLabel,
      value: stats.unpaidInvoices.toLocaleString(),
      icon: Receipt,
      color: stats.overdueInvoices > 0 ? "text-red-500" : "text-purple-500",
      sub: stats.unpaidAmount > 0 ? fmtAOA(stats.unpaidAmount) : undefined,
      href: "/dashboard/sales/invoices",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t.dashboard.welcome}, {userName}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t.dashboard.todayOverview}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "overview" && (
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isPending}
              className="h-8 px-3 text-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isPending && "animate-spin")} />
              {t.actions.refresh}
            </Button>
          )}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={view === "apps" ? "default" : "ghost"}
              size="sm"
              onClick={() => switchView("apps")}
              className="h-7 px-3 text-xs"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              {t.dashboard.appsView}
            </Button>
            <Button
              variant={view === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => switchView("overview")}
              className="h-7 px-3 text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              {t.dashboard.overviewView}
            </Button>
          </div>
        </div>
      </div>

      {/* ── APP LAUNCHER ── */}
      {view === "apps" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {apps.map(({ label, href, icon: Icon, bg }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-background border border-border hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer group select-none">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", bg)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[11px] font-medium text-center text-foreground/80 leading-tight group-hover:text-foreground transition-colors">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {view === "overview" && (
        <div className="space-y-4">
          {/* Overdue banner */}
          {stats.overdueInvoices > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                {stats.overdueInvoices}{" "}
                {stats.overdueInvoices > 1 ? t.dashboard.invoicePlural : t.dashboard.invoiceSingular}{" "}
                {t.dashboard.overdueAlert} —{" "}
                <Link href="/dashboard/sales/invoices?status=OVERDUE" className="underline underline-offset-2">
                  {t.dashboard.viewNow}
                </Link>
              </p>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, color, sub, href }) => (
              <Link key={label} href={href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                    <Icon className={cn("h-4 w-4", color)} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub} {t.dashboard.amountPending}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Revenue card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.dashboard.revenueThisMonth}</p>
                  <p className="text-xs text-muted-foreground">{t.dashboard.confirmedPaidLabel}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary">{fmtAOA(stats.revenueThisMonth)}</p>
            </CardContent>
          </Card>

          {/* Recent Sales + Quick Links */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Recent Sales */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{t.dashboard.recentOrders}</CardTitle>
                <Link href="/dashboard/sales/orders" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  {t.dashboard.viewAll} <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {t.dashboard.noOrdersYet}
                  </p>
                ) : (
                  <div className="space-y-0 divide-y divide-border">
                    {recentSales.map((sale) => {
                      const badge = statusBadge(sale.status);
                      return (
                        <Link
                          key={sale.id}
                          href={`/dashboard/sales/orders/${sale.id}`}
                          className="flex items-center justify-between py-2.5 hover:bg-muted/40 rounded px-1 transition-colors -mx-1"
                        >
                          <div>
                            <p className="text-sm font-medium">{sale.number}</p>
                            <p className="text-xs text-muted-foreground">{sale.customer} · {fmtDate(sale.date, locale)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                            <span className="text-sm font-semibold tabular-nums">{fmtAOA(sale.total)}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t.dashboard.quickActions}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { label: t.dashboard.newSalesOrder,    href: "/dashboard/sales/orders/new",       icon: ShoppingCart, color: "text-orange-500" },
                  { label: t.dashboard.newInvoice,       href: "/dashboard/sales/invoices/new",     icon: FileText,     color: "text-indigo-500" },
                  { label: t.dashboard.newPurchaseOrder, href: "/dashboard/purchasing/orders/new",  icon: ShoppingBag,  color: "text-purple-500" },
                  { label: t.dashboard.newContact,       href: "/dashboard/contacts/new",           icon: Users,        color: "text-cyan-500"   },
                  { label: t.dashboard.newProduct,       href: "/dashboard/inventory/products/new", icon: Package,      color: "text-emerald-500"},
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", color)} />
                    {label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

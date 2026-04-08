import Link from "next/link";
import {
  Package, ShoppingCart, Receipt, BarChart3, Users2,
  ShoppingBag, Store, Wrench,
  Target, FolderKanban, MessageCircle, CreditCard,
  CheckCircle, ArrowRight, Globe, Shield, Zap, TrendingUp,
} from "lucide-react";

// ─── Module catalogue ─────────────────────────────────────────────────────────

const modules = [
  { icon: ShoppingCart, name: "Sales & Quotations",    desc: "Orders, invoices, send quotes via WhatsApp", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40" },
  { icon: Package,      name: "Inventory",              desc: "Products, stock moves, warehouses & lots",   color: "bg-green-50 text-green-600 dark:bg-green-950/40" },
  { icon: ShoppingBag,  name: "Purchasing",             desc: "Purchase orders, supplier bills & receipts", color: "bg-orange-50 text-orange-600 dark:bg-orange-950/40" },
  { icon: Receipt,      name: "Accounting",             desc: "Chart of accounts, journal entries, P&L",    color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40" },
  { icon: Users2,       name: "HR & Payroll",           desc: "Employees, contracts, payslips, INSS/IRT",   color: "bg-pink-50 text-pink-600 dark:bg-pink-950/40" },
  { icon: Store,        name: "Point of Sale",          desc: "POS terminals, sessions, receipts, refunds", color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40" },
  { icon: Target,       name: "CRM & Leads",            desc: "Pipeline, social media leads, activities",   color: "bg-red-50 text-red-600 dark:bg-red-950/40" },
  { icon: Wrench,       name: "Field Service",          desc: "Service orders, maps, worksheets, signatures",color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40" },
  { icon: FolderKanban, name: "Projects",               desc: "Milestones, tasks, timesheets, budgets",     color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40" },
  { icon: CreditCard,   name: "Credit & Statements",    desc: "Customer balances, aging reports, limits",   color: "bg-teal-50 text-teal-600 dark:bg-teal-950/40" },
  { icon: MessageCircle,name: "WhatsApp Integration",   desc: "Send invoices & quotes directly to clients", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" },
  { icon: BarChart3,    name: "Reports & Analytics",    desc: "Balance sheet, P&L, tax reports, KPIs",      color: "bg-slate-50 text-slate-600 dark:bg-slate-950/40" },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    priceEn: "Free",
    period: "",
    highlight: false,
    description: "Perfect for small traders getting started",
    features: [
      "1 user included",
      "Contacts & Inventory",
      "Sales & Invoicing",
      "Purchasing & Bills",
      "Community support",
    ],
    cta: "Start for free",
  },
  {
    name: "Growth",
    price: "$49",
    priceEn: "$49",
    period: "/month",
    highlight: true,
    description: "Everything your growing business needs",
    features: [
      "Up to 5 users",
      "All Starter modules",
      "Accounting & HR & Payroll",
      "CRM & Field Service",
      "Point of Sale",
      "WhatsApp integration",
      "Email support",
    ],
    cta: "Start free trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceEn: "Custom",
    period: "",
    highlight: false,
    description: "For large operations across multiple locations",
    features: [
      "Unlimited users",
      "All Growth modules",
      "Multiple warehouses",
      "Priority support",
      "Custom integrations",
      "Dedicated onboarding",
    ],
    cta: "Contact us",
  },
];

// ─── Why Kubika ───────────────────────────────────────────────────────────────

const reasons = [
  { icon: Globe,    title: "Built for Africa",     desc: "AOA, KES, NGN, ZAR and more. IVA, INSS, IRT compliance built in." },
  { icon: Zap,      title: "All-in-one platform",  desc: "No more switching between spreadsheets, WhatsApp, and accounting software." },
  { icon: Shield,   title: "Your data, your control", desc: "Each company has its own isolated, secure workspace." },
  { icon: TrendingUp, title: "Grow with it",       desc: "Start with sales. Add HR, POS, and field service as you scale." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Kubika</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
            <a href="#pricing"  className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#why"      className="hover:text-foreground transition-colors">Why Kubika</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground bg-muted/50">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Built for African traders & businesses
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Run your entire business<br />
          <span className="text-primary">from one platform</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Inventory, sales, accounting, HR, POS, CRM, and field service —
          all connected, all in real time. No spreadsheets. No chaos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border font-semibold text-base hover:bg-muted transition-colors"
          >
            Sign in to your workspace
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">No credit card required · Full access for 14 days</p>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="bg-muted/30 border-y py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Everything your business needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Activate only the modules you need. Upgrade as your business grows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((mod) => (
              <div key={mod.name} className="bg-background rounded-xl border p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${mod.color}`}>
                  <mod.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{mod.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Kubika ── */}
      <section id="why" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Why Kubika?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Most ERP software isn't built for African markets. Kubika is.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r) => (
            <div key={r.title} className="space-y-3 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-muted/30 border-y py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free. Scale as you grow. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-background rounded-2xl border p-6 space-y-5 flex flex-col ${
                  plan.highlight ? "border-primary ring-2 ring-primary/20 shadow-lg" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="inline-flex self-start px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    Most popular
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm pb-1">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === "Enterprise" ? "mailto:hello@kubika.app" : "/register"}
                  className={`block text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ready to take control of your business?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Join businesses across Africa using Kubika to manage operations, close deals faster, and grow with confidence.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors"
        >
          Start your free trial <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="text-xs text-muted-foreground">No credit card · 14-day trial · All modules included</p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Kubika</span>
          <span>© {new Date().getFullYear()} Kubika. Business Intelligence for Africa.</span>
          <div className="flex gap-4">
            <Link href="/login"    className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

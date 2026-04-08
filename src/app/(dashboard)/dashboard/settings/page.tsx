import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Building2, Globe, Bell, Shield, ChevronRight } from "lucide-react";

const sections = [
  {
    href: "/dashboard/settings/payments",
    icon: CreditCard,
    title: "Payment Providers",
    description: "Configure Flutterwave, Paystack, and other payment gateways for online invoice payments.",
  },
  {
    href: "/dashboard/company",
    icon: Building2,
    title: "Company Profile",
    description: "Update your company name, address, tax ID, phone, and contact details.",
  },
  {
    href: "/dashboard/accounting/currencies",
    icon: Globe,
    title: "Multi-Currency",
    description: "Set your base currency and manage exchange rates for foreign currency transactions.",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace configuration</p>
      </div>

      <div className="space-y-3">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-6 text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Bell className="h-4 w-4" />
          <Shield className="h-4 w-4" />
        </div>
        <p className="text-sm text-muted-foreground">Notifications and user management coming soon.</p>
      </div>
    </div>
  );
}

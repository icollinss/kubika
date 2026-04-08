"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { registerCompany } from "@/lib/actions/register";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

const CURRENCIES = [
  { value: "AOA", label: "AOA — Kwanza (Angola)" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "XOF", label: "XOF — West African CFA Franc" },
];

const COUNTRIES = [
  "Angola", "South Africa", "Nigeria", "Kenya", "Ghana", "Ethiopia",
  "Tanzania", "Uganda", "Mozambique", "Zambia", "Zimbabwe", "Côte d'Ivoire",
  "Senegal", "Cameroon", "Rwanda", "Other",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    country: "Angola",
    currency: "AOA",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { t } = useLanguage();
  const r = t.register;

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setError("");
  }

  function canProceedStep1() {
    return form.companyName.trim().length >= 2;
  }

  function canProceedStep2() {
    return (
      form.userName.trim().length >= 2 &&
      form.email.includes("@") &&
      form.password.length >= 6 &&
      form.password === form.confirmPassword
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canProceedStep2()) return;
    setLoading(true);
    setError("");

    try {
      await registerCompany({
        companyName: form.companyName.trim(),
        country: form.country,
        currency: form.currency,
        userName: form.userName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please go to login.");
        return;
      }

      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
          <Link href="/" className="text-3xl font-bold tracking-tight hover:opacity-80">Kubika</Link>
          <p className="text-muted-foreground text-sm">{r.subtitle}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > s ? "bg-primary text-primary-foreground" :
                step === s ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>{r.yourCompany}</CardTitle>
                <CardDescription>{r.companyInfo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{r.companyName} *</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    placeholder="e.g. Kubika Lda, TradeCo Angola"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{r.country}</Label>
                  <select
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{r.currency}</Label>
                  <select
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1()}
                >
                  {t.actions.next} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>{r.yourAccount}</CardTitle>
                <CardDescription>{r.adminAccount} <strong>{form.companyName}</strong></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{r.fullName} *</Label>
                  <Input
                    value={form.userName}
                    onChange={(e) => set("userName", e.target.value)}
                    placeholder="Your full name"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{r.workEmail} *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.auth.password} *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder={r.minPassword}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{r.confirmPassword} *</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder={r.confirmPassword}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-destructive text-xs">{r.passwordMismatch}</p>
                  )}
                </div>

                {error && <p className="text-destructive text-sm text-center">{error}</p>}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />{t.actions.back}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !canProceedStep2()}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loading ? r.settingUp : r.launch}
                  </Button>
                </div>
              </CardContent>
            </form>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {r.alreadyAccount}{" "}
          <Link href="/login" className="underline hover:text-foreground">{t.auth.signIn}</Link>
        </p>
      </div>
    </div>
  );
}

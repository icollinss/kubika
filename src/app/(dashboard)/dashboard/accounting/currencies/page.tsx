import { getExchangeRates } from "@/lib/actions/currency";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { ExchangeRateForm } from "./exchange-rate-form";
import { RateRow } from "./rate-row";
import { BaseCurrencyForm } from "./base-currency-form";

async function getCompanyCurrency(): Promise<string> {
  const session = await auth();
  if (!session?.user?.email) return "AOA";
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { company: true },
  });
  return user?.company?.currency ?? "AOA";
}

export default async function CurrenciesPage() {
  const [rates, baseCurrency] = await Promise.all([
    getExchangeRates(),
    getCompanyCurrency(),
  ]);

  const baseCurrencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === baseCurrency);

  // Currencies not yet configured
  const configuredCodes = new Set(rates.map((r) => r.fromCurrency));
  configuredCodes.add(baseCurrency);
  const availableCurrencies = SUPPORTED_CURRENCIES.filter((c) => !configuredCodes.has(c.code));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Multi-Currency</h2>
        <p className="text-sm text-muted-foreground">
          Manage exchange rates for transactions in foreign currencies
        </p>
      </div>

      {/* Base currency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />Base Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {baseCurrencyInfo?.symbol ?? baseCurrency}
            </div>
            <div>
              <p className="font-semibold">{baseCurrency}</p>
              <p className="text-xs text-muted-foreground">{baseCurrencyInfo?.name ?? "Base currency"}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Base</Badge>
          </div>
          <BaseCurrencyForm current={baseCurrency} />
        </CardContent>
      </Card>

      {/* Active rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exchange Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          {rates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No exchange rates configured. Add a currency below.
            </p>
          ) : (
            rates.map((rate) => (
              <RateRow key={rate.id} rate={rate} baseCurrency={baseCurrency} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Add new rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <ExchangeRateForm
            baseCurrency={baseCurrency}
            availableCurrencies={availableCurrencies}
          />
        </CardContent>
      </Card>
    </div>
  );
}

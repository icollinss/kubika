// ─── Currency utility ─────────────────────────────────────────────────────────
// Central place for currency formatting and conversion across Kubika.

export const SUPPORTED_CURRENCIES: { code: string; name: string; symbol: string }[] = [
  { code: "AOA", name: "Angolan Kwanza",       symbol: "Kz" },
  { code: "USD", name: "US Dollar",            symbol: "$"  },
  { code: "EUR", name: "Euro",                 symbol: "€"  },
  { code: "GBP", name: "British Pound",        symbol: "£"  },
  { code: "ZAR", name: "South African Rand",   symbol: "R"  },
  { code: "NGN", name: "Nigerian Naira",       symbol: "₦"  },
  { code: "KES", name: "Kenyan Shilling",      symbol: "KSh"},
  { code: "GHS", name: "Ghanaian Cedi",        symbol: "₵"  },
  { code: "XOF", name: "West African CFA",     symbol: "F"  },
  { code: "MZN", name: "Mozambican Metical",   symbol: "MT" },
  { code: "ZMW", name: "Zambian Kwacha",       symbol: "ZK" },
  { code: "CNY", name: "Chinese Yuan",         symbol: "¥"  },
  { code: "BRL", name: "Brazilian Real",       symbol: "R$" },
  { code: "AED", name: "UAE Dirham",           symbol: "د.إ"},
];

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/**
 * Format an amount in a given currency using the browser/server locale.
 * Falls back to a simple format if the currency is not in Intl.
 */
export function formatCurrency(amount: number, currency: string, locale = "pt-AO"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unrecognised currencies
    const sym = getCurrencySymbol(currency);
    return `${sym} ${amount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Convert an amount from one currency to another using a rates map.
 * `rates` maps fromCurrency → rate (where rate = how many baseCurrency units = 1 fromCurrency).
 * If either currency equals baseCurrency, we treat its rate as 1.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>, // key: fromCurrency, value: rate to base
  baseCurrency: string
): number {
  if (from === to) return amount;

  // Convert from → base
  const toBase = from === baseCurrency ? amount : amount * (rates[from] ?? 1);

  // Convert base → to
  if (to === baseCurrency) return toBase;
  const toRate = rates[to] ?? 1;
  return toBase / toRate;
}

/**
 * Build a rates map from ExchangeRate records.
 * Returns { "USD": 850, "EUR": 920, ... } where values are rate → baseCurrency.
 */
export function buildRatesMap(
  exchangeRates: { fromCurrency: string; rate: number }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of exchangeRates) {
    map[r.fromCurrency] = r.rate;
  }
  return map;
}

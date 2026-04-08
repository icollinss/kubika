/**
 * Shows a foreign-currency amount and its equivalent in the base currency.
 * Used on invoices, sales orders, purchase orders.
 *
 * Example:
 *   <CurrencyBadge amount={1000} currency="USD" baseCurrency="AOA" rate={850} />
 *   → "$1,000.00 USD  ≈  850,000.00 AOA"
 */
import { formatCurrency } from "@/lib/currency";

interface Props {
  amount: number;
  currency: string;
  baseCurrency: string;
  rate?: number | null; // how many baseCurrency units = 1 currency unit
  className?: string;
}

export function CurrencyBadge({ amount, currency, baseCurrency, rate, className }: Props) {
  const primary = formatCurrency(amount, currency);

  if (currency === baseCurrency || !rate) {
    return <span className={className}>{primary}</span>;
  }

  const converted = amount * rate;
  const secondary = formatCurrency(converted, baseCurrency);

  return (
    <span className={className}>
      {primary}
      <span className="text-muted-foreground text-xs ml-1.5">≈ {secondary}</span>
    </span>
  );
}

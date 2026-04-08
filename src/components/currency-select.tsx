import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  excludeBase?: string; // hide base currency from the list
}

export function CurrencySelect({ value, onChange, className, excludeBase }: Props) {
  const options = excludeBase
    ? SUPPORTED_CURRENCIES.filter((c) => c.code !== excludeBase)
    : SUPPORTED_CURRENCIES;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      }
    >
      {options.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}

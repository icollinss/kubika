"use client";

import { useLanguage } from "@/contexts/language-context";
import { LOCALES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 px-3 py-1.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          title={l.label}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
            locale === l.code
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>{l.flag}</span>
          <span>{l.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

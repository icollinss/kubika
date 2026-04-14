import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale, LOCALES } from "@/lib/i18n";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kubika — Business Intelligence for Africa",
  description: "Manage your business with Kubika — inventory, sales, accounting, and more.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  const validLocales = LOCALES.map((l) => l.code);
  const initialLocale: Locale = cookieLocale && validLocales.includes(cookieLocale) ? cookieLocale : "pt";

  return (
    <html
      lang={initialLocale}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { ClerkLocaleProvider } from "@/components/layout/clerk-locale-provider";
import { ConvexClientProvider } from "@/components/layout/convex-client-provider";
import Header from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return {
    title: t("appTitle"),
    description: t("appDescription"),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logos/logo-s.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClerkLocaleProvider>
            <ThemeProvider>
              <ConvexClientProvider>
                <Header />
                <main className="min-h-screen">
                  <Toaster richColors />
                  {children}
                </main>
              </ConvexClientProvider>
            </ThemeProvider>
          </ClerkLocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

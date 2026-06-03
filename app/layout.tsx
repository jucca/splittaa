import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { fiFI } from "@clerk/localizations";
import { shadcn } from "@clerk/ui/themes";
import { ConvexClientProvider } from "@/components/layout/convex-client-provider";
import Header from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Splittaa",
  description: "Helpoin tapa jakaa kulut ystävien kanssa",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logos/logo-s.png" sizes="any" />
      </head>
      <body className={`${inter.className}`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          localization={fiFI}
          appearance={{ theme: shadcn }}
        >
          <ThemeProvider>
            <ConvexClientProvider>
              <Header />
              <main className="min-h-screen">
                <Toaster richColors />
                {children}
              </main>
            </ConvexClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

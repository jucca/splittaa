"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { History, LayoutDashboard, Settings } from "lucide-react";
import { InboxNavLink } from "@/components/layout/inbox-nav-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { BarLoader } from "react-spinners";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Header() {
  const { isLoading } = useStoreUser();
  const path = usePathname();
  const t = useTranslations("nav");

  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={"/logos/logo.png"}
            alt={t("logoAlt")}
            width={200}
            height={60}
            className="h-11 w-auto object-contain"
          />
        </Link>

        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              {t("features")}
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              {t("howItWorks")}
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Authenticated>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-2 hover:text-green-600 hover:border-green-600 transition"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("dashboard")}
                </Button>
                <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="sr-only">{t("dashboard")}</span>
                </Button>
              </Link>

              <InboxNavLink />

              <Link href="/toiminta">
                <Button
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-2 hover:text-green-600 hover:border-green-600 transition"
                >
                  <History className="h-4 w-4" />
                  {t("activity")}
                </Button>
                <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                  <History className="h-4 w-4" />
                  <span className="sr-only">{t("activity")}</span>
                </Button>
              </Link>

              <Link href="/asetukset">
                <Button
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-2 hover:text-green-600 hover:border-green-600 transition"
                >
                  <Settings className="h-4 w-4" />
                  {t("settings")}
                </Button>
                <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">{t("settings")}</span>
                </Button>
              </Link>

              <div className="flex items-center gap-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "shadow-xl",
                      userPreviewMainIdentifier: "font-semibold",
                    },
                  }}
                  afterSignOutUrl="/"
                />
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>
          </Authenticated>

          <Unauthenticated>
            <div className="flex items-center gap-4">
              <SignInButton>
                <Button variant="ghost">{t("signIn")}</Button>
              </SignInButton>

              <SignUpButton>
                <Button className="bg-green-600 hover:bg-green-700 border-none">
                  {t("getStarted")}
                </Button>
              </SignUpButton>

              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </Unauthenticated>
        </div>
      </nav>
      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
}

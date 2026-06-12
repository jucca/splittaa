"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { History, LayoutDashboard, Settings } from "lucide-react";
import { InboxNavLink } from "@/components/layout/inbox-nav-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { GuideAssistant } from "@/components/features/guide/guide-assistant";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HoverHint } from "@/components/ui/hover-hint";
import type { LucideIcon } from "lucide-react";

function NavIconLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center">
      <Button
        variant="outline"
        className="hidden md:inline-flex h-10 items-center gap-2 hover:text-green-600 hover:border-green-600 transition"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
      <span className="md:hidden inline-flex items-center">
        <HoverHint label={label} side="bottom">
          <Button variant="ghost" className="w-10 h-10 p-0">
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </HoverHint>
      </span>
    </Link>
  );
}

export default function Header() {
  useStoreUser();
  const path = usePathname();
  const t = useTranslations("nav");

  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.svg"
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
              <NavIconLink
                href="/dashboard"
                icon={LayoutDashboard}
                label={t("dashboard")}
              />

              <InboxNavLink />

              <NavIconLink
                href="/toiminta"
                icon={History}
                label={t("activity")}
              />

              <NavIconLink
                href="/asetukset"
                icon={Settings}
                label={t("settings")}
              />

              <div className="flex items-center gap-3 shrink-0">
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
                <div className="flex items-center gap-1 shrink-0">
                  <GuideAssistant />
                  <LanguageSwitcher />
                </div>
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
    </header>
  );
}

import {
  Bell,
  CreditCard,
  PieChart,
  Receipt,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

export type LandingFeatureKey =
  | "groupExpenses"
  | "smartSettlements"
  | "spendingAnalysis"
  | "paymentReminders"
  | "splitMethods"
  | "realtimeUpdates";

export type LandingStepKey = "step1" | "step2" | "step3";

export type LandingTestimonialKey = "annikki" | "luigi" | "antti";

export const LANDING_FEATURES: {
  key: LandingFeatureKey;
  Icon: LucideIcon | (() => ReactElement);
  bg: string;
  color: string;
}[] = [
  {
    key: "groupExpenses",
    Icon: Users,
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    key: "smartSettlements",
    Icon: CreditCard,
    bg: "bg-teal-100",
    color: "text-teal-600",
  },
  {
    key: "spendingAnalysis",
    Icon: PieChart,
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    key: "paymentReminders",
    Icon: Bell,
    bg: "bg-amber-100",
    color: "text-amber-600",
  },
  {
    key: "splitMethods",
    Icon: Receipt,
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    key: "realtimeUpdates",
    Icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 14v8M15 14v8M9 2v6M15 2v6" />
      </svg>
    ),
    bg: "bg-teal-100",
    color: "text-teal-600",
  },
];

export const LANDING_STEPS: { key: LandingStepKey; label: string }[] = [
  { key: "step1", label: "1" },
  { key: "step2", label: "2" },
  { key: "step3", label: "3" },
];

export const LANDING_TESTIMONIALS: {
  key: LandingTestimonialKey;
  name: string;
  image: string;
}[] = [
  { key: "annikki", name: "Annikki Komulainen", image: "/testimonials/ansku.png" },
  { key: "luigi", name: "Luigi Bolognese", image: "/testimonials/luigi.jpg" },
  { key: "antti", name: "Antti Kukkonen", image: "/testimonials/antti.png" },
];

# Motion.dev evaluation — targeted UX animation (design)

**Date:** 2026-06-11  
**Status:** Approved (brainstorming)  
**Decision:** Adopt [Motion](https://motion.dev/) **narrowly** (Approach 2). Do not adopt as a global animation layer.

## Context

Splittaa is a Finnish expense-splitting app (Next.js 16, React 19, Tailwind 4, shadcn/Radix, Convex). Animation today:

- CSS `transition-*` on hover/focus
- `tw-animate-css` via Radix (`animate-in` / `animate-out` on dialogs, popovers, tooltips)
- Custom opacity crossfade on landing hero carousel
- `react-spinners` `BarLoader` for loading across ~11 routes/components

Design constraints (`docs/DESIGN.md`):

- **Clarity over cleverness** — users must read balances without distraction
- **`prefers-reduced-motion`** for non-essential animation
- **Human-owned UX** until frontend quality ≥ B (`docs/QUALITY_SCORE.md`)

## Problem statement

User-reported pain (subtle motion only):

| Pain | Area | Root cause |
|------|------|------------|
| Lists pop in/out | Expenses, activity, inbox | Convex reactive updates unmount DOM instantly; CSS cannot animate exit |
| Flat loading | Dashboard, contacts, groups, inbox, … | `BarLoader` or plain text instead of layout skeletons |
| Landing feel | Hero carousel | Adequate CSS today; optional polish only |
| Dashboard continuity | Balances, charts | No skeleton layout; stats swap without visual handoff |

## Approaches considered

| Approach | Summary | Verdict |
|----------|---------|---------|
| **1 — CSS + Skeleton only** | No new dependency; Skeletons fix loading | Does not fix list exit animation |
| **2 — Targeted Motion + Skeletons** | `LazyMotion` + `AnimatePresence` on lists; Skeletons elsewhere | **Recommended** |
| **3 — Full Motion adoption** | Layout animations, route transitions, expressive marketing | Rejected — conflicts with subtle-only + trust UX |

## Scope

### In scope (Phase 1)

| Area | Treatment | Motion? |
|------|-----------|---------|
| **Lists** — expenses, activity, inbox | Opacity fade in/out on add/remove, ≤ 150 ms | Yes — `AnimatePresence` |
| **Loading** — all current `BarLoader` sites | Layout-matched shadcn Skeleton | No |
| **Landing** — hero carousel | Keep CSS opacity crossfade; Motion only if human review finds it insufficient | Maybe |
| **Dashboard** — stats + charts | Skeleton while loading; cards `animate-in fade-in duration-200` on first render | No layout/number animations |

### Out of scope

- Page/route transitions or shared-element animations
- Drag gestures, spring physics, layout shifts (`domMax`)
- Animated balance counters or chart data transitions
- Motion inside `components/ui/` Radix primitives (dialog/tooltip animations stay)
- Replacing `tw-animate-css` or sonner toasts

### Principles

1. **Opacity-only** for list motion — no x/y translation on data lists.
2. **`MotionConfig reducedMotion="user"`** at provider level.
3. **Durations ≤ 200 ms** for data UI; landing may use up to 300 ms.
4. **Human UX sign-off** required before merge (frontend grade C).

## Architecture

### Dependency

```bash
npm install motion
```

Import from `motion/react` (not legacy `framer-motion` package name).

### Provider

New file: `components/layout/motion-provider.tsx`

```tsx
"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.15 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```

Mount alongside existing Clerk/Convex providers in the client providers shell.

- **`LazyMotion` + `strict`** — enforces `m` component (~15 KB gzipped) instead of full `motion` (~34 KB).
- **`domAnimation`** — animations, variants, exit animations, tap/hover/focus only; no pan/drag/layout.
- **`reducedMotion="user"`** — respects OS setting; transform/layout animations disabled when reduced motion is on.

### Layer boundaries

| Layer | Role |
|-------|------|
| `components/layout/motion-provider.tsx` | App-wide Motion config |
| `components/ui/animated-list.tsx` | `AnimatePresence` + `m.li` opacity wrapper — no Convex, no feature imports |
| `components/ui/skeleton.tsx` | shadcn Skeleton primitive (add via CLI if missing) |
| `components/features/*/` | Use `AnimatedList` / `AnimatedListItem`; never import `motion/react` directly |

### List wrapper API

```tsx
// components/ui/animated-list.tsx — presentational only
"use client";

import { AnimatePresence, m } from "motion/react";

export function AnimatedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={className}>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </ul>
  );
}

export function AnimatedListItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <m.li
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </m.li>
  );
}
```

### First integration targets

1. `components/features/expenses/expense-list.tsx`
2. `components/features/activity/activity-feed.tsx`
3. `components/features/inbox/inbox-feed.tsx`

Each row keeps existing card/content; only the list wrapper changes. Requires stable keys (`item._id` or existing id field).

### Skeleton migration

Replace all `BarLoader` usages. Known sites (2026-06-11):

- `app/(main)/dashboard/page.tsx`
- `app/(main)/contacts/page.tsx`
- `app/(main)/groups/[id]/page.tsx`
- `app/(main)/person/[id]/page.tsx`
- `app/(main)/settlements/[type]/[id]/page.tsx`
- `app/(main)/tyopoyta/[id]/page.tsx`
- `app/join/[token]/page.tsx`
- `components/features/expenses/group-selector.tsx`
- `components/features/inbox/inbox-feed.tsx`
- `components/layout/header.tsx`
- `components/layout/profile-gate.tsx`

Remove `react-spinners` from `package.json` when no longer referenced.

### Dashboard & landing

| Surface | Pattern |
|---------|---------|
| Dashboard cards | Skeleton grid while `useQuery === undefined`; cards use Tailwind `animate-in fade-in duration-200` on first render |
| `spending-charts.tsx` | Chart-area Skeleton; no animated data transitions |
| Hero carousel | Keep CSS opacity crossfade in `hero-carousel.tsx`; Motion optional after human review |

## Accessibility

- Global `MotionConfig reducedMotion="user"`.
- List animations are opacity-only — aligned with `docs/DESIGN.md` motion baseline.
- Carousel autoplay behavior unchanged (already pauses on hover/focus).

## Testing

| Check | Approach |
|-------|----------|
| Unit tests | Not required — wrappers are presentational |
| E2E | Set `prefers-reduced-motion: reduce` in Playwright config to reduce timing flakes on list exit |
| Visual | Human sign-off on three list surfaces + dashboard skeleton layout |
| CI | `npm run verify` — no new lint rules |

## Rollout (3 PRs)

1. **Skeletons only** — replace `BarLoader`; add shadcn Skeleton; remove `react-spinners` if unused. No Motion dependency.
2. **Motion infra + one list** — `MotionProvider` + `AnimatedList`; prove on `expense-list`.
3. **Remaining lists + dashboard fade-in** — activity, inbox; dashboard card `animate-in`.

Each PR requires human UX review before merge.

## Documentation updates

When implementing, update:

- `docs/FRONTEND.md` — Motion provider, `AnimatedList` pattern, Skeleton convention, `prefers-reduced-motion` note
- `docs/DESIGN.md` — reference Motion as approved for list opacity fades only (optional one-liner under Visual system)

## Related

- [Motion React docs](https://motion.dev/docs/react)
- [Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size)
- [useReducedMotion / MotionConfig](https://motion.dev/docs/react-motion-config)
- `docs/DESIGN.md` — product principles, a11y baseline
- `docs/FRONTEND.md` — client conventions

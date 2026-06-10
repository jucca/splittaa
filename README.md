# Splittaa

Finnish expense-splitting app for shared expenses, groups, settlements, and contacts. Made during the [DNA's](https://www.dna.fi) summer trainee hackathon 2026. 

**Stack:** Next.js 15 · React 19 · Convex · Clerk · Tailwind / shadcn · Inngest

---

## Quick start (local)

```bash
cp .env.example .env
# Fill CONVEX_*, CLERK_* (see .env.example)
npm install

# Terminal 1
npm run dev

# Terminal 2
npx convex dev
```

Open [http://localhost:3000](http://localhost:3000)

More detail: [docs/RELIABILITY.md](docs/RELIABILITY.md)

---

## Commands


| Command                 | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Next.js dev server                         |
| `npx convex dev`        | Convex sync (run alongside dev)            |
| `npm run verify`        | Lint, docs, typecheck, unit + convex tests |
| `npm run generate:docs` | Regenerate schema doc + doc checks         |


---

## Deploy to Vercel

Production guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

Summary:

1. Add `CONVEX_DEPLOY_KEY` and Clerk/Convex env vars on Vercel.
2. Build uses `npm run vercel-build` (Convex deploy + `next build`).
3. Point Inngest to `https://<your-domain>/api/inngest`.

---

## Agent / contributor docs

Start with **[AGENTS.md](AGENTS.md)** — architecture, rules, and doc map.
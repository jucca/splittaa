import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Id } from "@/convex/_generated/dataModel";
import { requireConvexUrl } from "@/lib/config/env";
import { inngest } from "./client";

const convex = new ConvexHttpClient(requireConvexUrl());

/* Gemini model (same as before) */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const spendingInsights = inngest.createFunction(
  { name: "Generate Spending Insights", id: "generate-spending-insights" },
  { cron: "0 8 1 * *" }, // 1 st of every month at 08:00
  async ({ step }) => {
    /* ─── 1. Pull users with expenses this month ────────────────────── */
    const users = (await step.run("Fetch users with expenses", async () => {
      return await convex.action(api.inngestBridge.getUsersWithExpenses, {
        secret: process.env.INNGEST_CONVEX_SECRET ?? "",
      });
    })) as { _id: string; name: string; email: string }[];

    /* ─── 2. Iterate users & send insight email ─────────────────────── */
    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const user of users) {
      /* a. Pull last-month expenses (skip if none) */
      const expenses = (await step.run(`Expenses · ${user._id}`, () =>
        convex.action(api.inngestBridge.getUserMonthlyExpenses, {
          secret: process.env.INNGEST_CONVEX_SECRET ?? "",
          userId: user._id as Id<"users">,
        })
      )) as { amount: number; category?: string }[];
      if (!expenses.length) continue;

      /* b. Build JSON blob for the prompt */
      const expenseData = JSON.stringify({
        expenses,
        totalSpent: expenses.reduce(
          (sum: number, e: { amount: number }) => sum + e.amount,
          0
        ),
        categories: expenses.reduce(
          (cats: Record<string, number>, e: { amount: number; category?: string }) => {
            const key = e.category ?? "uncategorised";
            cats[key] = (cats[key] ?? 0) + e.amount;
            return cats;
          },
          {}
        ),
      });

      /* c. Prompt + AI call using step.ai.wrap (retry-aware) */
      const prompt = `
Toimi talousanalyytikkona, tarkastele käyttäjän kulutustietoja viime kuulta ja anna oivaltavia havaintoja sekä ehdotuksia.
Keskity kulutustottumuksiin, kategorioiden jakaumaan ja konkreettisiin neuvoihin talouden hallintaan.
Käytä ystävällistä ja kannustavaa sävyä. Muotoile vastaus HTML-muodossa sähköpostia varten.

Käyttäjän kulutustiedot:
${expenseData}

Anna analyysi seuraavissa osioissa:
1. Kuukausikatsaus
2. Suurimmat kulukategoriat
3. Poikkeavat kulutustottumukset (jos sellaisia on)
4. Säästömahdollisuudet
5. Suositukset ensi kuulle
      `.trim();

      try {
        const aiResponse = await step.ai.wrap(
          "gemini",
          async (p) => model.generateContent(p),
          prompt
        );

        const firstPart = aiResponse.response.candidates?.[0]?.content.parts[0];
        const htmlBody =
          firstPart && "text" in firstPart ? (firstPart.text ?? "") : "";

        /* d. Send the email */
        await step.run(`Email · ${user._id}`, () =>
          convex.action(api.email.sendEmail, {
            secret: process.env.INNGEST_CONVEX_SECRET ?? "",
            to: user.email,
            subject: "Kuukausittainen kuluanalyysisi",
            html: `
              <h1>Kuukausittaiset talousoivalluksesi</h1>
              <p>Hei ${user.name},</p>
              <p>Tässä on henkilökohtainen kulutusanalyysisi viime kuulta:</p>
              ${htmlBody}
            `,
          })
        );

        results.push({ userId: user._id, success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          userId: user._id,
          success: false,
          error: message,
        });
      }
    }

    /* ─── 3. Summary for the cron log ───────────────────────────────── */
    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
);

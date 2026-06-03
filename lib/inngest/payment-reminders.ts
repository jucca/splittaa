import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { inngest } from "./client";
import { requireConvexUrl } from "@/lib/config/env";
import { formatCurrency } from "@/lib/utils";
import { getSiteUrl } from "@/lib/config/site-url";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(requireConvexUrl());

type ReminderUser = {
  _id: string;
  name: string;
  email: string;
  iOwe: { name: string; amount: number; since: number }[];
  owedToMe: { name: string; amount: number; since: number }[];
};

function debtTableRows(
  rows: { name: string; amount: number; since: number }[],
  label: string
): string {
  if (!rows.length) return "";
  const body = rows
    .map(
      (d) => `
        <tr>
          <td style="padding:4px 8px;">${d.name}</td>
          <td style="padding:4px 8px;">${formatCurrency(d.amount)}</td>
          <td style="padding:4px 8px;">${label}</td>
        </tr>
      `
    )
    .join("");
  return `
    <table cellspacing="0" cellpadding="0" border="1" style="border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr><th>Henkilö</th><th>Summa</th><th>Huom.</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

export const paymentReminders = inngest.createFunction(
  { id: "send-payment-reminders", name: "Payment reminders" },
  { cron: "0 10 * * *" },
  async ({ step }) => {
    const now = Date.now();
    const siteUrl = getSiteUrl();

    const users = (await step.run("fetch-reminder-candidates", () =>
      convex.action(api.inngestBridge.getUsersForPaymentReminders, {
        secret: process.env.INNGEST_CONVEX_SECRET ?? "",
        now,
      })
    )) as ReminderUser[];

    const results = await step.run("send-emails", async () => {
      return Promise.all(
        users.map(async (u) => {
          const iOweSection =
            u.iOwe.length > 0
              ? `
                <h3>Sinä olet velkaa</h3>
                ${debtTableRows(u.iOwe, "Avoin velka")}
              `
              : "";

          const owedSection =
            u.owedToMe.length > 0
              ? `
                <h3>Sinulle ollaan velkaa</h3>
                ${debtTableRows(
                  u.owedToMe,
                  "Velka on ollut avoinna jo hetken"
                )}
              `
              : "";

          if (!iOweSection && !owedSection) {
            return { userId: u._id, skipped: true as const };
          }

          const html = `
            <h2>Splittaa – saldomuistutus</h2>
            <p>Hei ${u.name},</p>
            <p>Tässä yhteenveto avoimista henkilökohtaisista saldoistasi:</p>
            ${iOweSection}
            ${owedSection}
            <p>
              <a href="${siteUrl}/dashboard">Avaa Splittaa</a> ja tasaa tilit tai muistuta kaveria.
              Voit muuttaa muistutuksen tiheyttä <a href="${siteUrl}/asetukset">asetuksista</a>.
            </p>
            <p>— Splittaa</p>
          `;

          try {
            await convex.action(api.email.sendEmail, {
              secret: process.env.INNGEST_CONVEX_SECRET ?? "",
              to: u.email,
              subject: "Muistutus avoimista saldoista Splittaassa",
              html,
            });

            await convex.action(api.inngestBridge.markReminderSent, {
              secret: process.env.INNGEST_CONVEX_SECRET ?? "",
              userId: u._id as Id<"users">,
              sentAt: now,
            });

            return { userId: u._id, success: true as const };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return { userId: u._id, success: false as const, error: message };
          }
        })
      );
    });

    return {
      candidates: users.length,
      processed: results.length,
      successes: results.filter(
        (r) => "success" in r && r.success === true
      ).length,
      failures: results.filter(
        (r) => "success" in r && r.success === false
      ).length,
    };
  }
);

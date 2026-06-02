import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { inngest } from "./client";
import { requireConvexUrl } from "@/lib/config/env";
import { formatCurrency } from "@/lib/utils";

const convex = new ConvexHttpClient(requireConvexUrl());

export const paymentReminders = inngest.createFunction(
  { id: "send-payment-reminders" },
  { cron: "0 10 * * *" },
  async ({ step }) => {
    const users = (await step.run("fetch‑debts", () =>
      convex.action(api.inngestBridge.getUsersWithOutstandingDebts, {
        secret: process.env.INNGEST_CONVEX_SECRET ?? "",
      })
    )) as {
      _id: string;
      name: string;
      email: string;
      debts: { name: string; amount: number }[];
    }[];

    const results = await step.run("send‑emails", async () => {
      return Promise.all(
        users.map(async (u: { _id: string; name: string; email: string; debts: { name: string; amount: number }[] }) => {
          const rows = u.debts
            .map(
              (d: { name: string; amount: number }) => `
                <tr>
                  <td style="padding:4px 8px;">${d.name}</td>
                  <td style="padding:4px 8px;">${formatCurrency(d.amount)}</td>
                </tr>
              `
            )
            .join("");

          if (!rows) return { userId: u._id, skipped: true };

          const html = `
            <h2>Splittaa – maksumuistutus</h2>
            <p>Hei ${u.name}, sinulla on seuraavat avoimet velat:</p>
            <table cellspacing="0" cellpadding="0" border="1" style="border-collapse:collapse;">
              <thead>
                <tr><th>Kenelle</th><th>Summa</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p>Tasaa tilit pian. Kiitos!</p>
          `;

          try {
            await convex.action(api.email.sendEmail, {
              secret: process.env.INNGEST_CONVEX_SECRET ?? "",
              to: u.email,
              subject: "Sinulla on avoimia maksuja Splittaa-sovelluksessa",
              html,
            });
            return { userId: u._id, success: true };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return { userId: u._id, success: false, error: message };
          }
        })
      );
    });

    return {
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

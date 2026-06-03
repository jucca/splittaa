import { ConvexError, v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { Resend } from "resend";
import { assertAutomationSecret } from "./_lib/automation";

export const sendEmail = action({
  args: {
    secret: v.string(),
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    assertAutomationSecret(args.secret);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        code: "CONFIG",
        message: "RESEND_API_KEY is not configured",
      });
    }

    const resend = new Resend(apiKey);

    try {
      const result = await resend.emails.send({
        from: "Splittaa <onboarding@resend.dev>",
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });

      return { success: true as const, id: result.data?.id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to send email:", error);
      return { success: false as const, error: message };
    }
  },
});

export const sendGroupInviteEmail = internalAction({
  args: {
    to: v.string(),
    recipientName: v.string(),
    inviterName: v.string(),
    groupName: v.string(),
    joinUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set; skipping group invite email");
      return { success: false as const, skipped: true as const };
    }

    const resend = new Resend(apiKey);
    const subject = `Kutsu ryhmään: ${args.groupName}`;
    const html = `
      <p>Hei ${args.recipientName},</p>
      <p><strong>${args.inviterName}</strong> kutsui sinut Splittaa-ryhmään <strong>${args.groupName}</strong>.</p>
      <p><a href="${args.joinUrl}">Hyväksy tai hylkää kutsu</a></p>
      <p>Kutsu on voimassa 7 päivää.</p>
      <p>— Splittaa</p>
    `;
    const text = `Hei ${args.recipientName},\n\n${args.inviterName} kutsui sinut ryhmään ${args.groupName}.\n\nAvaa kutsu: ${args.joinUrl}\n\nKutsu on voimassa 7 päivää.`;

    try {
      const result = await resend.emails.send({
        from: "Splittaa <onboarding@resend.dev>",
        to: args.to,
        subject,
        html,
        text,
      });
      return { success: true as const, id: result.data?.id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to send group invite email:", error);
      return { success: false as const, error: message };
    }
  },
});

export const sendDebtRequestEmail = internalAction({
  args: {
    to: v.string(),
    debtorName: v.string(),
    creditorName: v.string(),
    amount: v.number(),
    groupName: v.union(v.string(), v.null()),
    message: v.union(v.string(), v.null()),
    actionUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set; skipping debt request email");
      return { success: false as const, skipped: true as const };
    }

    const resend = new Resend(apiKey);
    const amountFormatted = new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(args.amount);
    const context = args.groupName
      ? ` ryhmässä <strong>${args.groupName}</strong>`
      : "";
    const messageBlock = args.message
      ? `<p><strong>Viesti:</strong> ${args.message}</p>`
      : "";

    const subject = `Velkapyyntö: ${args.creditorName} pyytää ${amountFormatted}`;
    const html = `
      <p>Hei ${args.debtorName},</p>
      <p><strong>${args.creditorName}</strong> lähetti sinulle velkapyynnön${context}: <strong>${amountFormatted}</strong>.</p>
      ${messageBlock}
      <p>Tämä on erillinen pyyntö automaattisesta saldomuistutuksesta.</p>
      <p><a href="${args.actionUrl}">Avaa Splittaa ja tasaa tilit</a></p>
      <p>— Splittaa</p>
    `;
    const text = `Hei ${args.debtorName},\n\n${args.creditorName} pyytää sinua maksamaan ${amountFormatted}${args.groupName ? ` ryhmässä ${args.groupName}` : ""}.${args.message ? `\n\nViesti: ${args.message}` : ""}\n\nAvaa: ${args.actionUrl}`;

    try {
      const result = await resend.emails.send({
        from: "Splittaa <onboarding@resend.dev>",
        to: args.to,
        subject,
        html,
        text,
      });
      return { success: true as const, id: result.data?.id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to send debt request email:", error);
      return { success: false as const, error: message };
    }
  },
});

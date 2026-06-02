import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
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

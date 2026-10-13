import { createServerFn } from "@tanstack/react-start";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

// Public contact form: sends the message to the site owner via the
// 'help-request' template, whose recipient is fixed in the template registry.
// The browser never sees the destination address.
export const sendHelpRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; message: string; page?: string }) => {
    if (!d?.message?.trim()) throw new Error("Please write a message.");
    if (d.message.length > 4000) throw new Error("Message is too long.");
    return d;
  })
  .handler(async ({ data }) => {
    const result = await sendTemplateEmail("help-request", "site-owner", {
      templateData: {
        fromName: data.name?.trim().slice(0, 120) || "Not given",
        fromEmail: data.email?.trim().slice(0, 200) || "Not given",
        message: data.message.trim(),
        page: data.page?.slice(0, 200),
      },
      idempotencyKey: `help-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    });
    if (!result.sent) throw new Error("Couldn't send right now — please try again in a few minutes.");
    return { ok: true };
  });

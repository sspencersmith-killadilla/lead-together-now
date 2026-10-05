import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

// Daily job: email each leader one list of overdue 1-on-1s. Called by the scheduler with a shared secret.
export const Route = createFileRoute("/api/public/cron/overdue-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LOVABLE_CRON_SECRET"] ?? "";
        const got = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        const a = Buffer.from(got);
        const b = Buffer.from(secret);
        if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const today = new Date().toISOString().slice(0, 10);
        const origin = process.env["SITE_URL"] ?? new URL(request.url).origin;

        const { data: pairings } = await supabaseAdmin.from("pairings").select("id, leader_id, report_id, cadence_days, created_at").eq("active", true);
        if (!pairings?.length) return Response.json({ sent: 0 });
        const { data: meetings } = await supabaseAdmin.from("meetings").select("pairing_id, held_on").in("pairing_id", pairings.map((p) => p.id)).lte("held_on", today);
        const last: Record<string, string> = {};
        for (const m of meetings ?? []) { const c = last[m.pairing_id]; if (!c || m.held_on > c) last[m.pairing_id] = m.held_on; }

        const byLeader: Record<string, { reportId: string; days: number }[]> = {};
        for (const p of pairings) {
          const since = last[p.id] ?? p.created_at.slice(0, 10);
          const days = Math.floor((Date.parse(today) - Date.parse(since)) / 86400000);
          if (days > p.cadence_days) (byLeader[p.leader_id] ??= []).push({ reportId: p.report_id, days });
        }
        const ids = [...new Set(Object.entries(byLeader).flatMap(([l, rs]) => [l, ...rs.map((r) => r.reportId)]))];
        if (!ids.length) return Response.json({ sent: 0 });
        const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name, email, reminder_emails, last_reminder_on").in("id", ids);
        const prof = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

        let sent = 0;
        for (const [leaderId, rows] of Object.entries(byLeader)) {
          const me = prof[leaderId];
          if (!me?.email || !me.reminder_emails || me.last_reminder_on === today) continue;
          let r: { sent: boolean } = { sent: false };
          try { r = await sendTemplateEmail("overdue-reminder", me.email, {
            templateData: {
              name: me.display_name?.split(" ")[0],
              people: rows.map((x) => ({ name: prof[x.reportId]?.display_name ?? "Someone", days: x.days })),
              link: `${origin}/home`,
            },
            idempotencyKey: `overdue-${leaderId}-${today}`,
          }); } catch (e) { console.error("reminder failed", leaderId, e); }
          if (r.sent) {
            sent++;
            await supabaseAdmin.from("profiles").update({ last_reminder_on: today }).eq("id", leaderId);
          }
        }
        return Response.json({ sent });
      },
    },
  },
});

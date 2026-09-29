import { supabase } from "@/integrations/supabase/client";

export type Pairing = {
  id: string;
  workspace_id: string;
  leader_id: string;
  report_id: string;
  kind: string;
  cadence_days: number;
  template_id: string | null;
  active: boolean;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  leader_prompts: string[];
  report_prompts: string[];
  published: boolean;
  version: number;
};

export function asList(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysSince(d: string) {
  const then = new Date(d + "T12:00:00").getTime();
  return Math.floor((Date.now() - then) / 86400000);
}

export function relationLabel(p: Pairing, me: string) {
  if (p.kind === "partner") return "Coaching partner";
  return p.leader_id === me ? "You lead" : "Leads you";
}

export async function fetchTemplates(workspaceId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    ...t,
    leader_prompts: asList(t.leader_prompts),
    report_prompts: asList(t.report_prompts),
  }));
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Creates (or reuses) a 1-on-1 for a pairing on a given date with a given template.
// A pairing can have many 1-on-1s, each with its own template.
export async function startMeeting(
  pairing: Pairing,
  userId: string,
  templates: Template[],
  opts: { templateId?: string | null | undefined; date?: string | undefined } = {},
) {
  const published = templates.filter((t) => t.published);
  const t =
    published.find((x) => x.id === (opts.templateId ?? pairing.template_id)) ?? published[0];
  const date = opts.date ?? todayISO();
  // Reuse an open 1-on-1 on the same day with the same template so both people land in the same one.
  let q = supabase
    .from("meetings")
    .select("id")
    .eq("pairing_id", pairing.id)
    .eq("status", "open")
    .eq("held_on", date);
  q = t?.name ? q.eq("template_name", t.name) : q.is("template_name", null);
  const { data: existing } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      pairing_id: pairing.id,
      workspace_id: pairing.workspace_id,
      created_by: userId,
      held_on: date,
      template_name: t?.name ?? null,
      leader_prompts: t?.leader_prompts ?? [],
      report_prompts: t?.report_prompts ?? [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

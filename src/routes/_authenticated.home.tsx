import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { daysSince, fetchTemplates, fmtDate, relationLabel, startMeeting, todayISO, type Pairing, type Template } from "@/lib/coaching";
import { AddToCalendar } from "@/components/AddToCalendar";
import { nextSlot } from "@/lib/calendar";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Your 1-on-1s — Tandem" }, { name: "description", content: "Your people, meetings and open action items." }] }),
  component: Home,
});

function Home() {
  const { workspace, userId, memberName } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const pairings = useQuery({
    queryKey: ["my-pairings", workspace.id, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pairings")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("active", true)
        .or(`leader_id.eq.${userId},report_id.eq.${userId}`);
      if (error) throw error;
      return data as Pairing[];
    },
  });
  const ids = (pairings.data ?? []).map((p) => p.id);

  const lastMeetings = useQuery({
    queryKey: ["last-meetings", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("id, pairing_id, held_on").in("pairing_id", ids).lte("held_on", todayISO()).order("held_on", { ascending: false });
      const map: Record<string, { id: string; held_on: string }> = {};
      for (const m of data ?? []) if (!map[m.pairing_id]) map[m.pairing_id] = m;
      return map;
    },
  });

  const actions = useQuery({
    queryKey: ["open-actions", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("action_items").select("*").in("pairing_id", ids).is("done_at", null).order("due_date", { nullsFirst: false });
      return data ?? [];
    },
  });

  const upcoming = useQuery({
    queryKey: ["upcoming-meetings", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("id, pairing_id, held_on, template_name").in("pairing_id", ids).gt("held_on", todayISO()).order("held_on");
      return data ?? [];
    },
  });

  const templates = useQuery({ queryKey: ["templates", workspace.id], queryFn: () => fetchTemplates(workspace.id) });

  const start = useMutation({
    mutationFn: (v: { p: Pairing; templateId?: string; date?: string }) =>
      startMeeting(v.p, userId, templates.data ?? [], { templateId: v.templateId, date: v.date }),
    onSuccess: (id) => navigate({ to: "/meetings/$id", params: { id } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("action_items").update({ done_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["open-actions"] }),
  });

  const other = (p: Pairing) => (p.leader_id === userId ? p.report_id : p.leader_id);

  return (
    <div className="space-y-10">
    {(workspace.welcome_headline || workspace.welcome_tagline) && (
      <div className="rounded-2xl border border-border bg-card/60 p-8">
        {workspace.welcome_headline && <h2 className="font-serif text-3xl italic">{workspace.welcome_headline}</h2>}
        {workspace.welcome_tagline && <p className="mt-2 text-muted-foreground">{workspace.welcome_tagline}</p>}
      </div>
    )}
    <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-3xl">Your 1-on-1s</h1>
        {pairings.isLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : !pairings.data?.length ? (
          <div className="mt-6 rounded-lg border border-dashed p-8">
            <p className="text-muted-foreground">No one to meet with yet.</p>
            <Link to="/people" className="mt-3 inline-block font-medium text-primary hover:underline">
              Add your first person →
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y rounded-lg border bg-card">
            {pairings.data.map((p) => {
              const last = lastMeetings.data?.[p.id];
              const overdue = !last || daysSince(last.held_on) > p.cadence_days;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg">{memberName(other(p))}</p>
                    <p className="text-sm text-muted-foreground">
                      {relationLabel(p, userId)} · last met {last ? fmtDate(last.held_on) : "never"}
                      {overdue && <span className="ml-2 rounded bg-highlight/15 px-1.5 py-0.5 text-xs text-highlight">due</span>}
                    </p>
                  </div>
                  {last && (
                    <Link to="/meetings/$id" params={{ id: last.id }} className="text-sm text-muted-foreground hover:text-foreground">
                      Last notes
                    </Link>
                  )}
                  <Link to="/growth/$pairingId" params={{ pairingId: p.id }} className="text-sm text-muted-foreground hover:text-foreground">
                    Timeline
                  </Link>
                  <AddToCalendar
                    label="Schedule"
                    title={`1-on-1: ${memberName(p.leader_id)} & ${memberName(p.report_id)}`}
                    description={`A regular 1-on-1. Agenda and notes live in ${workspace.brand_name || "Tandem"}.`}
                    start={nextSlot(last?.held_on, p.cadence_days)}
                    repeatEveryDays={p.cadence_days}
                    allowRepeat
                  />
                  <button
                    onClick={() => start.mutate({ p })}
                    disabled={start.isPending}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Start 1-on-1
                  </button>
                  <PlanMeeting
                    p={p}
                    templates={(templates.data ?? []).filter((t) => t.published)}
                    upcoming={(upcoming.data ?? []).filter((m) => m.pairing_id === p.id)}
                    onPlan={async (templateId, date) => {
                      await startMeeting(p, userId, templates.data ?? [], { templateId, date });
                      qc.invalidateQueries({ queryKey: ["upcoming-meetings"] });
                      toast.success("1-on-1 planned");
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside>
        <h2 className="text-xl">Upcoming 1-on-1s</h2>
        {!upcoming.data?.length ? (
          <p className="mt-4 mb-8 text-sm text-muted-foreground">Nothing planned yet. Use “+ Plan a future 1-on-1” under a person to add one.</p>
        ) : (
          <ul className="mt-4 mb-8 space-y-3">
            {upcoming.data.map((m) => {
              const p = pairings.data?.find((x) => x.id === m.pairing_id);
              return (
                <li key={m.id}>
                  <Link to="/meetings/$id" params={{ id: m.id }} className="block rounded-md border bg-card p-3 text-sm hover:border-primary">
                    <p className="font-medium">{fmtDate(m.held_on)} · {p ? memberName(other(p)) : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.template_name ?? "No template"} · prepare agenda →</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <h2 className="text-xl">Open action items</h2>
        {!actions.data?.length ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing open. Nice.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {actions.data.map((a) => (
              <li key={a.id} className="flex gap-3 rounded-md border bg-card p-3 text-sm">
                <input type="checkbox" className="mt-1 accent-primary" onChange={() => toggle.mutate(a.id)} />
                <div>
                  <p>{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {memberName(a.owner_id)}
                    {a.due_date && ` · due ${fmtDate(a.due_date)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
    </div>
  );
}

const sel = "rounded-md border border-input bg-background px-2 py-1.5 text-sm";

function PlanMeeting({
  p,
  templates,
  upcoming,
  onPlan,
}: {
  p: Pairing;
  templates: Template[];
  upcoming: { id: string; held_on: string; template_name: string | null }[];
  onPlan: (templateId: string, date: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(p.template_id ?? templates[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="w-full">
      {upcoming.length > 0 && (
        <ul className="mb-2 space-y-1 text-sm">
          {upcoming.map((m) => (
            <li key={m.id}>
              <Link to="/meetings/$id" params={{ id: m.id }} className="text-muted-foreground hover:text-foreground">
                Planned {fmtDate(m.held_on)} · {m.template_name ?? "No template"} → prepare agenda
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-medium text-primary hover:underline">
          + Plan a future 1-on-1
        </button>
      ) : (
        <form
          className="flex flex-wrap items-end gap-2 rounded-md border bg-background/60 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!date || !templateId) return;
            setBusy(true);
            try {
              await onPlan(templateId, date);
              setDate("");
              setOpen(false);
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Template</span>
            <select className={sel} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Date</span>
            <input type="date" min={todayISO()} className={sel} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <button disabled={busy || !date} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            Plan
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Cancel</button>
          <p className="w-full text-xs text-muted-foreground">Plan as many as you like, each with its own template. Both of you can add agenda topics ahead of time.</p>
        </form>
      )}
    </div>
  );
}

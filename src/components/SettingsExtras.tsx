import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { deleteMyAccount, exportWorkspace } from "@/lib/account.functions";
import { todayISO } from "@/lib/coaching";

export function AccountSection() {
  const { userId } = useWorkspace();
  const del = useServerFn(deleteMyAccount);
  const prof = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => (await supabase.from("profiles").select("reminder_emails").eq("id", userId).single()).data,
  });
  async function setReminders(v: boolean) {
    const { error } = await supabase.from("profiles").update({ reminder_emails: v }).eq("id", userId);
    if (error) toast.error(error.message); else { toast.success("Saved"); prof.refetch(); }
  }
  async function remove() {
    if (prompt('This permanently deletes your account and your own notes. Type DELETE to confirm.') !== "DELETE") return;
    try {
      await del();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl">Your account</h2>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-primary" checked={prof.data?.reminder_emails ?? true} onChange={(e) => setReminders(e.target.checked)} />
        Email me when a 1-on-1 I lead is overdue (at most once a day)
      </label>
      <button onClick={remove} className="text-sm text-muted-foreground hover:text-destructive">Delete my account…</button>
    </section>
  );
}

export function AdoptionSnapshot() {
  const { workspace, members } = useWorkspace();
  const q = useQuery({
    queryKey: ["adoption", workspace.id],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const [pairs, recent, all] = await Promise.all([
        supabase.from("pairings").select("id, cadence_days, created_at").eq("workspace_id", workspace.id).eq("active", true),
        supabase.from("meetings").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).gte("held_on", since).lte("held_on", todayISO()),
        supabase.from("meetings").select("pairing_id, held_on").eq("workspace_id", workspace.id).lte("held_on", todayISO()),
      ]);
      const last: Record<string, string> = {};
      for (const m of all.data ?? []) if (!last[m.pairing_id] || m.held_on > last[m.pairing_id]) last[m.pairing_id] = m.held_on;
      const overdue = (pairs.data ?? []).filter((p) => {
        const since = last[p.id] ?? p.created_at.slice(0, 10);
        return (Date.now() - Date.parse(since)) / 86400000 > p.cadence_days;
      }).length;
      const ids = (pairs.data ?? []).map((p) => p.id);
      const actions = ids.length
        ? (await supabase.from("action_items").select("id", { count: "exact", head: true }).in("pairing_id", ids).is("done_at", null)).count ?? 0
        : 0;
      return { pairings: ids.length, recent: recent.count ?? 0, overdue, actions };
    },
  });
  const stats = [
    ["Members", members.length],
    ["Active pairings", q.data?.pairings ?? "–"],
    ["1-on-1s, last 30 days", q.data?.recent ?? "–"],
    ["Overdue pairings", q.data?.overdue ?? "–"],
    ["Open action items", q.data?.actions ?? "–"],
  ] as const;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl">Adoption</h2>
        <p className="text-sm text-muted-foreground">Counts only. You see 1-on-1s you're allowed to see; nobody's note content is shown here.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, v]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-2xl font-semibold">{v}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const ACTIONS: Record<string, string> = {
  "workspace_members.insert": "added a member",
  "workspace_members.update": "changed a member's role",
  "workspace_members.delete": "removed a member",
  "workspace_invites.insert": "sent an invitation",
  "workspace_invites.delete": "cancelled or accepted an invitation",
  "pairings.insert": "created a pairing",
  "pairings.update": "updated a pairing",
  "pairings.handoff": "handed off a pairing to a new leader",
  "pairings.delete": "removed a pairing",
  "templates.insert": "created a template",
  "templates.update": "edited a template",
  "templates.delete": "deleted a template",
  "meetings.delete": "deleted a 1-on-1",
  "workspaces.update": "changed workspace settings",
};

export function ActivityLog() {
  const { workspace, memberName } = useWorkspace();
  const [limit, setLimit] = useState(25);
  const q = useQuery({
    queryKey: ["audit", workspace.id, limit],
    queryFn: async () => (await supabase.from("audit_log").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(limit)).data ?? [],
  });
  const detail = (meta: Record<string, string>) => {
    if (meta["email"]) return meta["email"];
    if (meta["name"]) return meta["name"];
    if (meta["user_id"]) return memberName(meta["user_id"]) + (meta["role"] ? ` (${meta["role"]})` : "");
    if (meta["report_id"]) return `${memberName(meta["leader_id"] ?? "")} → ${memberName(meta["report_id"])}`;
    if (meta["held_on"]) return `session on ${meta["held_on"]}`;
    return "";
  };
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl">Activity log</h2>
        <p className="text-sm text-muted-foreground">Who changed what, and when. Entries can't be edited or deleted, and never include note text.</p>
      </div>
      {!q.data?.length ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {q.data.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3 p-3">
              <span className="w-40 shrink-0 text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
              <span className="flex-1">
                <strong className="font-medium">{e.actor_id ? memberName(e.actor_id) : "System"}</strong> {ACTIONS[e.action] ?? e.action}
                {detail(e.meta as Record<string, string>) && <span className="text-muted-foreground"> · {detail(e.meta as Record<string, string>)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {q.data && q.data.length >= limit && (
        <button onClick={() => setLimit(limit + 50)} className="text-sm text-primary hover:underline">Show more</button>
      )}
    </section>
  );
}

export function DataSection() {
  const { workspace, role, refresh } = useWorkspace();
  const exp = useServerFn(exportWorkspace);
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const data = await exp({ data: { workspaceId: workspace.id } });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${workspace.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-export-${todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }
  async function destroy() {
    const typed = prompt(`This permanently deletes "${workspace.name}" and every 1-on-1, note and action item in it. Type the workspace name to confirm.`);
    if (typed !== workspace.name) return;
    const { error } = await supabase.rpc("delete_workspace", { _ws: workspace.id });
    if (error) return toast.error(error.message);
    localStorage.removeItem("tandem.workspace");
    toast.success("Workspace deleted");
    refresh();
    window.location.href = "/home";
  }
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl">Your data</h2>
        <p className="text-sm text-muted-foreground">Download a copy of this workspace, or delete it for good. Other people's private notes are never included in exports.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={download} disabled={busy} className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium disabled:opacity-50">
          {busy ? "Preparing…" : "Export workspace data"}
        </button>
        {role === "owner" && (
          <button onClick={destroy} className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
            Delete workspace…
          </button>
        )}
      </div>
    </section>
  );
}

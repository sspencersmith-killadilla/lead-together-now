import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";

// First-run checklist for workspace owners/admins. Hidden once done or dismissed.
export function GettingStarted() {
  const { workspace, isAdmin, members, refresh } = useWorkspace();
  const counts = useQuery({
    queryKey: ["onboarding", workspace.id],
    enabled: isAdmin && !workspace.onboarding_dismissed,
    queryFn: async () => {
      const [inv, pair, meet] = await Promise.all([
        supabase.from("workspace_invites").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
        supabase.from("pairings").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
        supabase.from("meetings").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
      ]);
      return { invites: inv.count ?? 0, pairings: pair.count ?? 0, meetings: meet.count ?? 0 };
    },
  });
  if (!isAdmin || workspace.onboarding_dismissed || !counts.data) return null;
  const steps = [
    { label: "Invite someone to your workspace", done: counts.data.invites > 0 || members.length > 1, to: "/settings" as const },
    { label: "Add a person you meet with", done: counts.data.pairings > 0, to: "/people" as const },
    { label: "Plan or start your first 1-on-1", done: counts.data.meetings > 0, to: "/home" as const },
    { label: "Add your organization's name and logo", done: !!(workspace.brand_name || workspace.logo_url), to: "/settings" as const },
  ];
  const left = steps.filter((s) => !s.done).length;
  async function dismiss() {
    await supabase.from("workspaces").update({ onboarding_dismissed: true }).eq("id", workspace.id);
    refresh();
  }
  if (left === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl">Get started</h2>
          <p className="text-sm text-muted-foreground">{left} of {steps.length} steps left to set up your workspace.</p>
        </div>
        <button onClick={dismiss} className="text-sm text-muted-foreground hover:text-foreground">Dismiss</button>
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${s.done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
              {s.done ? "✓" : ""}
            </span>
            {s.done ? <span className="text-muted-foreground line-through">{s.label}</span> : <Link to={s.to} className="hover:text-accent">{s.label} →</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}

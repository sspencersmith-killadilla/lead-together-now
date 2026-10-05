import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Export everything the caller can see in a workspace. Reads run as the caller under RLS,
// so other people's private notes can never be included.
export const exportWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const ws = data.workspaceId;
    const { data: isAdmin } = await sb.rpc("has_workspace_role", { _ws: ws, _role: "admin" });
    if (!isAdmin) throw new Error("Only owners and admins can export workspace data.");
    const [workspace, members, templates, pairings, meetings] = await Promise.all([
      sb.from("workspaces").select("*").eq("id", ws).single(),
      sb.from("workspace_members").select("user_id, role, created_at").eq("workspace_id", ws),
      sb.from("templates").select("*").eq("workspace_id", ws),
      sb.from("pairings").select("*").eq("workspace_id", ws),
      sb.from("meetings").select("*").eq("workspace_id", ws),
    ]);
    const meetingIds = (meetings.data ?? []).map((m) => m.id);
    const pairingIds = (pairings.data ?? []).map((p) => p.id);
    const userIds = (members.data ?? []).map((m) => m.user_id);
    const [profiles, notes, agenda, actions] = await Promise.all([
      sb.from("profiles").select("id, display_name, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      meetingIds.length ? sb.from("meeting_notes").select("*").in("meeting_id", meetingIds) : Promise.resolve({ data: [] }),
      meetingIds.length ? sb.from("agenda_items").select("*").in("meeting_id", meetingIds) : Promise.resolve({ data: [] }),
      pairingIds.length ? sb.from("action_items").select("*").in("pairing_id", pairingIds) : Promise.resolve({ data: [] }),
    ]);
    return {
      exported_at: new Date().toISOString(),
      note: "Contains everything visible to the person who exported it. Other people's private notes are never included.",
      workspace: workspace.data,
      members: members.data ?? [],
      profiles: profiles.data ?? [],
      templates: templates.data ?? [],
      pairings: pairings.data ?? [],
      meetings: meetings.data ?? [],
      meeting_notes: notes.data ?? [],
      agenda_items: agenda.data ?? [],
      action_items: actions.data ?? [],
    };
  });

// Permanently delete the caller's own account. Workspaces they solely own must be deleted first.
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: owned } = await context.supabase
      .from("workspace_members").select("workspace_id").eq("user_id", context.userId).eq("role", "owner");
    if (owned?.length) throw new Error("You own a workspace. Delete it (or ask us to transfer it) before deleting your account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    await supabaseAdmin.from("meeting_notes").delete().eq("author_id", uid);
    await supabaseAdmin.from("agenda_items").delete().eq("author_id", uid);
    await supabaseAdmin.from("workspace_members").delete().eq("user_id", uid);
    await supabaseAdmin.from("pairings").update({ active: false }).or(`leader_id.eq.${uid},report_id.eq.${uid}`);
    await supabaseAdmin.from("ai_usage").delete().eq("user_id", uid);
    await supabaseAdmin.from("profiles").delete().eq("id", uid);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error("Couldn't delete the account. Please try again.");
    return { ok: true };
  });

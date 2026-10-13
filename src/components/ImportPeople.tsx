import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendInviteEmail } from "@/lib/invite.functions";
import { parsePeople, SAMPLE_CSV, type ImportRow } from "@/lib/people-import";
import { useWorkspace } from "@/lib/workspace";

export function ImportPeople() {
  const { workspace, members, refresh } = useWorkspace();
  const qc = useQueryClient();
  const sendInvite = useServerFn(sendInviteEmail);
  const [rows, setRows] = useState<(ImportRow & { keep: boolean })[] | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [sendEmails, setSendEmails] = useState(true);
  const [busy, setBusy] = useState(false);
  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));

  async function onFile(f: File | undefined) {
    if (!f) return;
    const parsed = parsePeople(await f.text());
    setRows(parsed.rows.map((r) => ({ ...r, keep: true })));
    setProblems(parsed.problems);
  }

  function downloadSample() {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "tandem-people-sample.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function runImport() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.keep).map(({ keep: _k, ...r }) => r);
    if (!chosen.length) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("import_people", { _ws: workspace.id, _rows: chosen });
    if (error) { setBusy(false); return toast.error(error.message); }
    const res = data as { invite_ids: string[]; skipped: number; pairings: number };
    let sent = 0;
    if (sendEmails) {
      for (const id of res.invite_ids) {
        try { if ((await sendInvite({ data: { inviteId: id, origin: window.location.origin } })).sent) sent++; } catch { /* keep going */ }
      }
    }
    setBusy(false);
    setRows(null); setProblems([]);
    qc.invalidateQueries({ queryKey: ["invites"] });
    qc.invalidateQueries({ queryKey: ["pairings"] });
    refresh();
    toast.success(
      `${res.invite_ids.length} invited${sendEmails ? ` (${sent} emailed)` : ""}, ${res.pairings} pairings created` +
        (res.skipped ? `, ${res.skipped} already invited` : "") + ".",
    );
  }

  const kept = rows?.filter((r) => r.keep).length ?? 0;

  return (
    <section className="space-y-3">
      <h2 className="text-xl">Import people</h2>
      <p className="text-sm text-muted-foreground">
        Upload a spreadsheet saved as CSV with columns <b>Name</b>, <b>Email</b>, <b>Manager Email</b> and optional <b>Role</b> (member or admin).
        A Google Workspace user export works as-is: in the Google Admin console, go to Directory → Users → Download users, and choose CSV.
        Each person is paired with their manager once both have joined.
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="cursor-pointer rounded-md border border-input bg-background px-3 py-2 font-medium hover:bg-muted">
          Choose file…
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <button onClick={downloadSample} className="text-primary hover:underline">Download a sample</button>
      </div>

      {problems.length > 0 && (
        <ul className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {problems.slice(0, 20).map((p) => <li key={p}>{p}</li>)}
          {problems.length > 20 && <li>…and {problems.length - 20} more.</li>}
        </ul>
      )}

      {rows && (
        <div className="space-y-3">
          <p className="text-sm">Review before importing. Untick anyone you don't want to add.</p>
          <div className="max-h-96 overflow-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="p-2" /><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Manager</th><th className="p-2">Role</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr key={r.email} className={r.keep ? "" : "opacity-50"}>
                    <td className="p-2"><input type="checkbox" className="accent-primary" checked={r.keep} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} /></td>
                    <td className="p-2">{r.name || "—"}</td>
                    <td className="p-2">{r.email}{memberEmails.has(r.email) && <span className="ml-2 text-xs text-muted-foreground">already a member</span>}</td>
                    <td className="p-2 text-muted-foreground">{r.manager_email || "—"}</td>
                    <td className="p-2">
                      <select className="rounded border border-input bg-background px-1 py-0.5" value={r.role} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, role: e.target.value as ImportRow["role"] } : x)))}>
                        <option value="member">Member</option><option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-primary" checked={sendEmails} onChange={(e) => setSendEmails(e.target.checked)} />
            Email each new person an invitation
          </label>
          <div className="flex gap-3">
            <button disabled={busy || !kept} onClick={runImport} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {busy ? "Importing…" : `Import ${kept} ${kept === 1 ? "person" : "people"}`}
            </button>
            <button onClick={() => { setRows(null); setProblems([]); }} className="text-sm text-muted-foreground hover:underline">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

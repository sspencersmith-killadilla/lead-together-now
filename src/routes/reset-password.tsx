import logoMark from "@/assets/logo-mark.png";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const title = "Set a new password — Tandem";
const description = "Choose a new password for your Tandem account.";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTokenHash(new URLSearchParams(window.location.search).get("token_hash"));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function redeem() {
    if (!tokenHash) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    setBusy(false);
    if (error) return setMsg("This reset link has expired or was already used. Go to sign in and choose \"Forgot password?\" to get a new one.");
    window.history.replaceState(null, "", "/reset-password");
    setTokenHash(null);
    setReady(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setMsg("The passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg(error.message);
    navigate({ to: "/home" });
  }

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent";
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src={logoMark} alt="Tandem" className="h-8 w-8 rounded-lg" />
            <span className="font-serif text-xl italic">Tandem</span>
          </Link>
          <h1 className="mt-8 text-3xl">Set a new password</h1>
        </div>
        <div className="rounded-3xl border border-border bg-card/40 p-8">
          {ready ? (
            <form onSubmit={submit} className="space-y-4">
              <input className={field} type="password" minLength={8} required placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className={field} type="password" minLength={8} required placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              <button disabled={busy} className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? "Saving…" : "Save new password"}
              </button>
            </form>
          ) : tokenHash ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Press continue to choose your new password.</p>
              {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
              <button onClick={redeem} disabled={busy} className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? "Checking…" : "Continue"}
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Open this page from the reset link in your email. Need a new link? <Link to="/auth" className="text-accent hover:underline">Go to sign in</Link> and choose "Forgot password?".
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

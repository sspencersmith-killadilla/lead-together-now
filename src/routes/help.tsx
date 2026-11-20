import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { sendHelpRequest } from "@/lib/help.functions";
import { DEFAULT_SUPPORT } from "@/lib/site";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Get help — Tandem" }, { name: "description", content: "Send a help request to the Tandem team." }] }),
  component: HelpPage,
});

const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function HelpPage() {
  const send = useServerFn(sendHelpRequest);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const page = document.referrer || "";
      await send({ data: page ? { name, email, message, page } : { name, email, message } });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Tandem</Link>
      <h1 className="mt-4 text-3xl">Get help</h1>
      <p className="mt-2 text-muted-foreground">
        Send a message to {DEFAULT_SUPPORT} and we'll get back to you by email.
      </p>
      {state === "sent" ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <p className="font-medium">Message sent.</p>
          <p className="mt-1 text-sm text-muted-foreground">We'll reply to the email address you gave us.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Your name</label>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your email</label>
            <input className={field} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.org" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">What do you need help with?</label>
            <textarea className={field} rows={6} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what happened or what you're trying to do…" />
          </div>
          {state === "error" && <p className="text-sm text-destructive">Couldn't send right now — please try again in a few minutes.</p>}
          <button type="submit" disabled={state === "sending"} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {state === "sending" ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}

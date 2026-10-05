<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Tandem — architecture rules

- Signed-in pages live under the `_authenticated` layout, which runs only in the browser (ssr: false), because the login session is stored in the browser.
- Page data reads/writes go straight through the browser database client and rely on row-level security, which keeps the permission rules in one place.
- AI runs only in server functions (`src/lib/ai.functions.ts`), reads shared content only, and uses AI_BASE_URL/AI_API_KEY/AI_MODEL overrides so self-hosters can use any provider.
- Workspace membership roles live in `workspace_members` and are checked with the `has_workspace_role` security-definer function, which prevents privilege escalation.
- Meetings copy their template prompts when created, so editing a template never changes past meetings.

- Administrative changes are recorded by database triggers into `audit_log` (admin read-only, no update/delete, never note text), so the log can't be bypassed from the app.
- Every AI server function calls `consume_ai_quota` first, so per-person AI cost limits apply on the server.
- Scheduled jobs call `/api/public/cron/*` with a token stored in `private.cron_tokens` and checked by `verify_cron_token` (service role only), so the token never lives in code.
- Workspace export runs as the caller under RLS, so exports can never include other people's private notes.

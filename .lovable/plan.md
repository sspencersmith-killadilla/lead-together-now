# Make Tandem ready for large-scale use

Covers every item from the readiness review that can be built in the app. Some items need you, not code (listed at the end).

## What gets built

1. **Activity log** — Owners and admins get a new "Activity" tab in Settings. It shows who did what and when: invites sent or cancelled, members added or removed, role changes, pairings created, handed off or ended, templates edited, 1-on-1s deleted, branding changed. It records events, never note text. Entries can't be edited or deleted, even by admins.

2. **Export and delete workspace data** — In Settings, owners can:
   - **Export** everything the workspace can see as a downloadable file (people, pairings, 1-on-1s, shared notes, summaries, action items, templates). Private notes are never included, except your own.
   - **Delete the workspace** permanently, after typing its name to confirm.
   - Each person can also **delete their own account** from a new "Your account" section.

3. **Terms of use and privacy policy pages** — Public pages, linked from the footer and the sign-up form, written in plain, organization-neutral language. Self-hosters can edit them. Placeholder contact details will need your real ones.

4. **Password reset** — A "Forgot password?" link on sign-in and a page to set a new password, tested end to end.

5. **AI usage limits** — Each person can run a set number of AI summaries and suggestions per hour (default 20). Above that, they get a clear "try again later" message. This keeps AI costs predictable.

6. **Overdue 1-on-1 reminder emails** — Once a day, leaders get one short email listing people whose 1-on-1 is overdue for their usual rhythm. Each person can switch this off in "Your account." Like invitations, this starts sending once the email domain is verified.

7. **First-run checklist** — New workspace owners see a short checklist on the home page: invite someone, add a pairing, plan the first 1-on-1, set branding. It disappears when done or dismissed.

8. **Adoption snapshot for admins** — A small panel in Settings: active members, 1-on-1s held in the last 30 days, overdue pairings, open action items. Counts only, no note content.

9. **Support contact everywhere** — The help contact from branding also shows on sign-in and the error page, with a default if none is set.

10. **Docs updated** — README, user guide, self-hosting guide and contributing guide cover all of the above.

## Things only you can do
- Add the three DNS records for notify.tandem.civicplexus.org (invites and reminders send after that).
- Publish once the work is done; I'll publish at the end if you'd like.
- Backups are handled automatically by Lovable Cloud. For a government-grade setup, plan a regular export to your own storage.
- Single sign-on through your organization's identity system needs an Enterprise plan. Google sign-in already works.

## Technical details
- Migration: `audit_log` table (workspace_id, actor_id, action, target_type, target_id, meta jsonb, created_at). Written by `security definer` triggers on workspace_members, workspace_invites, pairings, templates, meetings (delete), workspaces (branding columns). SELECT only for `has_workspace_role(ws,'admin')`, no update/delete policies. GRANTs included.
- Migration: `ai_usage` table + `consume_ai_quota(_limit int)` security-definer function, called at the start of each AI server function.
- Migration: `profiles.reminder_emails boolean default true`, `workspaces.onboarding_dismissed boolean default false`.
- Export: server function with `requireSupabaseAuth` running reads as the user under RLS, returned as JSON for download. Delete workspace: owner-checked `delete_workspace(_ws)` RPC with cascade. Delete account: server function verifying the caller, then admin auth delete.
- Reminders: `/api/public/cron/overdue-reminders` route protected by `LOVABLE_CRON_SECRET`, scheduled daily via pg_cron + pg_net, new `overdue-reminder` email template, idempotency key per leader per day.
- New routes: `/terms`, `/privacy`, `/reset-password`, each with its own head() metadata.
- AGENTS.md gets rules for the audit log and AI quota.

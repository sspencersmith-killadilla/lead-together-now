# Tandem — final readiness: help routing, records retention, publish

Tandem is functionally complete. This plan covers the last three items: silently routing help emails to you, a government-ready records retention policy, and publishing.

## 1. Silent help-email routing
- Keep help@tandem.civicplexus.org as the address shown everywhere (sign-in, terms, privacy, error pages) — users never see a personal address.
- Add a small email-forwarding step so messages to that address arrive in your inbox at s.spencersmith@gmail.com. Replies come from you directly.
- Note: if you reply, the person will see your Gmail address in your reply. If you'd rather reply as help@tandem.civicplexus.org, that needs Gmail's "Send mail as" setup on your side — I'll include the steps.

## 2. Records retention policy (government-ready)
Per your choice: **only workspace owners/admins can delete 1-on-1 sessions.**
- Database change: the delete permission on sessions moves from "either person in the pairing" to "workspace owner or admin only", enforced in the database so it can't be bypassed from the app.
- The Delete button disappears for leaders and staff; admins keep it.
- The deletion is recorded in the activity log (who deleted, which session, when) — already in place via the audit triggers.
- Terms/privacy pages get a short records-retention note explaining that organizations control deletion and should follow their own retention schedules.
- Private notes remain author-only and deletable by their author — personal notes are not organizational records.

## 3. Publish
Publish the site so the password-reset fix, people import, help routing and retention policy go live, then test on the live site: password reset, invite email, planning a 1-on-1, CSV import.

## Technical details
- Help routing: forwarding rule for the verified sender domain's inbound mail (or a `support_contact` default pointing at the forwarding address); no user-facing change.
- Retention: replace the `meetings` DELETE policy with one using `has_workspace_role(auth.uid(), workspace_id, 'owner','admin')`; hide the delete button in `src/routes/_authenticated.meetings.$id.tsx` for non-admins; update USER_GUIDE.md and terms/privacy wording.
- No breaking schema changes; single additive migration for the policy swap.

# Tandem — final readiness checklist

Tandem is functionally complete: sign-up/sign-in, workspaces, invites, templates, 1-on-1s (planned and live), shared and private notes, AI summaries, action items, calendar downloads, reminder and invite emails, data export, account deletion, terms/privacy pages, people import. The build is clean and the email domain is verified. What remains is a short list of finishing steps.

## 1. Publish (I can do this now)
The latest fixes are not on the live site yet:
- Fixed password-reset email (stops the expired-link loop caused by email scanners)
- People import (CSV upload in Settings)

## 2. Real help contact (needs you)
The sign-in, terms, privacy and error pages show a placeholder address I made up: help@tandem.civicplexus.org. Send me the real address and I'll swap it in everywhere.

## 3. Live-site testing (I do this after publishing)
- Request a fresh password-reset email and complete the reset
- Invite a real person and confirm the invite email arrives and joins them to the right workspace
- Plan a future 1-on-1, run one, write shared and private notes, generate an AI summary
- Upload a small CSV through Settings → Import people

## 4. Optional polish (your call)
- **Mismatched invite emails**: today an invite only works if the person signs up with the exact invited address. I can make invite links join the workspace regardless of which email they sign up with.
- **Record-keeping rules**: for government use, public-records laws may require restricting who can delete 1-on-1 sessions. I can add a per-workspace setting.
- **Single sign-on** (Entra ID / Okta / SAML) for larger organizations — available on an Enterprise plan; Google sign-in already works.

## Technical details
- Publish via the standard publish flow; no code changes needed for items 1–3 beyond the help-email swap (one constant in `src/lib/site.ts`).
- Item 4 options are small, isolated changes: invite acceptance logic in `accept_invites()`, a `workspaces` flag checked by the delete-session mutation, and auth provider configuration.

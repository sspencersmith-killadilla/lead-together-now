# Standalone, open-source 1-on-1 coaching app

A standalone version of the CivicPlexus 1-on-1 feature, with no city-government or HR wording. It's for any leader in any kind of organization: team leads, managers, directors, executives, nonprofit coordinators, and volunteer captains. It will be MIT-licensed and easy to host yourself.

Working name: **Tandem**. You can rename it any time.

## What people can do

- **Sign up and create or join a workspace.** This is the organization. Admins invite people by email.
- **Set up who talks to whom.** Anyone can be a leader, a report, or both. A skip-level leader can see a report's meetings without the private notes. The reporting chart is optional. A leader can also just add someone as a 1-on-1 partner, which suits peer coaching and mentoring.
- **1-on-1 home**: a list of your people, the last meeting date, a nudge when a meeting is overdue, and open action items from both sides.
- **Meeting page** (carried over from CivicPlexus):
  - A shared agenda that both people can add to before the meeting
  - Question prompts from a template, with separate sets for the leader and the report
  - Shared notes, plus private notes only the leader can see
  - Action items with an owner and due date that carry over until they're done
  - An AI summary of the meeting and AI suggestions for action items
- **Templates**: starter templates you can copy, change, and publish, such as a weekly check-in, career growth, a new-hire first 90 days, and skip-level. New meetings use the latest published version.
- **Hand-off**: when a leader changes, the meeting history moves to the new leader.
- **Growth timeline**: each person's summaries over time, which they can export to help with reviews or self-reflection. This replaces the annual-review link in CivicPlexus, which depended on HR.

## Left out on purpose

These CivicPlexus features stay out: HR records, employee files, formal reviews, cascades, volunteer tools, and government-specific screens.

## Look and feel

A calm, focused writing space that feels like a good notebook, not an HR dashboard. Warm neutral colors, a serif for headings, and a clean sans-serif for body text.

## Open-source extras

- An MIT license file, a README, a self-hosting guide, and a contributing guide
- AI is optional: the app works fully when AI is turned off

## Technical details

- Lovable Cloud for accounts, data, and access rules. Tables:
  - organizations and memberships, with roles (owner, admin, member) kept in a separate user_roles-style table and checked by a has_role function
  - pairings (leader_id, report_id, org_id)
  - one_on_ones, agenda items, notes (shared or private), action items
  - templates and template versions
- Access rules: only the two people in a pairing can see a meeting. Private notes are visible only to the leader. Admins manage the workspace but can't read notes.
- Adapt the data model from the CivicPlexus migrations and the logic from `one-on-ones.functions.ts`, `coaching-ai.functions.ts`, and `one-on-one-transfer.functions.ts`. Drop the employee/HR foreign keys.
- AI runs through the Lovable AI Gateway on the server, with a per-workspace setting to turn it on or off.
- Pages: `/`, `/auth`, `/_authenticated/{home, people, meetings/$id, templates, settings}`.

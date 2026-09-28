# Port the full CivicPlexus question library into Tandem

## Problem

CivicPlexus seeded 10 one-on-one templates, each with 5 questions (50 questions total). Tandem only carried over 4 templates with 3 questions each (12 questions). The missing ones:

- Bi-weekly Coaching
- Quarterly Goals Review
- Project Retro
- Return-from-Leave
- Performance Concern

Plus the 4 shared templates carry shorter question sets than CivicPlexus.

## Approach

One new migration, `0001_starter_templates.sql`, that:

1. **Updates the 4 existing starter templates in every workspace** (Weekly Check-in, Career Growth, First 90 Days, Skip-Level) so each carries the full 5-question set from the matching CivicPlexus template. New-hire 30-day and 60/90-day collapse into the existing First 90 Days template.
2. **Inserts the 6 missing templates into every workspace**: Coaching Check-in, Quarterly Goals Review, Project Debrief, Back from Time Away, Getting Back on Track — five in total to port, plus one extra from splitting (see naming below).
3. **Replaces the `create_workspace` function body** so every *new* workspace seeds the same full 10-template set.

Matched to existing workspaces by the exact seeded template names, so user-created templates are untouched.

## Naming and wording (org-agnostic rule)

CivicPlexus names carry HR and workplace-specific framing. Renames for Tandem:

| CivicPlexus | Tandem |
|---|---|
| Weekly Check-in | Weekly Check-in (kept) |
| Bi-weekly Coaching | Coaching Check-in |
| Monthly Career Growth | Career Growth (kept) |
| Quarterly Goals Review | Quarterly Goals Review (kept) |
| Project Retro 1-on-1 | Project Debrief |
| New Hire 30-day + 60/90-day | First 90 Days (merged, kept) |
| Skip-Level | Skip-Level (kept) |
| Return-from-Leave | Back from Time Away |
| Performance Concern | Getting Back on Track |

Question text stays verbatim from CivicPlexus unless it uses HR wording (e.g. "onboarding", "new hire"), which gets neutral rewording.

## Leader / report split

CivicPlexus only stored one question list (agenda prompts for the report). Tandem splits prompts into `leader_prompts` and `report_prompts`:

- Questions addressed to the person ("What were your wins this week?") land in `report_prompts` verbatim.
- Each of those gets one matching framing prompt in `leader_prompts` (e.g. "Ask what support they need from you", "Give the feedback you owe").
- Leader-only framing from CivicPlexus's manager-facing flows (feedback, commitments) goes in `leader_prompts`.

## Verification

- Run the migration, then query: every workspace should show 10 templates, each with 5 report prompts and matching leader prompts.
- Open the Templates page and one existing workspace in the preview to confirm the upgraded and new templates appear.
- Typecheck clean.

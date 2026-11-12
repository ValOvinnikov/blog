---
name: write-ticket
description: >-
  Use when creating any GitHub issue in this repo — a feature epic and its
  per-layer sub-issues, a manual-test issue, a filed review finding or
  cleanup — or when choosing its prio:* label or deciding whether it is
  cloud-ok. Covers the board-keeper creation dispatch, the body check against
  the skills, and the issue body templates.
---

# Write a ticket

How an issue is created, what its body says, and how it is prioritised.
`CLAUDE.md` "Ticket priority & triage" is the summary; the rules are here.

## Creating an issue

**Never call `gh issue create` directly — creating an issue always goes through
`board-keeper`.** Dispatch it with
`"create issue: title=..., body=..., labels=...(, parent=#<n>)"`; it creates the
issue, places it on the board, confirms status and labels, links any parent,
and only then reports the number — one verified operation. Gather every field
first — **title** (conventional-commit style), **body** (the template below),
**labels including exactly one `prio:*`**, and the **parent issue number** for
a sub-issue — asking the human for anything missing, since `board-keeper`
cannot prompt. In the same pass, add `cloud-ok` when the ticket qualifies.

**Read the body against the skills before dispatching it.** A ticket body is
the whole brief for whoever executes it — a cloud session's work is reviewed only once its PR is open, and
a layer agent's prompt is sourced from it — so anything it prescribes that a
skill forbids ships exactly as written. Check every `## Scope` line and
criterion against `testing-practices` → "What not to test" and `CLAUDE.md`
"Comments default to zero":

- **Acceptance criteria state behaviour, never a test's shape.** "Two labels
  render the same minimum width from `sm` up" is a criterion;
  "`action-group.test.tsx` — the classes per appearance" is an instruction to
  write the class assertion `testing-practices` bans, and a cloud session will
  write it.
- **A styling-only change says so.** Spacing, sizing, tokens, borders and
  layout have no unit-test surface: the body names the story that covers the
  change, `## Scope` lists no test file, and the ticket carries
  `no-tests-needed` from creation.
- **The same check covers every other rule** a body can quietly prescribe: any
  test of a Studio schema definition, a test that asserts a constant's value
  back at itself, a `Name — does X` doc block, a hand-edit to
  `packages/config/src/sanity/generated/`, a schema change with no migration
  decision.

A body that fails this check is rewritten before dispatch — never dispatched
and corrected in review.

### Issue body template

**An issue body is a work item in fixed sections, not a design document.** A
ticket says why the work exists, what "done" means, and where the design lives
— the design itself belongs in a `docs/superpowers/specs/*` doc while the work
is in flight, and in its `docs/features/` page once it ships.

A sub-issue (other than a manual-test issue, below), in this order and no other
sections:

```
## Why
<1–3 sentences: what is wrong or missing today>

## Scope
- <layer>: <what changes>
- Feature doc: docs/features/<feature>.md (update | create | none)
- Cost: <volume and free-allowance fit> (only when the ticket adds a cron, Workflow run, paid API call, Blob/KV use or hot-path query)

## Acceptance criteria
- [ ] <observable outcome, not an implementation step>

## Verify
pnpm verify

## Design
<link to the spec doc, or "none — the criteria above are the whole design">
```

An epic swaps `Acceptance criteria` and `Verify` for the shape of the work,
since its sub-issues carry those:

```
## Why
## Shape        — the rule the epic establishes, ≤5 bullets
## Order        — what blocks what, and what can run in parallel
## Done when    — the feature pages (and any SPEC.md core sections) the final PR must update
## Design       — link to the spec doc
```

`## Order` is the same information the epic status table renders as its 🟡 and
🔵 lanes; writing it into the epic once is what lets that table be regenerated
rather than re-derived.

A manual-test issue — owed by any change that alters what a page shows or how
it behaves, labelled `manual-test` plus the same `prio:*` as its
implementation (when it is filed, linked and closed: `develop-feature` §2):

```
## What changed (user-visible)
<what a reader, editor or operator now sees or does differently>

## Seed
<exact Sanity documents and fields to create or edit, per tenant and locale;
platform settings, capability toggles and plan — or the seed command>

## Steps
1. <action> — expected: <one observable result>

## Matrix
- Viewports 390, 820, 1280; light and dark
- Brand variants PRIMARY / SECONDARY / BRAND_PRIMARY, where a module is involved
- Locales; signed in and out; Free and Growth, where plan-gated

## Validation
<invalid input, empty states, limits, error copy>

## Regression watch
<shared components and other modules/pages using what changed;
caching/revalidation; SEO>

## Accessibility
<keyboard path, focus, accessible names, contrast>
```

**Never put these in an issue body:**

- **A roll-up of sibling issues** — "Shipped: #2944, #2945, …". GitHub renders
  the sub-issue list natively with live state; a hand-written copy is stale the
  day the next one merges.
- **The design narrative** — field-order tables, migration transcripts,
  per-component walkthroughs, the reasoning behind a shape. That is the spec
  doc's job, and the feature page's afterwards.
- **Progress edits.** A body is written once. Status lives on the board, in the
  sub-issue list, and in the PRs; editing the body to record what has landed
  turns the ticket into a changelog.

A `cloud-ok` ticket keeps its exact file list and verification command, because
those are `## Scope` and `## Verify`; what it drops is the design narrative,
which a cloud session does not need to execute the criteria.

**A feature spanning 2+ layers always gets an epic (parent) issue plus one
sub-issue per layer — never a single flat issue covering multiple layers.**
Ticket structure informs PR structure, not the other way around. Gather every
sub-issue's title/body/labels up front, then dispatch `board-keeper` once with
the whole set — it creates the epic first, then each sub-issue with
`parent=<epic-number>`, in one batch.

## Priority labels

**Every open issue carries exactly one `prio:*` label**, set at creation
(`board-keeper` rejects a creation dispatch without one):

- `prio:now` — blocks users (a live bug) or blocks the active epic. Work this
  first, always.
- `prio:next` — on the active feature path: the current epic's sub-issues, or
  the next epic queued behind it.
- `prio:later` — real, agreed work with no schedule. Pulled deliberately (e.g.
  a cleanup-batch PR, a cloud-agent session), never by default.
- `prio:someday` — an idea or speculative cleanup; no commitment implied.
  Supersedes the old `deferred` label, which older issues keep alongside it —
  don't churn them.

**The pull rule:** work comes from `prio:now`, then the active epic's
`prio:next` — never from `later`/`someday` unless the human explicitly asks for
a cleanup pass. A growing `prio:later` pile is healthy (it's a backlog, not a
queue); a growing `prio:now` pile is the signal to stop and re-triage.

## Findings found mid-work get fixed in the current work, not ticketed

**Findings found mid-work get fixed in the current work, not ticketed.** A
reviewer finding, lint nit or small cleanup that touches the current branch's
layers goes to the owning layer agent and lands in the same branch/PR. Filing a
ticket is the fallback, for findings genuinely out of scope: a different layer,
a design decision, or a change big enough to need its own review. Ticketed
findings default to `prio:later` (`prio:someday` if speculative); one earns
`prio:now`/`prio:next` only as a user-facing bug or a blocker of a planned
feature, and the creating dispatch must say which — otherwise every unit of
work mints tickets that crowd out feature work.

## `cloud-ok`

**`cloud-ok` marks a ticket safe to hand to a solo cloud agent session**
(single context, no local multi-agent tooling). A ticket qualifies only when it
is all of:

- **single-layer** — one workspace, one owning agent's domain;
- **self-contained** — the body alone carries exact files, acceptance criteria
  and the verification command, `pnpm verify` (not a scoped
  type-check/lint/test: a cloud session has no `gh` and cannot see a red check
  after it pushes, and every gate `pnpm verify` chains runs locally). The
  CI-only tail — `build`, typegen drift, workflow linters, Dependency scan,
  Document validation, Migrations, Vercel — stays a local session's to watch
  after a cloud agent opens a PR;
- **free of human gates** — no Sanity or Drizzle migration, no console config,
  no production-dataset touch;
- **small** — roughly ≤5 files touched;
- **outside `.claude/**`** — the GitHub Actions `@claude` runner refuses every
  `Edit`/`Write` under `.claude/` as a sensitive path, independently of
  `.claude/settings.json`, so such a ticket runs to completion and delivers
  nothing there. Root `CLAUDE.md` and `docs/**` are writable; a ticket whose
  scope names an agent, skill or hook file is a local ticket.

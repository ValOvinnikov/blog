---
name: refactor-sweep
description: >-
  Use when running an on-demand refactor audit over one workspace in this
  blog monorepo — surfacing duplication, over-complex code worth
  simplifying, comment-policy violations, dead code, and drifted
  conventions as tracked issues rather than fixing them inline. Triggers on
  "run a refactor sweep" or "audit <layer> for cleanup".
---

# Refactor sweep

An on-demand, read-only audit of **one layer at a time** — never a repo-wide
pass, never a diff-scoped cleanup. Run it whenever asked, naming the layer to
sweep — there is no automatic rotation or staleness tracking; the human
decides which layer and when. It surfaces findings as tracked issues; it
never edits code itself. Complements `code-review-practices` (reactive,
per-diff, runs on every PR) with a pass over code nobody's touching right
now, which is exactly the code a per-diff review never sees.

## Running the sweep

1. **Read that layer's own agent file** (`.claude/agents/<layer>.md`) — its
   scope, hard boundaries, and conventions are the audit's judgment bar, not
   a generic linter's opinion. A finding that contradicts that file's own
   documented convention isn't a refactor opportunity, it's a misread.
2. **Dispatch the `explore` subagent**, read-only, scoped strictly to that
   layer's directory (`packages/<x>/src`, `apps/<x>/src`, or equivalent —
   never touching another layer's files even to compare). Ask it to report,
   with `file:line` evidence, not prose summaries, against all six of:
   - **Duplication, worth extracting.** The bar is whatever the layer's own
     agent file states — several (`config`, `service`, `ui`, `web`,
     `platform-app`) document "extract at the second repetition" explicitly,
     meaning **two** occurrences of the same logical operation already
     qualify, not three. For a layer whose file states no explicit
     threshold, default to that same two-occurrence bar rather than
     inventing a stricter one — this repo has no layer where three is the
     real bar. "Same logical operation" includes a repeated multi-step
     expression (e.g. the same `.trim().toLowerCase()` normalization
     inlined at every call site) even when the surrounding code differs —
     literal copy-paste is not the only kind of duplication that qualifies.
     For each hit, name where the extraction should live (a shared helper
     within the layer, or flag up to `config`/`utils` if the logic is
     genuinely cross-layer).
   - **Code worth simplifying**, independent of duplication: deep
     conditional/loop nesting, a function doing several unrelated things
     that could be split, hand-rolled logic that duplicates what an
     existing project utility (`@blog/utils`, `@blog/config`) already does,
     or a shape that's harder to follow than the problem requires. This is
     a distinct axis from duplication — flag it even when the code in
     question appears only once.
   - **Comment-policy violations**, per CLAUDE.md's Conventions section:
     any comment inside a function/component body that narrates a line or
     step rather than the one narrow non-obvious-gotcha exception; a doc
     comment that describes **how** something works instead of one short
     sentence on what it's **for**; the same comment copy-pasted verbatim
     across two or more files (a duplication finding in its own right — the
     copies can drift from each other, not just from the length limit); or
     a comment referencing project-management state (an issue/PR number as
     narrative outside a `TODO:`/`FIXME:` block, a `docs/superpowers/**`
     path, a roadmap phase, a "not wired up yet" note). This policy shipped
     across the whole repo at once, so expect it to be the single richest
     source of findings in code written before that — don't undercount it
     relative to the other five categories.
   - Dead exports, orphaned files, or code no longer reachable from any
     entry point (cross-check against `pnpm knip` output for that workspace
     if available).
   - Drift from the layer's own agent-file conventions — e.g. a file still
     using a pattern a later convention change superseded elsewhere in the
     same layer.
   - Stale `TODO:`/`FIXME:` comments whose linked issue is already closed.

   Explicitly exclude pure style/taste opinions the workspace's own
   ESLint/Prettier config doesn't already flag — this hunts for duplication,
   simplification, comment-policy compliance, and drift, not a second
   opinion on formatting.

3. **Dedup and sanity-check** the raw findings yourself before filing
   anything — merge near-duplicates, drop anything too subjective to act on
   without a judgment call only a human should make.
4. **File the surviving findings as tracked issues via `board-keeper`**, one
   batched dispatch for the whole set (`board-keeper.md`'s batch-dispatch
   support — never one dispatch per finding). Two shapes, chosen per
   finding:
   - **Micro-findings** — mechanical fixes a competent agent lands in
     minutes (a comment deletion, a rename, a dead export, a two-line
     dedup) — do **not** each get their own issue. Batch every
     micro-finding from the sweep into **one** umbrella issue per layer
     (`chore(<layer>): cleanup batch — <date>`), its body a checklist of
     `file:line` items, harvested later in a single batch PR. One sweep
     never mints more than one umbrella.
   - **Substantial findings** — an extraction with design decisions, a
     restructuring, anything needing its own review — get their own issue
     as before.

   Each issue: `refactor` + `layer:<x>` labels **plus exactly one `prio:*`
   label — `prio:later` by default, `prio:someday` if speculative; a sweep
   finding never earns `prio:now`/`prio:next` unless it is a user-facing
   bug, in which case it's labeled `bug`, not `refactor`** (CLAUDE.md's
   "Ticket priority & triage" section). Add `cloud-ok` when the issue meets
   that section's solo-cloud-session criteria — most single-layer sweep
   findings do. Title names the concrete problem; body carries the
   `file:line` evidence and a proposed direction. **Do not implement any
   of them here** — actual fixes go through the normal `develop-feature`
   lifecycle later, as their own ticket, own PR, own gate sequence, whenever
   someone decides to act on it. This skill's job ends at "surfaced and
   ticketed."

5. **Report a summary**: layer swept, finding count, issue numbers filed.

## Cadence

No fixed schedule — this runs only when explicitly invoked ("run a refactor
sweep", naming a layer). Which layer is overdue is a call the human makes;
this skill doesn't track or infer it.

## Boundaries

- **Never edit source files.** Findings become issues, not commits.
- **Never sweep more than one layer per run.** A big-bang audit across every
  layer at once produces a wall of findings nobody triages — the point of
  this skill is a steady, reviewable drip.

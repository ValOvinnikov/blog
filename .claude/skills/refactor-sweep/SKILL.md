---
name: refactor-sweep
description: >-
  Use when running an on-demand refactor audit over one workspace in this
  blog monorepo — surfacing duplication, dead code, and drifted conventions
  as tracked issues rather than fixing them inline. Triggers on "run a
  refactor sweep", "audit <layer> for cleanup", or when
  docs/context/refactor-sweep-log.md needs consulting to decide which layer
  is overdue.
---

# Refactor sweep

An on-demand, read-only audit of **one layer at a time** — never a repo-wide
pass, never a diff-scoped cleanup. Run it whenever you decide it's time, not
on any fixed cadence. It surfaces findings as tracked issues; it never edits
code itself. Complements `code-review-practices` (reactive, per-diff, runs on
every PR) with a pass over code nobody's touching right now, which is exactly
the code a per-diff review never sees.

## Which layer to sweep

Read `docs/context/refactor-sweep-log.md`. Pick the row with the oldest
`Last swept` date; rows still `never` swept go in the table's top-to-bottom
order before any already-swept row gets a second turn. An on-demand request
naming a layer explicitly ("sweep `ui`") overrides the rotation for that one
run — it doesn't consume the overdue layer's turn, which stays next up.

## Running the sweep

1. **Read that layer's own agent file** (`.claude/agents/<layer>.md`) — its
   scope, hard boundaries, and conventions are the audit's judgment bar, not
   a generic linter's opinion. A finding that contradicts that file's own
   documented convention isn't a refactor opportunity, it's a misread.
2. **Dispatch the `explore` subagent**, read-only, scoped strictly to that
   layer's directory (`packages/<x>/src`, `apps/<x>/src`, or equivalent —
   never touching another layer's files even to compare). Ask it to report,
   with `file:line` evidence, not prose summaries:
   - Duplication past this repo's own "extract at second repetition" bar
     (three or more near-identical blocks, not two — two is normal, three is
     a pattern).
   - Dead exports, orphaned files, or code no longer reachable from any
     entry point (cross-check against `pnpm knip` output for that workspace
     if available).
   - Drift from the layer's own agent-file conventions — e.g. a file still
     using a pattern a later convention change superseded elsewhere in the
     same layer.
   - Stale `TODO:`/`FIXME:` comments whose linked issue is already closed.
     Explicitly exclude pure style/taste opinions the workspace's own
     ESLint/Prettier config doesn't already flag — this hunts for duplication
     and drift, not a second opinion on formatting.
3. **Dedup and sanity-check** the raw findings yourself before filing
   anything — merge near-duplicates, drop anything too subjective to act on
   without a judgment call only a human should make.
4. **File each surviving finding as a tracked issue via `board-keeper`**, one
   batched dispatch for the whole set (`board-keeper.md`'s batch-dispatch
   support — never one dispatch per finding). Each issue: `refactor` +
   `layer:<x>` labels, a title naming the concrete problem, and a body with
   the `file:line` evidence and a proposed direction. **Do not implement any
   of them here** — actual fixes go through the normal `develop-feature`
   lifecycle later, as their own ticket, own PR, own gate sequence, whenever
   someone decides to act on it. This skill's job ends at "surfaced and
   ticketed."
5. **Update `docs/context/refactor-sweep-log.md`**: set the swept layer's
   `Last swept` date, the `main` commit SHA the audit read at, and the
   findings/issues-filed counts.
6. **Report a summary**: layer swept, finding count, issue numbers filed,
   which layer is next in rotation.

## Cadence

No fixed schedule — this runs only when explicitly invoked ("run a refactor
sweep", optionally naming a layer). `docs/context/refactor-sweep-log.md` is
what makes staleness visible between runs: anyone can glance at it and see
which layer has gone longest without a look, without needing to remember or
track it separately.

## Boundaries

- **Never edit source files.** Findings become issues, not commits.
- **Never sweep more than one layer per run.** A big-bang audit across every
  layer at once produces a wall of findings nobody triages — the point of
  this skill is a steady, reviewable drip.
- **Never let a sweep skip the log update.** An un-logged sweep is
  indistinguishable from one that never happened, and the next run will
  re-pick the same layer instead of rotating.

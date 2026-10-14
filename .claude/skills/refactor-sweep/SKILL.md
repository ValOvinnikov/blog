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

A read-only audit of **one layer per run**, only when asked — the human names
the layer and picks when; nothing tracks a rotation. It files findings as
issues and never edits code. `code-review-practices` sees only what a diff
touches; this sees the code nobody is touching.

## Running the sweep

1. **Read the owning agent's file** (`.claude/agents/<agent>.md`; `config.md`
   for `utils` and `configs/*`). Its scope, hard boundaries and conventions
   are the judgment bar: a finding that contradicts one is a misread, not a
   refactor.
2. **Dispatch the `explore` subagent**, with findings only in that layer's
   directories (`packages/<x>/src`, `apps/<x>/src`, or whatever else the
   agent file's scope names). It may read `@blog/utils`/`@blog/config`
   exports as reference, never another layer's implementation. Ask for
   `file:line` evidence, not prose, against all six:
   - **Duplication.** Two occurrences of the same logical operation qualify.
     A repeated multi-step expression (the same `.trim().toLowerCase()` at
     every call site) counts, not only copy-paste. Name where each
     extraction lands (CLAUDE.md → "A second copy moves to a shared
     folder…" routes every kind). Tests count too — repeated arrangement,
     fixture literals, `vi.mock` factories — at the thresholds
     `testing-practices` sets.
   - **Code worth simplifying**, even when it appears once: deep nesting, a
     function doing several unrelated things, hand-rolled logic an existing
     `@blog/utils`/`@blog/config` helper already covers, a component over
     its prop ceiling (`react-component-practices` § Props), a shape harder
     to follow than the problem.
   - **Comment-policy violations** per CLAUDE.md → "Comments default to
     zero" — swept as well as converged on touch, since that rule never
     bars a sweep. One comment copy-pasted across files is a duplication
     finding as well — the copies drift apart.
   - **Dead code** — unused exports, orphaned files, unreachable code;
     cross-check `pnpm knip --workspace <dir>`.
   - **Drift** — a file still on a pattern the agent file, or the rest of
     the layer, has moved off.
   - **Stale `TODO:`/`FIXME:`** whose linked issue is closed.

   Exclude:
   - Style or taste the workspace's ESLint/Prettier config doesn't flag.
   - A one-line idiom (`.claude/agents/config.md` → "Helpers").
   - Conventions that converge on touch and never through a sweep ticket: a
     single-consumer `*-variants.ts` (`react-component-practices` § Styling
     files), a single-domain component in `shared/`
     (`react-component-practices` § Where a component lives), file size
     alone (CLAUDE.md → "File size budgets"), a raw type form `@blog/config`
     already names (`.claude/agents/config.md` → "Types"), a feature with no
     `docs/features/` page (CLAUDE.md → "Feature docs").

3. **Dedup and sanity-check** the raw findings: merge near-duplicates, drop
   anything that needs a judgment call only a human should make.
4. **File them through `board-keeper` in one batched dispatch**, never one
   per finding:
   - **Micro-findings** — mechanical fixes landed in minutes (a comment
     deletion, a rename, a dead export, a two-line dedup) — share **one**
     umbrella issue per sweep, `chore(<layer>): cleanup batch — <date>`,
     whose body is a `file:line` checklist for a single batch PR.
   - **Substantial findings** — an extraction with design decisions, a
     restructuring, anything needing its own review — get an issue each.

   Each title names the concrete problem (conventional-commit style).
   Bodies follow CLAUDE.md → "Issue body template", carry the `file:line`
   evidence and a proposed direction, and pass "Read the body against the
   skills" before dispatch. Labels: `refactor`, `layer:<agent>` (the owning
   agent's name — `layer:config` for `utils`, `layer:platform-app`), and
   `prio:later`, or `prio:someday` if speculative. A user-facing bug is
   `bug`, not `refactor`, and takes its priority from "Ticket priority &
   triage". Add `cloud-ok` when the issue meets that section's criteria —
   most single-layer findings do.

5. **Report**: layer swept, finding count, issue numbers filed.

## Boundaries

- **Never edit source files or implement a finding.** Each fix ships later as
  its own ticket through `develop-feature`.
- **One layer per run.** A repo-wide pass produces a wall of findings nobody
  triages; the point is a steady, reviewable drip.

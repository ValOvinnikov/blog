---
name: refactor-sweep
description: >-
  Use when running an on-demand refactor audit over one workspace in this
  blog monorepo — surfacing duplication, over-complex code worth
  simplifying, comment-policy violations, dead code, and drifted
  conventions as verified findings the user approves before any is filed as
  an issue. Triggers on "run a refactor sweep" or "audit <layer> for cleanup".
---

# Refactor sweep

A read-only audit of **one layer per run**, in a local session. It proposes
findings, files the ones the user approves as issues, and never edits code.
`code-review-practices` sees only what a diff touches; this sees the code
nobody is touching.

## When to run

Only when asked — but these are the moments to offer one:

- **An epic closes** — on the layers it touched. The code has settled and no
  open PR holds those files.
- **A layer has collected three filed "already on `main`" duplication
  findings** from reviews (`reviewer.md` "Duplication is checked against the
  repo").
- **Once per layer before launch.**

Not on a layer with an open epic or open PRs across it: the findings go stale
and the cleanup PR conflicts. Not on a layer no PR has changed since its last
sweep: it returns the same findings.

## Running the sweep

1. **Read the owning agent's file** (`.claude/agents/<agent>.md`; `config.md`
   for `utils` and `configs/*`). Its scope, hard boundaries and conventions
   are the judgment bar: a finding that contradicts one is a misread, not a
   refactor.

2. **List what is already covered**, yourself — a subagent's `gh` cannot
   reach GitHub:

   ```bash
   gh issue list --state open --limit 200 --label refactor --label layer:<agent> --json number,title,body
   gh pr list --state open --limit 200 --json number,files
   ```

   A file an open PR touches is out of this sweep. A problem an open issue
   already names is not found again.

3. **Run the tools before any model**, in your own session, and keep the
   output:

   ```bash
   pnpm knip --workspace <dir>
   pnpm check:clones --workspace <dir>
   (cd <dir> && BLOG_LINT_TOUCHED=1 <repo root>/node_modules/.bin/eslint .)
   git log --since='3 months ago' --name-only --format= -- <dir>/src | sort | uniq -c | sort -rn | head -40
   ```

   knip gives dead code, the clone scan gives copy-paste, the touched-file
   lint over the whole workspace gives the comment and const backlog, and the
   last command gives churn — how often each file changed, which step 6 ranks
   by.

4. **Dispatch the scan** — the `explore` subagent with `model: sonnet`, its
   prompt naming the absolute path of the checkout (`.claude/agents/explore.md`),
   the layer's directories (`packages/<x>/src`, `apps/<x>/src`, or whatever
   the agent file's scope names), the tool output from step 3 and the
   covered list from step 2. It may read `@blog/utils`/`@blog/config` exports
   as reference, never another layer's implementation. It does not repeat
   what the tools found; it looks for what they cannot, with `file:line`
   evidence, not prose:
   - **Duplication the clone scan misses.** Two occurrences of the same
     logical operation qualify. A repeated multi-step expression (the same
     `.trim().toLowerCase()` at every call site) counts, not only
     copy-paste. Name where each extraction lands (CLAUDE.md → "A second
     copy moves to a shared folder…" routes every kind). Tests count too —
     repeated arrangement, fixture literals, `vi.mock` factories — at the
     thresholds `testing-practices` sets.
   - **Code worth simplifying**, even when it appears once: deep nesting, a
     function doing several unrelated things, hand-rolled logic an existing
     `@blog/utils`/`@blog/config` helper already covers, a component over
     its prop ceiling (`react-component-practices` § Props), a shape harder
     to follow than the problem.
   - **Drift** — a file still on a pattern the agent file, or the rest of
     the layer, has moved off.
   - **`TODO:`/`FIXME:` comments that cite an issue** — listed with the
     number; you check which are closed.

   Exclude:
   - Style or taste the workspace's ESLint/Prettier config doesn't flag.
   - A one-line idiom (`.claude/agents/config.md` → "Helpers").
   - Conventions that converge on touch and never through a sweep ticket: a
     `tv()` still in a `.tsx` (`react-component-practices` § Styling
     files), a single-domain component in `shared/`
     (`react-component-practices` § Where a component lives), file size
     alone (CLAUDE.md → "File size budgets"), a raw type form `@blog/config`
     already names (`.claude/agents/config.md` → "Types"), a feature with no
     `docs/features/` page (`develop-feature` → "Docs that ship with the change").

5. **Verify every finding yourself.** Open each `file:line` — the scan's and
   the tools' alike. Drop what does not reproduce, what step 2 already
   covers, and anything that needs a judgment call only a human should make;
   merge near-duplicates.

6. **Sort and cap.**
   - **Micro-findings** — mechanical fixes landed in minutes (a comment
     deletion, a rename, a dead export, a two-line dedup) — become one
     `file:line` checklist.
   - **Substantial findings** — an extraction with design decisions, a
     restructuring, anything needing its own review — are ranked by the
     churn of the files they touch, and **at most five** go forward. A
     refactor in a file nobody changes pays nothing back; the rest wait for
     the next sweep.

7. **Propose, then wait.** Show the user the ranked substantial findings and
   the size of the micro batch, each with its evidence and proposed
   direction. Nothing is filed until the user says which.

8. **File the approved ones through `board-keeper` in one batched dispatch**,
   never one per finding:
   - the micro-findings share **one** umbrella issue per sweep,
     `chore(<layer>): cleanup batch — <date>`, whose body is the checklist
     for a single batch PR;
   - each substantial finding gets an issue of its own.

   Each title names the concrete problem (conventional-commit style).
   Bodies follow `write-ticket` → "Issue body template", carry the `file:line`
   evidence and a proposed direction, and pass "Read the body against the
   skills" before dispatch. Labels: `refactor`, `layer:<agent>` (the owning
   agent's name — `layer:config` for `utils`, `layer:platform-app`), and
   `prio:later`, or `prio:someday` if speculative. A user-facing bug is
   `bug`, not `refactor`, and takes its priority from "Ticket priority &
   triage". Add `cloud-ok` when the issue meets that section's criteria —
   most single-layer findings do, and a cleanup batch over its file limit is
   split until each part does.

9. **Report**: layer swept, findings proposed, issue numbers filed, and what
   was left for the next sweep.

## Boundaries

- **Never edit source files or implement a finding.** Each fix ships later as
  its own ticket through `develop-feature` ("Carrying out a refactor ticket").
- **Never file an unapproved finding.**
- **One layer per run.** A repo-wide pass produces a wall of findings nobody
  triages; the point is a steady, reviewable drip.

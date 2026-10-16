---
name: open-pull-request
description: >-
  Use when the user asks to put work on a branch, open a pull request, or ship
  an issue for review in this repo. Covers the branch → work → verify → PR loop
  and the strict human-gated approval sequence.
---

# Open a pull request (branch → work → PR)

`develop-feature` says how to _build_ a change; this skill says how to _ship it
for review_. `CLAUDE.md` "Delivery gate sequence" is the summary; the
mechanics are here.

`<n>` is always the **issue** number; `<pr>` is the PR number `gh pr create`
printed. Issues and PRs share one counter, so the two are almost never equal.

## Scope: prefer per-layer PRs

One PR per layer, in dependency order, each merged before the next layer's
work starts on a branch cut from the `main` that contains it. Keep it one PR
only when a partial merge would red `main` (e.g. a shared `_type` or generated
type rename). Rules of record: `CLAUDE.md` "Split by workspace, always" and
"One layer at a time — merged before the next starts".

In a split, **only the completing PR carries `Closes #<n>`** — the wording
rule and the auto-close traps are under "PR body template" below.

### Stacked PRs — only on the user's say-so, then `gh stack`

A stack is the user's call, never the orchestrator's. Viability (the bottom PR
green on `main` alone, or expand/contract, or one PR) is `CLAUDE.md` "Stacked
PRs". Independent pieces never stack: each gets its own branch off `main`.
Use the installed `github/gh-stack` extension, never hand-rolled
`gh pr create --base <branch>`:

```bash
gh stack init                 # start a stack targeting main
gh stack init b1 b2 b3        # or adopt existing branches as a stack
gh stack add <branch>         # add a branch on top of the current stack
gh stack view                 # see the current stack
gh stack push                 # force-push every stack branch        — Gate 3
gh stack submit --open        # push all, create/update the PRs      — Gates 3 + 4
gh stack sync                 # fetch, restack, force-push all       — Gate 3
```

- **`push`, `sync` and `submit` all push** every stack branch with
  `--force-with-lease`, so each run needs its own fresh Gate 3 approval;
  `submit` also opens PRs, so it needs Gate 4 too. Run `sync` after every
  lower PR merges — the step most often forgotten — but ask first.
- **Never run `gh stack merge`** — merging is the human's.
- **`submit` from an agent's shell is non-interactive**: it skips its editor,
  uses auto-generated titles and no body, and opens drafts unless `--open`
  (or `gh pr ready <pr>` afterwards). Then run
  `gh pr edit <pr> --title "…" --body "…"` on each new PR per "PR body
  template", and Gate 5 for each.

**Every stacked PR runs the full required suite** because the four workflows
behind the required checks — `ci.yml`, `zizmor.yml`, `actionlint.yml`,
`hooks.yml` — declare a bare `pull_request:`
trigger. Never add a `branches:` filter to one: a required check that never
starts leaves the PR `BLOCKED` forever instead of failing it (`ci.yml`'s
header). The check list: `docs/context/ci-automation.md`.

**Collapsing a stack after the fact:**

1. Retarget the _top_ PR, which already holds every commit:
   `gh pr edit <top> --base main`.
2. Close the others as superseded, and move every stacked issue's
   `Closes #<n>` onto the survivor.
3. Ask to push (Gate 3), then run `gh pr update-branch <top>`. CodeQL's
   default setup analyzes only PRs into `main`, so the retargeted PR has none
   of `CodeQL`, `Analyze (actions)` or `Analyze (javascript-typescript)`, and
   a base change or close/reopen triggers nothing. Only a push to the head
   branch does; `update-branch` is that push, and merges `main` in too.

## ABSOLUTE RULES — never violate

- **Never push without explicit approval for that specific push.** No earlier
  approval carries over — not another branch's, not an earlier push on this
  one, not the original push before a Gate 5a CI fix. A `gh stack` command
  that pushes is a push.
- **Never create a PR without explicit approval**, asked separately after the
  push succeeds.
- **Committing needs no approval** — it is local and reversible.
- **Never push before review passes on the final diff**: every dispatched
  reviewer's `APPROVE`/`PASS` (`develop-feature` §6), or for a docs-only diff
  the inline identifier check (`CLAUDE.md` delivery gate step 4). Any later
  change invalidates it, a merge from `origin/main` included.
- **Never merge, never deploy.** Both are the human's.
- **Never set `--assignee` or `--reviewer` on the PR** — an owner assigned to
  their own PR cannot approve it. With a second collaborator,
  `--reviewer <them>` is fine.
- **Never push to `main` directly or open a PR from it.**

## The gate sequence

Committing is free; stop at Gates 3 and 4 and wait for the user.

### Gate 0 — Set In Progress, then branch

1. Dispatch `board-keeper` **synchronously** with `"starting work on #<n>"` —
   one of the two synchronous dispatches (`CLAUDE.md` "Dispatch subagents in
   the background by default"), because the checkout below depends on it. It
   sets the issue, and a Todo or blank parent, to In Progress and re-verifies
   each write (`board-keeper.md` Step 1d). Sibling sub-issues starting
   together are **one** dispatch: `"starting work on #86, #87, #88, #89"`.
2. Branch from a fresh `origin/main`. Never `git switch main`: in a worktree
   it fails, because the main checkout already has `main` checked out.

   ```
   git fetch origin
   git switch --no-track -c <type>/<n>-<short-slug> origin/main
   ```

   A session already on a generated `claude/<words>-<id>` branch renames it
   instead: `git rebase origin/main`, then
   `git branch -m <type>/<n>-<short-slug>`.

   `<type>` is a commitlint type (`feat`, `fix`, `tooling`, `docs`, `chore`,
   …). `board-keeper` and `board-auto-sync.yml` read the issue from that
   shape; a generated `claude/<words>-<id>` name is refused at push by
   `.claude/hooks/pre-bash-branch-name-guard.sh`.

   **Worktree-delegated work:** when layer subagents run in their own
   worktrees (`develop-feature` §3) and this session is the shared main
   checkout, leave it on `main`. The feature branch is created in the agent's
   worktree and landed from its commit; switching here too makes two
   competing copies of the branch.

### Gate 1 — Do the work, verify, review

Follow `develop-feature` §3–§6: merge `origin/main` in first, `pnpm typegen`
when a schema changed, `verify-runner` with `pnpm verify`, then every required
reviewer until each passes. A merge from `main` after verify or review sends
the branch back through both. Report the results and the review verdict, and
never leave Gate 1 on red.

### Gate 2 — Commit

Commit the reviewed work — no approval needed. Then Gate 3.

### Gate 3 — Ask to push

> "Changes committed. Ready to push branch `<type>/<n>-<short-slug>` to origin — shall I go ahead?"

For a docs-only diff, say it was docs-only and identifier-checked. Push only on
an explicit yes.

### Gate 4 — Ask to open the PR

> "Branch pushed. Shall I open the pull request now?"

Only on an explicit yes. Always pass `--head`: without it `gh` uses the
current branch, which is `main` in a checkout left there for
worktree-delegated work.

```
gh pr create --base main --head <type>/<n>-<short-slug> \
  --title "<conventional title>" \
  --body "<per the PR body template below>"
```

### Gate 5 — Board to Code Review, then the job label

1. **Dispatch `board-keeper` synchronously with `"after PR #<n>"`** — the
   issue number, not `<pr>` (`board-keeper.md` Step 1c). It confirms the
   issue reached Code Review — `board-auto-sync.yml` has usually moved it
   already — writes it if not, and re-verifies. This is the second
   synchronous dispatch and also the "after PR" reconciliation of `CLAUDE.md`
   "Board reconciliation" — don't dispatch it twice.
2. **Tag the PR with this job's label**, so concurrent background jobs' PRs
   are tellable apart in the PR list:

   ```
   JOB=$(basename "$CLAUDE_JOB_DIR")
   NAME=$(jq -r '.name // empty' "$CLAUDE_JOB_DIR/state.json")
   SLUG=$(printf '%s' "${NAME:-$JOB}" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' \
     | sed 's/^-*//; s/-*$//')

   PREV=$(gh label list --limit 200 --json name,description \
     --jq ".[] | select(.description == \"$JOB\") | .name")

   if [ -n "$PREV" ] && [ "$PREV" != "job:$SLUG" ]; then
     gh label edit "$PREV" --name "job:$SLUG"
   elif [ -z "$PREV" ]; then
     gh label create "job:$SLUG" --color D4D8DC --description "$JOB"
   fi
   gh pr edit <pr> --add-label "job:$SLUG"
   ```

   - **Skip silently when `$CLAUDE_JOB_DIR` is unset** — a foreground session
     has no job and nothing to disambiguate. A missing chip is not a failure.
   - **The chip shows the session's name** (`job:static-generation`); the job
     id is only the label's description, the lookup key that survives a
     rename. An unnamed job falls back to the id.
   - **A renamed session renames its label** with `gh label edit --name`,
     which updates every PR already carrying it. Never mint a second label,
     and never use `--force` — it keys on the name, the wrong key.
   - `board-keeper` deletes the label once no open PR carries it, on its
     `"after merge of #<n>"` trigger.

3. **Report the PR URL** only once the board write is confirmed, and hold any
   "done"/"shipped" framing until Gate 5a reports — say "PR open, board
   updated, CI running — watching checks next".

A solo cloud session does neither step 1 nor step 2, and never substitutes an
MCP or REST call for them (`CLAUDE.md` "Solo-session mode").

### Gate 5a — Watch CI to completion

Runs automatically after Gate 5. Every fix push still goes through a fresh
Gate 3.

1. **Dispatch `ci-watcher` in the background with `<pr>`** — the trailing
   number of the URL `gh pr create` printed, never the issue number or the
   branch. The agent absorbs `--watch`'s polling output so your context
   doesn't; stay responsive until it reports.

   **Fallback** when a subagent can't be dispatched: run `gh pr checks <pr>`
   once — never `--watch` inline — report the result honestly, "pending"
   included, and tell the user to re-check later. CI status never goes
   unreported.

2. **All green:** say so with the PR URL. Gate 6 governs from here.
3. **Any failure, required or not** — "not required to merge" is not "safe to
   ignore". `ci-watcher` hands over the check names, run URLs and a
   `--log-failed` excerpt; the diagnosis is yours:
   - Name the precise cause — `file:line`, the failing test and assertion,
     the typegen drift. "CI failed" is not a diagnosis.
   - Route the fix to the owning layer agent; fix it yourself only when the
     file is outside every agent's scope (`CLAUDE.md` "Use the scoped
     agents").
   - Re-run the local step matching the failing check (`develop-feature` §5);
     `pnpm --filter <web|platform> build` only to diagnose a `Build` failure.
   - Re-run `verify-runner` with `pnpm verify`, then re-dispatch every
     required reviewer until each passes (`develop-feature` §5–§6) — for a
     docs-only fix, the inline identifier check instead. The fix is a new
     diff; the earlier pass does not cover it.
   - Commit, then **ask to push afresh**, exactly as at Gate 3.
   - Re-dispatch `ci-watcher` on the same `<pr>` and return to step 2.
4. **Stop and ask** rather than push a speculative fix when the failure needs
   a design or behaviour decision, is flaky or infra-only and doesn't
   reproduce locally, or needs a judgment call such as a security-review flag.

### Gate 6 — Merge (the human's)

`Closes #<n>` closes the issue on merge and the board's "Item closed" workflow
moves it to Done — never set Done by hand. After the merge, dispatch
`board-keeper` with `"after merge of #<n>"`.

## PR body template

**A highlight list, not a write-up. Hard cap: 12 lines and 1200 characters.**
If it doesn't fit, it is describing the diff instead of summarising it — cut,
don't reformat.

```
<one sentence: what this PR makes possible that wasn't possible before>

## Summary
- <layer>: <what changed — one line per layer touched>

Manual test: #<m>
Closes #<n>
```

- **`Manual test: #<m>`** — the completing PR links its manual-test issue,
  never with a closing keyword (→ `develop-feature` §2 "Manual-test issue").
  Drop the line when there is none.
- **`Closes #<n>` goes only on the PR that completes the issue.** Earlier
  layer PRs write `Part of #<n>`, or a mention with words between keyword and
  number ("see #<n> for the full scope").
- **No test-plan checklist.** The gates require the checks before commit and
  CI re-runs them on the PR, so a hand-ticked copy proves nothing. Mention
  verification only when it isn't routine: a check knowingly red, a step
  deliberately skipped, something a reviewer must run by hand.

**Never in a PR body** — each is the diff restating itself:

- Code blocks — snippets, before/after pairs, type signatures.
- Per-file or per-function enumeration.
- Design-rationale sections; one line of _why_ belongs in the opening
  sentence, the rest in the code or the issue.
- Test narration ("verified the test fails without the fix by …").
- A table restating the Summary.

Before opening, ask of each sentence: **does it tell the reviewer something
the diff cannot?** If not, delete it. Genuine exceptions — a migration's
rollback plan, a deliberate behaviour change a reviewer would otherwise flag
as a bug, a known-broken check — get a sentence or two each.

### Closing keywords — the auto-close traps

GitHub closes an issue whenever one of its nine keywords — `close`, `closes`,
`closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved` — sits
directly before `#N` **anywhere**: in a PR body, in any tense ("…then close
#N", "fixed #N"), and in commit messages — the squash-merge message too, which
can be edited at merge time and diverge from the reviewed body.

- In a PR that must not close its issue, keep words between any closing
  keyword and the number: "revisit and close issue #N later", never
  "then close #N".
- When writing about this trap — in a PR, issue, doc or commit message — use
  the `#N` placeholder; a real issue number never directly follows a closing
  keyword.
- **If it bites, reopen the issue and confirm its Status left Done.** The
  board's "Item reopened" workflow moves it from Done to In Progress; check
  with an independent read of the item (`board-keeper.md` Step 4's `node(id:)`
  query). If it is still Done, move it back yourself — a backward move
  `board-keeper` reports but never makes — and re-read it the same way. Then
  check both the PR body and the actual merge commit message for the trigger.

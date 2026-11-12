---
name: review-pull-request
description: >-
  Use when an open PR needs review before it merges — a cloud session's draft
  PR, "review #<n>", a PR reaching Code Review on a tracked epic. Covers
  checking out the PR head, dispatching `reviewer` and `correctness-reviewer`
  in PR mode, verifying their findings, the one PR comment, and the fix-round
  re-review.
---

# Review a pull request

A cloud session implements alone and runs no review of its own (`CLAUDE.md`
"Solo-session mode"), so this review is the only one its diff gets. The same
two agents review a local session's diff before commit (`develop-feature`
§6); a PR that came through that gate is reviewed here only when the user
asks.

**Review when the PR opens, not after it merges.** A finding on an open PR is
a fix round in the session that still holds the context; the same finding
after merge is a new ticket and a new session. A draft PR is the expected
state and never a finding.

## 1. Gather

```bash
gh pr view <n> --json number,title,body,createdAt,headRefName,headRefOid,baseRefName,statusCheckRollup
gh pr diff <n> --name-only | wc -l
gh issue view <issue> --json title,body,updatedAt
```

The issue number is the `Closes #<n>` or `Refs #<n>` in the PR body, or the
number in the branch name — `closingIssuesReferences` is empty for every PR
but an issue's last. A PR that names no issue has no criteria to review
against: ask the user which issue it belongs to before dispatching.

From them: the head SHA, the changed-file count, the PR body's **Examined**
and **Reuse** lines, and the issue's **Copy** and **Cost** lines and
acceptance criteria.

**A PR that is one slice of a multi-PR issue is reviewed against its slice.**
Quote the issue's delivery line for this PR and every Scope, Decided and
acceptance line that slice covers, verbatim, and name the slice in the
prompt. The issue's remaining criteria belong to later PRs and are not
passed.

## 2. Check out the PR head

```bash
git fetch origin <baseRefName> pull/<n>/head
git worktree add --detach <primary checkout>/.claude/worktrees/review-pr-<n> <headRefOid>
```

The reviewers read whole files and run scripts, so they need the tree, not
the diff. The base is fetched with the head: a cloud session merges the base
in before it verifies, and against a stale `origin/<baseRefName>` the diff
picks up the base's own files, the count no longer matches, and both
reviewers stop on the mismatch.

`post-checkout` symlinks the worktree's `node_modules` to the primary
checkout's, and the review uses that tree as it is. **Never install in a
review worktree**: an install runs the PR's own install scripts and pnpm
settings unattended. `pre-bash-worktree-install-guard.sh` blocks it only from
a session that itself shares the primary checkout's `node_modules`; from any
other session the rule is yours to keep.

## 3. Run the checks CI has no step for

In the worktree, as one command:

```bash
cd <worktree> && { export TOUCHED_BASE_REF=origin/<baseRefName>; for check in check-file-size check-layer-contracts check-diff-hygiene check-touched-lint check-clones; do node scripts/$check.mjs || echo "FAILED: $check"; done; }
```

They take seconds. The first four are the part of `pnpm verify` that no CI
job repeats; the fifth is the review's clone scan. All five run whatever the
earlier ones return, so one round reports every failure; each `FAILED` line
is a blocking finding with its command and output.

**Do not run `pnpm verify`, type-check, lint or the tests.** The session that
opened the PR ran them, and CI runs them again as required checks once the
PR is marked ready, so a red PR cannot merge. A failed check in
`statusCheckRollup` on the head SHA is a blocking finding; a skipped one is
the draft state, never a finding.

**A check that could not start is not a failed check.** A failed check
prints its findings. `jscpd is not installed`, a module-resolution error from
eslint, or `check-touched-lint` exiting non-zero with nothing after its
`Linting N touched file(s)` line means the tool was not there to run. The
worktree's dependencies are the primary checkout's, linked when the worktree
was added, so which fix applies depends on where the gap is:

- **The PR itself adds a workspace or changes dependencies** (its diff
  touches `pnpm-lock.yaml` or adds a `package.json`) — nothing on `main` can
  supply what only the PR has. Leave that check out, and name it under
  **Not checked** in the report: the opening session's `pnpm verify` is the
  only run it gets.
- **Otherwise the primary checkout is behind** — ask the user to run
  `git pull` and `pnpm install` there, then remove the review worktree, add
  it again (step 2) and re-run step 3: the links are copied only when a
  worktree is added. The same pull gives sessions the current agents and
  skills.

## 4. Dispatch — one message, all in the background

Every prompt opens `PR review of #<n>` and carries the worktree's absolute
path, the head SHA, the base as `origin/<baseRefName>`, the changed-file
count and a one-sentence summary of the change. A base other than `main` is
also named as `TOUCHED_BASE_REF=origin/<baseRefName>` for the scripts.

- **`reviewer`** with the issue number, its Copy and Cost lines, and the PR
  body's Examined and Reuse lines verbatim. Its prompt gives step 3's result
  and says its own scripts run as `node scripts/<name>.mjs`.
- **`correctness-reviewer`** with the issue number and its acceptance
  criteria verbatim — skipped under `develop-feature` §6's rule (every
  changed file is styling, copy, a story or a doc), in which case
  `reviewer`'s prompt says so.
- **`a11y-reviewer`** and **`seo-auditor`** under the same rules as
  `develop-feature` §6.

## 5. Verify the findings yourself

Reject a report whose SHA is not the PR's head. Open every blocking finding's
`file:line`; drop one that does not reproduce, and say you dropped it. A
criterion reported **not met** is checked against the issue's history too:
when the issue's `updatedAt` is later than the PR's `createdAt`, read its
edits —

```bash
gh api graphql -f query='query { repository(owner: "<owner>", name: "<repo>") { issue(number: <issue>) { userContentEdits(first: 20) { nodes { editedAt diff } } } } }'
```

A line added to the issue after the PR opened is still a finding, and the
comment says the issue changed.

## 6. Report

- **Changes required** — one PR comment (`gh pr comment`, never a formal
  review), written for the session that will fix it:

  ```
  Review of <short sha> — changes required

  1. `path/file.ts:42` — what is wrong, or the failing scenario — the fix direction
  2. …

  Fix on this branch, re-run `pnpm verify`, push.
  ```

  Blocking findings only, unless a non-blocking one is worth doing in the
  same round; those go under an `Optional` heading.

- **Clean** — nothing is posted. Tell the user in chat: the PR number, clean,
  and each reviewer's **Not checked** line.

**Log a miss.** A confirmed blocking finding that an earlier gate saw and
passed — the session's `pnpm verify`, a previous review round, CI — gets one
row in `docs/context/review-misses.md`, with the change that would have
caught it. Give the user the row in chat; it is committed with the next
change to `.claude/` or `docs/context/`, and is never a reason to add a
checklist line on the spot.

## 7. Fix round

When the branch has new commits, fetch the base and the head again, move the
worktree (`git -C <worktree> checkout --detach <new sha>`), re-run step 3 and
re-dispatch every reviewer from step 4, each prompt opening
`Re-review of <old sha>` with the findings posted. A reviewer that approved
is included: the fix commits are code it has not seen. A merge from the base in that range needs a full
review instead.

## 8. Remove the worktree

Once the PR merges or closes: `git worktree remove <worktree>`. It is
detached and holds nothing of its own; one that was given its own install
before this skill stopped doing so deletes slowly and needs a generous
timeout. From a session that is itself inside a
worktree the command is refused (`develop-feature/worktree-cleanup.md`) —
leave it and tell the user the path.

## A PR that merged without this review

Run the same steps against the merge commit (base: its first parent). There
is no branch to fix, so each finding worth acting on is put to the user as a
proposed follow-up, never posted on the PR.

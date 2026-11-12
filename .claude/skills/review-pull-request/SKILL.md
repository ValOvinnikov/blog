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
gh pr view <n> --json number,title,body,headRefName,headRefOid,baseRefName,files,statusCheckRollup
gh issue view <issue> --json title,body
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
git fetch origin pull/<n>/head
git worktree add --detach <primary checkout>/.claude/worktrees/review-pr-<n> <headRefOid>
cd <worktree> && rm node_modules && pnpm install --frozen-lockfile
```

The reviewers read whole files and run scripts, so they need the tree, not
the diff. The worktree needs its own install, which takes seconds:
`post-checkout` symlinks `node_modules` to the primary checkout's, and when
that copy is behind the PR's lockfile every `pnpm` script stops at a refused
install. `rm node_modules` removes only the symlink. Let the install finish
before running anything else in the worktree.

## 3. Run the scripts yourself

In the worktree, in the background: `pnpm verify`, then `pnpm check:clones`
— one after the other, never at once. Skip `pnpm verify` when
`statusCheckRollup` shows CI green on that head SHA; CI skips a draft, so for
a cloud PR the session's own word is otherwise the only evidence it passed.

These run in your own session, not in `verify-runner` or `reviewer`: a
sandboxed subagent cannot write outside the session's checkout, so `pnpm`
fails there before the script starts. A red result is a blocking finding with
its failing command.

## 4. Dispatch — one message, all in the background

Dispatch while the scripts run. Every prompt opens `PR review of #<n>` and
carries the worktree's absolute path, the head SHA, the base as
`origin/<baseRefName>`, the changed-file count and a one-sentence summary of
the change.

- **`reviewer`** with the issue number, its Copy and Cost lines, and the PR
  body's Examined and Reuse lines verbatim. Its prompt says you are running
  `pnpm verify` and `pnpm check:clones`, and that its other scripts run as
  `node scripts/<name>.mjs`.
- **`correctness-reviewer`** with the issue number and its acceptance
  criteria verbatim — skipped under `develop-feature` §6's rule (every
  changed file is styling, copy, a story or a doc), in which case
  `reviewer`'s prompt says so.
- **`a11y-reviewer`** and **`seo-auditor`** under the same rules as
  `develop-feature` §6.

## 5. Verify the findings yourself

Reject a report whose SHA is not the PR's head. Open every blocking finding's
`file:line`; drop one that does not reproduce, and say you dropped it. A
criterion reported **not met** is checked against the issue's edit history
too: a line added to the issue after the PR opened is still a finding, and
the comment says the issue changed.

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

## 7. Fix round

When the branch has new commits, fetch, move the worktree
(`git -C <worktree> checkout --detach <new sha>`), re-run step 3 and
re-dispatch only the reviewers that raised a finding, each prompt opening `Re-review of <old sha>`
with the findings posted. A merge from the base in that range needs a full
review instead.

## 8. Remove the worktree

Once the PR merges or closes: `git worktree remove <worktree>`. It is
detached and holds nothing of its own; its private `node_modules` makes the
removal slow, so give it a generous timeout. From a session that is itself inside a
worktree the command is refused (`develop-feature/worktree-cleanup.md`) —
leave it and tell the user the path.

## A PR that merged without this review

Run the same steps against the merge commit (base: its first parent). There
is no branch to fix, so each finding worth acting on is put to the user as a
proposed follow-up, never posted on the PR.

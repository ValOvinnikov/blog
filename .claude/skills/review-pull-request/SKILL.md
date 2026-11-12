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
gh pr view <n> --json number,title,body,headRefOid,baseRefName,files,closingIssuesReferences,statusCheckRollup
gh issue view <issue> --json title,body
```

From them: the head SHA, the changed-file count, the PR body's **Examined**
and **Reuse** lines, and the issue's acceptance criteria and **Copy** and
**Cost** lines. A PR that closes no issue has no criteria to review against —
ask the user which issue it belongs to before dispatching.

## 2. Check out the PR head

```bash
git fetch origin pull/<n>/head
git worktree add --detach <primary checkout>/.claude/worktrees/review-pr-<n> <headRefOid>
```

The reviewers read whole files and run scripts, so they need the tree, not
the diff. `post-checkout` gives the worktree its dependencies.

## 3. Dispatch — one message, all in the background

Every prompt opens `PR review of #<n>` and carries the worktree's absolute
path, the base as `origin/<baseRefName>`, the changed-file count and a
one-sentence summary of the change.

- **`verify-runner`** with `pnpm verify`, unless `statusCheckRollup` shows CI
  green on that head SHA. CI skips a draft, so for a cloud PR the session's
  own word is otherwise the only evidence that verify passed.
- **`reviewer`** with the issue number, its Copy and Cost lines, and the PR
  body's Examined and Reuse lines verbatim.
- **`correctness-reviewer`** with the issue number and its acceptance
  criteria verbatim — skipped under `develop-feature` §6's rule (every
  changed file is styling, copy, a story or a doc), in which case
  `reviewer`'s prompt says so.
- **`a11y-reviewer`** and **`seo-auditor`** under the same rules as
  `develop-feature` §6.

## 4. Verify the findings yourself

Reject a report whose SHA is not the PR's head. Open every blocking finding's
`file:line`; drop one that does not reproduce, and say you dropped it. A red
`verify-runner` result is a blocking finding with its failing command.

## 5. Report

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

## 6. Fix round

When the branch has new commits, fetch, move the worktree
(`git -C <worktree> checkout --detach <new sha>`) and re-dispatch only the
reviewers that raised a finding, each prompt opening `Re-review of <old sha>`
with the findings posted. A merge from the base in that range needs a full
review instead.

## 7. Remove the worktree

Once the PR merges or closes: `git worktree remove <worktree>`. It is
detached and holds nothing of its own. From a session that is itself inside a
worktree the command is refused (`develop-feature/worktree-cleanup.md`) —
leave it and tell the user the path.

## A PR that merged without this review

Run the same steps against the merge commit (base: its first parent). There
is no branch to fix, so each finding worth acting on is put to the user as a
proposed follow-up, never posted on the PR.

# Stacked PRs — `gh stack` mechanics

Read only once the user has asked for a stack. Viability (the bottom PR green
on `main` alone, or expand/contract, or one PR) is `CLAUDE.md` "Stacked PRs".
Independent pieces never stack: each gets its own branch off `main`. Use the
installed `github/gh-stack` extension, never hand-rolled
`gh pr create --base <branch>`:

```bash
gh stack init                 # start a stack targeting main
gh stack init b1 b2 b3        # or adopt existing branches as a stack
gh stack add <branch>         # add a branch on top of the current stack
gh stack view                 # see the current stack
gh stack push                 # force-push every stack branch        — Gate 3
gh stack submit               # push all, create/update the PRs      — Gates 3 + 4
gh stack sync                 # fetch, restack, force-push all       — Gate 3
```

- **`push`, `sync` and `submit` all push** every stack branch with
  `--force-with-lease`, so each run needs its own fresh Gate 3 approval;
  `submit` also opens PRs, so it needs Gate 4 too. Run `sync` after every
  lower PR merges — the step most often forgotten — but ask first.
- **Never run `gh stack merge`** — merging is the human's.
- **`submit` from an agent's shell is non-interactive**: it skips its editor,
  uses auto-generated titles and no body, and opens drafts — keep them drafts
  (never `--open`), as Gate 4 does. Then run
  `gh pr edit <pr> --title "…" --body "…"` on each new PR per "PR body
  template", and Gate 5 for each.

**Every stacked PR runs the full required suite** because the two workflows
behind the required checks — `ci.yml` and `workflow-security.yml` — declare a
bare `pull_request:` trigger. Never add a `branches:` filter to one: a required
check that never starts leaves the PR `BLOCKED` forever instead of failing it
(`ci.yml`'s header). The check list: `docs/context/ci-automation.md`.

**Collapsing a stack after the fact:**

1. Retarget the _top_ PR, which already holds every commit:
   `gh pr edit <top> --base main`.
2. Close the others as superseded, and move every stacked issue's
   `Closes #<n>` onto the survivor.
3. Ask to push (Gate 3), then run `gh pr update-branch <top>` to merge
   `main` into the survivor.

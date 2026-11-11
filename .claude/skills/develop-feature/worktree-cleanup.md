# Removing subagent worktrees and scratchpads

The procedure behind `develop-feature` §8. `CLAUDE.md` delivery gate step 8
states the rules — your own dispatch record only, lock files, an isolated
session exiting first, scratchpads by exact path.

Nothing else removes these: a `worktree-agent-*` branch is never pushed, so
the harness never sweeps it, and a subagent cannot remove the worktree it
stands in.

## First: is this session itself inside a worktree?

If you ran `EnterWorktree` (every background job does), exit it as `CLAUDE.md`
step 8 says — `ExitWorktree` with `action: "keep"`, because `remove` would
also delete the branch and the removal below is the checked path. The
isolation guard that refuses `git -C <other worktree>` and
`git worktree remove` from inside is a different guard from the lock file; no
workaround (a wrapper script, a `cd` that hides the target, disabling the
sandbox) is in bounds.

## The checks

For each worktree on your own list:

```bash
name=$(basename <worktree>)
lock=$(git rev-parse --git-common-dir)/worktrees/$name/locked
[ -f "$lock" ] && echo "OWNED BY: $(cat "$lock")"  # -> skip, not yours
git fetch origin                                  # stale refs answer the wrong question
branch=$(git -C <worktree> branch --show-current)
git -C <worktree> status --porcelain              # must be EMPTY
git cherry <target> "$branch"                     # must print no '+' lines
git worktree remove <worktree>                    # never --force
```

- **Remove only when all three pass** — unlocked, clean, landed.
- A lock names its owner and pid: another job, or one of your own unfinished
  subagents. `fatal: cannot remove a locked working tree` is the guard
  working — skip the path and don't retry it.
- **Until the PR merges, `<target>` is the `feat/` branch, not
  `origin/main`** — the work is unmerged, so against `origin/main` everything
  looks unlanded. Before the push it is your local `<feat-branch>`
  (layer-agent worktrees only); after the push it is `origin/<feat-branch>`,
  which also proves the work reached the remote.
- **Use `git cherry`, not `git rev-list --count`** — rev-list counts SHAs, so
  a squash- or rebase-merged branch still looks ahead.
- A dirty `status` is uncommitted work that exists nowhere else: leave the
  worktree and tell the user what is in it.
- Removal keeps the branch, which is what makes it safe.
- A worktree whose root `node_modules` is a real directory, not a symlink
  (created before #410, or given a private tree for a dependency change),
  deletes slowly. Remove those one at a time with a generous timeout. An
  interrupted removal leaves a half-deleted worktree that needs `--force` —
  the flag's one legitimate use: on a worktree you own and were already
  removing, never `-f -f` on a locked one.
- `git worktree prune` is safe (it drops metadata for directories already
  gone); a loop over `git worktree list` is not.
- Leftovers from earlier sessions are a separate, explicitly requested
  cleanup — then the same three checks, one path at a time, still skipping
  every locked one.

## After the PR merged

The same three checks with `<target>` = `origin/main` — GitHub deletes the
`feat/` branch on merge, so `origin/<feat-branch>` no longer resolves.

- **A "removing will discard N commits" refusal is usually false.** The
  `ExitWorktree`/cleanup guard counts against your local `main`, which does
  not move when a PR merges on GitHub. Don't answer it with
  `discard_changes: true` on reflex; settle it:

  ```bash
  git fetch origin
  git merge-base --is-ancestor <branch> origin/main && echo MERGED || echo NOT-MERGED
  ```

  `MERGED` → discarding loses nothing. `NOT-MERGED` → the guard is right;
  keep the worktree and tell the user what is in it.

- **Fix the cause:** once the working tree is clean,
  `git merge --ff-only origin/main` syncs local `main` and the guard stops
  firing on merged branches.

## Scratchpad transfer buffers

An agent's `.claude/scratchpad*/` export is a transfer buffer, not a record.
Once the work is pushed, git holds it — delete the buffer in the same pass.

- **Not before the push.** Until then the export can be the only surviving
  copy, because idle agent worktrees are torn down with their uncommitted
  files.
- **Exact paths from your dispatch record, one at a time — never a
  wildcard.** A scratchpad has no lock file, so `rm -rf` on another job's
  buffer succeeds silently. Issue-keyed names are not ownership either: one
  issue collects variants across sessions (`1786/`, `1786-tests/`).
- Leftovers from earlier sessions are a separate, explicitly requested
  cleanup that first confirms no live job is still writing to them.

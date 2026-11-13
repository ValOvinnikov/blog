# Review misses

A defect that reached an open PR, or `main`, past a check that should have
stopped it. The log is how the review tooling changes on evidence instead of
by accretion: three entries naming the same check are the case for changing
that check, and an entry no check could have caught is the case for leaving
the tooling alone.

**When to add an entry** (`review-pull-request` §6): a PR review or a
post-merge review confirms a blocking finding that an earlier gate saw the
same diff and passed — the cloud session's `pnpm verify`, a `reviewer` or
`correctness-reviewer` report, CI. A finding on a diff no gate had seen yet is
the review working, not a miss.

**What an entry says** — one row, newest first:

| Date | PR  | What got through | Gate that passed it | Why it passed | Change made |
| ---- | --- | ---------------- | ------------------- | ------------- | ----------- |

- **Why it passed** names the mechanism: the rule exists but nothing ran it,
  the rule is missing, the reviewer was not given the input (the acceptance
  criteria, the PR body), or the ticket changed after the work started.
- **Change made** is a script or lint rule first, an agent input second, and a
  new checklist line last — or "none" with the reason.

## Log

| Date       | PR    | What got through                                                                                       | Gate that passed it                                                 | Why it passed                                                                                                      | Change made                                                                                              |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 2026-11-13 | #7335 | `/favicon.ico` threw: the renderer was given `background: undefined` for the transparent mark          | `reviewer` and `correctness-reviewer` (both APPROVE); `pnpm verify` | The route test mocked the renderer and no gate executed it; both reviewers listed "no build run" under Not checked | None yet: a second entry of this kind is the case for running a touched route handler once in review     |
| 2026-11-12 | #7263 | The db slice of #6876 shipped without clearing `self_serve_owner_email_index` on a move to a paid plan | The cloud session's self-review; `reviewer` (APPROVE)               | No gate read the diff against the issue, and the issue's delivery line was edited after the PR opened              | `correctness-reviewer` maps each criterion to a `file:line`; `review-pull-request` §5 re-reads the issue |

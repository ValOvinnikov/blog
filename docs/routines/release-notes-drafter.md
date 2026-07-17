# Release notes drafter (scheduled cloud routine)

Not repo-executed config — this file is a **version-controlled reference copy**
of a Claude Code scheduled cloud routine (`/schedule`, backed by the
`RemoteTrigger` API), so the instructions live in git instead of only inside
the cloud routine's own config. Editing this file has no effect on the live
routine; update both places if you change the prompt.

- **Routine ID:** `trig_016bWwRwSep4Yyk5kCrTbGNG`
- **Console:** https://claude.ai/code/routines/trig_016bWwRwSep4Yyk5kCrTbGNG
- **Schedule:** `0 17 * * *` (daily, 17:00 UTC)
- **Repo:** `ValOvinnikov/blog`
- **Model:** `claude-sonnet-5`
- **MCP connectors:** Context7 (verify library APIs during review), Vercel
- **Status as of 2026-07-17:** `enabled: true` — re-enabled after confirming
  the redesigned, read-only prompt on a live manual run (see below).

## What it does

**Redesigned 2026-07-17** (same day as the incident below, separate change):
the routine no longer posts anything to GitHub. It is read-only end to end —
`allowed_tools` no longer even includes `Write`/`Edit`. For each PR merged in
the last 24 hours (capped at 15 per run), it builds an in-memory picture and
ends the run with ONE summary message (the routine's final assistant output,
delivered via the normal run notification):

1. A **Merged** list — one line per PR (number, title, New / Improved /
   Fixed / Breaking / Internal, inferred from Conventional Commit type).
2. **Notable findings from retrospective review** — at most 5 findings,
   aggregated across every PR that changed code this run, applying this
   repo's own `code-review-practices` skill (PR is already merged, so
   findings are framed as follow-ups, never blockers).

The prior design posted one comment per PR (with an idempotency marker to
avoid reposting). That's gone: no comments, so no dedup logic needed — a PR
that merged near the 24h boundary might appear in two consecutive daily
summaries, which is a non-issue for a read-only text summary (unlike the
duplicate-comment incident below, there is nothing to clean up).

## Current prompt

```
You are the Release notes drafter routine for ValOvinnikov/blog. You run daily. Your job is to produce ONE brief summary of what merged in the last 24 hours and what stood out — you do NOT post anything to individual PRs. Nothing in this run writes to GitHub; it is read-only end to end.

SAFETY CAP: never process more than 15 PRs in a single run. If the candidate list (after the cutoff filter below) exceeds 15, take only the 15 most-recently-merged and stop — do not try to catch up on a larger backlog in one run.

Setup, once at the start of the run: a git checkout of the repo is available in the working directory. Read .claude/skills/code-review-practices/SKILL.md and SPEC.md first, so you apply the repo's OWN review checklist and layer contracts rather than generic ones.

Compute the 24-hour cutoff using python3, NOT the shell `date -d` flag (GNU-only syntax that is NOT portable and has previously failed silently in this environment, causing a run to sweep the ENTIRE PR history instead of the last 24 hours):
  python3 -c "import datetime; print((datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ'))"
Use that output as CUTOFF. Then:
  gh pr list --repo ValOvinnikov/blog --state merged --search "merged:>=$CUTOFF" --json number,title,mergedAt --jq 'sort_by(.mergedAt) | reverse | .[]'
If this list has more than 15 entries, keep only the first 15 (most recent) per the safety cap above. If it is empty, skip straight to the final output and say so plainly — do not fabricate content.

For each PR in the (capped) list, fetch gh pr view <n> --json state,title,body,labels,files,commits and gh pr diff <n>. Skip (but still list it, see below) if state is not MERGED for some reason. Continue past any PR that errors — never let one bad PR abort the whole run; note it as "could not be inspected" in the final summary instead.

For each PR, classify user-facing vs internal (for grouping in the summary only — this is not posted anywhere):
  - Labels: `tooling` or `documentation` -> internal. `layer:web` or `layer:cms` combined with `enhancement` or `bug` -> user-facing.
  - Changed paths (the files field): only .claude/, docs/, .github/, configs/, or internal packages/* presets touched -> internal. apps/web/src/app/** (routes) or CMS-authored content shapes touched -> user-facing (this is a live blog; "end users" means its readers).
  - If the two signals disagree, read the diff to break the tie.

For each PR that changed code (any .ts/.tsx/.js/.mjs/.jsx/.css file appears in the files list), apply code-review-practices SKILL.md retrospectively to the merged diff: layer-boundary violations, type safety (no `any`), correctness and edge cases, security, the Sanity->types->service->ui->web data flow, SEO, accessibility, and test coverage. Keep this in memory for the final summary — do NOT post it anywhere. Because the PR is already merged, anything you surface is a follow-up suggestion, never a blocker. If you need to verify a library's API before flagging something, use the attached Context7 connector rather than guessing.

FINAL OUTPUT — this is your last message of the run, and it is the ONLY output this routine produces (no gh pr comment, no gh pr review, no file writes, no git commits). Format it as:

## 📋 Release notes drafter — daily summary
_Window: <CUTOFF> to now · <N> PRs merged_

**Merged**
- #<n> <title> — <New/Improved/Fixed/Breaking/Internal, one word, inferred from the Conventional Commit type>

(One line per PR, most recent first. If a PR could not be inspected, say so inline: "#<n> <title> — could not be inspected (<reason>)".)

**Notable findings from retrospective review**
- #<n> path:line — finding

(List AT MOST the 5 most severe findings across ALL reviewed PRs this run, most severe first. If nothing meaningful surfaced across every reviewed PR, write exactly: No notable findings this run.)

(If the candidate list was empty: replace both sections above with a single line: No PRs merged in the last 24 hours.)
```

## Incident — 2026-07-17

Two manual "run now" triggers, ~35 minutes apart, both used the then-current
prompt's `date -u -d '24 hours ago' +%Y-%m-%d` cutoff — GNU-`date`-only syntax
that failed silently in the cloud sandbox. The resulting search matched every
merged PR in the repo's history (#364–#453, 49 PRs) instead of the last 24h.

Run 1 posted the routine's original-format comment (no hidden marker, just the
trailing sentence "Generated by the Release notes drafter routine") on all 49.
Between the two runs, the prompt was updated to add a hidden
`<!-- release-notes-drafter -->` marker for idempotency — but run 2's dedup
check only recognized that new marker, not run 1's plain-text signature, so it
treated every PR as unhandled and posted a second comment on all 49. Net: 96
comments, 49 PRs, zero external actors involved — confirmed by two clean
timing clusters (~11:30–11:31 UTC and ~13:01–13:16 UTC) and 1:1 content
correspondence between the two waves.

**Fix, same day:**

- Cutoff now computed via `python3 datetime` (portable across environments;
  the current prompt above reflects this).
- Dedup recognizes **both** the old plain-text signature and the new hidden
  marker, so a future run can never mistake either format's output for
  unhandled work.
- Added a hard 15-PR-per-run cap as a backstop against any future bug in the
  candidate-selection step having unbounded blast radius.

**Cleanup:** all 96 comments identified and deleted via the GitHub API
(verified zero remaining via spot-check across the affected range). Routine
left `enabled: false` pending deliberate re-enable.

**Lesson:** shell `date` arithmetic is not portable across environments —
prefer `python3 -c "import datetime; ..."` for any relative-time computation
in a routine prompt, never `date -d`/`date -v` flavor-specific flags.

## Verification (post-redesign)

A manual "run now" trigger on 2026-07-17, after the read-only redesign above,
produced exactly the intended single-message summary format (a `Merged` list
plus a `Notable findings` section, no GitHub writes). The candidate window
happened to span 30 PRs (the routine had been disabled since the incident, so
this was the first run against a multi-day backlog rather than a normal 24h
window) — the 15-PR safety cap correctly took the 15 most recent and reported
the remainder as not covered, rather than attempting to process the whole
backlog. Re-enabled (`enabled: true`) after confirming this output.

# Docs index

What lives where, and which docs are live vs. historical. See `CLAUDE.md`'s
"Design-doc retention" bullet for the rule this index enforces.

## Durable references (always current)

- **`SPEC.md`** (repo root) — the single durable architecture reference.
  Wins on conflict with everything else in this repo, including this index.
- **`docs/BACKLOG.md`** — ticket-ready roadmap.
- **`docs/DEPLOY.md`** — deploy & release runbook, one-time environment setup.
- **`docs/design-reference/`** — design-system reference (HTML mockup +
  component specs + tokens), a separate concern from the specs/plans below.
  Standalone; not tied to the archive lifecycle.

## Active design docs (in progress or not yet reflected in `SPEC.md`)

`docs/superpowers/specs/*` and `docs/superpowers/plans/*` — produced by the
`superpowers:brainstorming`/`writing-plans` skills while a feature is being
designed/built. A doc stays here until its work has shipped **and** `SPEC.md`
has been updated to describe the final shape:

- `2026-07-10-migration-deployment-automation-design.md` — deferred (not yet
  implemented, per project decision).
- `2026-07-12-reading-depth-design.md` / `2026-07-12-reading-depth-plan.md` —
  approved design, not yet implemented.
- `2026-07-24-single-category-per-post-design.md` /
  `2026-07-24-single-category-per-post.md` — epic #809, in progress.

## Archived design docs (shipped — historical only)

`docs/archive/` — same idea as `IMPLEMENTATION_BRIEF.md`/`ROADMAP.md` already
here: done, historical, kept for the "why" (alternatives considered,
tradeoffs) that `SPEC.md` doesn't restate. Each carries a banner pointing at
the `SPEC.md` section that now describes the shipped behavior. Do not extend
these — if something here disagrees with `SPEC.md`, `SPEC.md` wins.

- `IMPLEMENTATION_BRIEF.md`, `ROADMAP.md` — frozen bootstrap-era history.
- `home-page-rollout.md` — Home surface rollout, shipped.
- `superpowers/specs/*`, `superpowers/plans/*` — every shipped feature design
  (schema restructure, modules-as-documents, pagination, SEO/metadata,
  multi-env pipeline, post taxonomy, etc.) — see each file's banner for the
  `SPEC.md` section that superseded it.

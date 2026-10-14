# Docs index

What lives where, and which docs are live vs. historical. See `CLAUDE.md`'s
"Design-doc retention" bullet for the rule this index enforces.

## Durable references (always current)

- **`SPEC.md`** (repo root) — the single durable architecture reference.
  Wins on conflict with everything else in this repo, including this index.
  Section numbers are stable — see its own header note before renumbering
  anything.
- **`README.md`** (repo root) — what the project is and where things live;
  intentionally short. Setup and deep-dive detail live in `docs/context/`.
- **`docs/context/`** — one focused file per topic, linked from `README.md`
  and `SPEC.md` rather than inlined there:
  - `getting-started.md` — local setup, env vars, scripts, dependency catalogs.
  - `claude-code.md` — every subagent/hook/skill/MCP server this repo ships.
  - `ci-automation.md` — every GitHub Actions workflow, required vs. advisory.
  - `frontend-conventions.md` — dependency rules, type flow, SVG icon wiring.
  - `environment-variables.md` — the complete env var reference.
  - `content-model.md` — full Sanity schema reference + migrations.
  - `data-flow.md` — typegen → service → web data flow, module registry.
  - `rendering-caching-i18n.md` — ISR, the skim pipeline, i18n mechanics.
  - `seo-accessibility.md` — metadata, JSON-LD, breadcrumbs, a11y checklist.
  - `surfaces-and-routing.md` — routing conventions + per-surface layout history.
- **`docs/features/`** — the feature catalogue: one `<feature>.md` per
  feature (what it does, surfaces, data, configuration, invariants, entry
  points), indexed by status and layers in `docs/features/README.md`. Every
  shipped feature has a page; a PR that changes a feature updates its page,
  and one that adds a feature adds its page (`CLAUDE.md`'s "Feature docs"
  bullet).
- **`docs/BACKLOG.md`** — ticket-ready roadmap.
- **`docs/DEPLOY.md`** — deploy & release runbook, one-time environment setup.
- **`docs/design-reference/`** — design-system reference (HTML mockup +
  component specs + tokens), a separate concern from the specs/plans below.
  Standalone; not tied to the archive lifecycle.

## Active design docs (in progress or not yet reflected in a feature page)

`docs/superpowers/specs/*` and `docs/superpowers/plans/*` — produced by the
`superpowers:brainstorming`/`writing-plans` skills while a feature is being
designed/built; see the directory listing for what's currently active. When
one is done and when it is deleted — into its `docs/features/` page, not into
`SPEC.md` — is `CLAUDE.md`'s "Design-doc retention" rule, including early
retirement into an epic body.

## Archived design docs (frozen history — pre-2026-07-27 only)

`docs/archive/` — same idea as `IMPLEMENTATION_BRIEF.md`/`ROADMAP.md` already
here: done, historical, kept for the "why" (alternatives considered,
tradeoffs) that `SPEC.md` doesn't restate. Each carries a banner pointing at
the `SPEC.md` section that now describes the shipped behavior. **This bucket
is closed — no new entries.** Design-doc retention changed 2026-07-27 from
archive-on-ship to delete-on-ship (`CLAUDE.md`'s "Design-doc retention"
rule); everything below predates that change and is kept as-is, but a doc
finishing today is deleted, not moved here. If something here disagrees with
`SPEC.md`, `SPEC.md` wins.

- `IMPLEMENTATION_BRIEF.md`, `ROADMAP.md` — frozen bootstrap-era history.
- `home-page-rollout.md` — Home surface rollout, shipped.
- `superpowers/specs/*`, `superpowers/plans/*` — every shipped feature design
  (schema restructure, modules-as-documents, pagination, SEO/metadata,
  multi-env pipeline, post taxonomy, etc.) — see each file's banner for the
  `SPEC.md` section that superseded it.

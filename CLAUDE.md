# CLAUDE.md

Guidance for working in this repo. See `SPEC.md` (architecture — the single
durable reference) and `docs/BACKLOG.md` (ticket-ready roadmap).
`IMPLEMENTATION_BRIEF.md` is archived history; when it disagrees with
`SPEC.md`, the spec wins.

## What this is

A Turborepo + pnpm monorepo for a headless-CMS blog. Sanity Studio (v6) authors
content; a Next.js 16 App Router site renders it; types flow end-to-end.

## Layer contracts (do not violate)

```
web → ui, service, config, utils   service → config, utils (no React)
ui → config (no Sanity/fetch)      cms → config (types via typegen)
configs/* → consumed by all        graph is acyclic
```

- `@blog/ui` is pure and prop-driven — never imports `service`/`sanity`/`fetch`.
- `@blog/service` is the only package importing the Sanity SDKs; never imports React.
- `apps/web` is the only place `ui` and `service` meet (Server Components fetch,
  pass typed props to `ui`).
- Content shapes come from the generated Sanity types in `@blog/config`
  (`packages/config/src/sanity/generated/types.ts`, produced by typegen) —
  never hand-redeclared.

## Start here for any non-trivial task

Run the **`develop-feature`** skill first. It's the lifecycle playbook —
investigate → plan → delegate each layer → test → review → commit (deploy is
human-gated) — and it says which subagent owns which step. Subagents are not an
automatic pipeline; this skill is how the right ones get used in the right order.

## Use the scoped agents

Delegate layer work to the matching subagent in `.claude/agents/`, in dependency
order (`cms → service → ui → web`):
`cms` (schemas/typegen), `service` (data layer), `ui` (design system),
`web` (frontend/SEO + composition).

**Orchestrator must not write layer files before delegating.** Do not create
stub or partial files in a layer owned by a subagent — the subagent owns file
creation end-to-end and applies the layer's skill conventions from the start.
Handing a subagent pre-written stubs bypasses those conventions and breaks the
delegation model. If you need to communicate structure, describe it in the
prompt — do not write it to disk first.

## Use the skills

- `develop-feature` at the start of any non-trivial task (lifecycle + delegation).
- `add-content-type` when a change spans more than one workspace.
- `cms-schema-practices` when touching `apps/cms` schemas or migrations.
- `ui-library-practices` when touching `packages/ui`.
- `ui-storybook` when adding or editing stories in `packages/ui`.
- `web-storybook` when adding or editing stories in `apps/web`.
- `testing-practices` when adding/updating tests.
- `seo-and-metadata` when changing routes, metadata, or feeds.
- `code-review-practices` before opening a PR.
- `open-pull-request` when shipping an issue: branch → work → PR → assign (push is human-gated).
- `use-context7` before implementing against any library API you are not certain
  of — resolves live, version-matched docs via the context7 MCP server. Use
  whenever you hit a deprecation, an unfamiliar config format, or a CLI flag you
  would otherwise guess at.

## Conventions

- All workspace source files live under `src/` within each package/app.
  Exceptions: root-level config files required by their tool (`sanity.config.ts`,
  `sanity.cli.ts`, `next.config.ts`, `vitest.config.ts`, etc.) stay at the
  package root.
- TypeScript `strict`; no `any`. Server Components by default.
- **Key/value-pair consts are always both UPPERCASE** (key === uppercase value),
  `as const`, and live in `@blog/config` (`constants/`). e.g.
  `export const TLINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' } as const;`
  The uppercase value is the stored/serialized value, so schema `options.list`
  and migrations use it too; derive unions with `(typeof C)[keyof typeof C]`.
- `'use client'` never in `@blog/ui` (it stays pure and prop-driven). In
  `apps/web` it IS the right tool — add it at the _leaf boundary_ that
  genuinely needs the client: React hooks (`useState`/`useEffect`), browser
  APIs, event handlers, or wrapping a third-party component that uses hooks
  internally (e.g. the `sanity-image` wrapper). Keep it as low in the tree as
  possible, not on whole pages.
- Co-locate `*.test.ts(x)`; `pnpm test` must pass.
- After a schema change: `pnpm typegen`, then commit the regenerated files in
  `packages/config/src/sanity/generated/`. Typegen can be non-deterministic —
  re-run until the diff is minimal.
- **Check for migrations.** Content is live in the `production` dataset, so any
  change that alters an _existing_ shape — renaming/removing/moving a field,
  renaming a `_type`, restructuring a document — orphans data unless existing
  documents are migrated. Before implementing, decide: does this need a data
  migration? If yes, **surface a migration plan and prompt the user** (which
  documents/fields change, the `sanity/migrate` transform, dry-run → backup →
  human-gated run) — do not just change the schema. Additive, optional-only
  changes need no migration; say so explicitly. Use the tooling and workflow in
  `apps/cms/migrations/` (`README.md` + `migrate:dry`/`migrate:run`/`dataset:export`).
  Migrations against `production` are human-gated like `sanity deploy`.
- Verify with `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` from root.
- Conventional commits, one concern per PR.
- **Prefer per-layer PRs.** Split a multi-layer feature into separate PRs per
  layer (`cms → service → ui → web`, dependency order) so each review stays small
  and focused. **Split only when each layer's PR merges to `main` green on its
  own** (typically additive changes). Keep it a single PR when a partial merge
  would break the build — e.g. renaming a shared `_type` or generated type that
  downstream consumes reds `type-check` until every layer lands.
- **Spec sync:** any PR that changes architecture, layer contracts, env vars,
  or the content model updates `SPEC.md` in the same PR.
- `.claude/skills/` is canonical; `.agents/skills/` mirrors it for other
  harnesses — when you edit a skill, apply the same change to both copies.

## Delivery gate sequence (mandatory — never skip or bundle)

Every issue follows this exact order. **Stop and wait for explicit user approval at each gate.**

1. Set issue → In Progress on the board
2. Checkout branch from `main`
3. Do the work + run quality gates
4. **Ask to commit** — present "commit now" vs "review first"; wait for answer
5. **Ask to push** — separate question, after commit; wait for answer
6. **Ask to open PR** — separate question, after push; wait for answer.
   Once approved: run `gh pr create`, then **immediately** set the issue → Code Review
   on the board — do not report the PR URL until the board update is done.

**Broad instructions ("go ahead", "keep going", "pick the next issue") authorize the work only — never the commit, push, or PR.** Those three gates always require fresh, explicit confirmation.

## Don't

- Run `sanity deploy` / Vercel deploys (human-gated).
- Read or commit `.env*` files.
- Add a cross-layer import that creates a cycle.
- Commit, push, or open a PR without explicit approval for that specific action.

# Blog

[![CI](https://github.com/ValOvinnikov/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/ValOvinnikov/blog/actions/workflows/ci.yml)

A CMS-driven blog built as a **Turborepo + pnpm monorepo** with strict
separation of concerns: a headless Sanity Studio for authoring, a Next.js
frontend for reading, a portable design system, and a typed data layer — with
end-to-end TypeScript type safety from schema to screen.

> **Docs:** [`SPEC.md`](./SPEC.md) is the durable product + architecture
> reference — start there. [`docs/BACKLOG.md`](./docs/BACKLOG.md) is the
> ticket-ready roadmap. [`IMPLEMENTATION_BRIEF.md`](./IMPLEMENTATION_BRIEF.md)
> is the archived bootstrap playbook (historical only).

## Stack

- **Next.js 16** (App Router, React Server Components, TS strict) + **React 19** — `apps/web`
- **Sanity Studio v6** (headless CMS, typegen source) — `apps/cms`
- **Tailwind CSS v4** with shared design tokens + `tailwind-variants`
- **next-intl** i18n (locale-prefix-free URLs)
- **Atomic Design** component library — `packages/ui`
- **Vitest + Testing Library** for unit tests; **Storybook** in `ui` and `web`
- **Turborepo + pnpm** workspaces, **TypeScript** everywhere

## Monorepo layout

```
apps/
  cms        Sanity Studio: schemas, editorial UI, typegen source   (cms)
  web        Next.js frontend: routes, SEO, composition             (web)
packages/
  service    Data access: Sanity client, groqd queries, transformers (@blog/service)
  ui         Atomic Design component library (pure, prop-driven)     (@blog/ui)
  config     Constants, generated Sanity types, shared TS types      (@blog/config)
  utils      Framework-free helpers (async, primitives)              (@blog/utils)
configs/
  eslint / prettier / tailwind / tsconfig / vitest presets           (@blog/*-config)
```

### Dependency rules (enforced, acyclic)

```
web → ui, service, config, utils
service → config, utils   (no React, ever)
ui → config               (no Sanity, no data fetching — stays publishable)
cms → config              (generates the types typegen ships into config)
configs/* → consumed by all
```

`web` is the **only** place `ui` and `service` meet: Server Components fetch
data through `service` and pass plain typed props into `ui`. Internal packages
ship raw TypeScript (Just-in-Time pattern) and are transpiled by the web app via
`transpilePackages`.

## Getting started

Requires **Node 20.19+** and **pnpm 9+**.

```bash
pnpm install

# Copy env templates and fill in your Sanity project values
cp apps/web/.env.example apps/web/.env.local
cp apps/cms/.env.example apps/cms/.env.local
```

Environment variables (see `.env.example`):

| Variable                        | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project id                        |
| `NEXT_PUBLIC_SANITY_DATASET`    | usually `production`                     |
| `NEXT_PUBLIC_SITE_URL`          | canonical origin for SEO / sitemap / RSS |
| `SANITY_API_READ_TOKEN`         | drafts / preview only                    |
| `SANITY_REVALIDATE_SECRET`      | on-demand ISR webhook secret             |

Add `http://localhost:3000` (and your deployed origin) to the project's CORS
origins at [manage.sanity.io](https://manage.sanity.io).

## Scripts (run from the repo root)

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `pnpm dev`        | Run all workspaces in dev (Next.js + Sanity Studio) |
| `pnpm build`      | Build everything (`typegen` runs first)             |
| `pnpm test`       | Run Vitest across packages                          |
| `pnpm test:watch` | Vitest in watch mode                                |
| `pnpm type-check` | `tsc --noEmit` across the graph                     |
| `pnpm lint`       | ESLint across packages                              |
| `pnpm typegen`    | Regenerate Sanity types into `@blog/config`         |
| `pnpm format`     | Prettier write                                      |

Scope to one workspace with `pnpm --filter <name>`, e.g.
`pnpm --filter web dev` or `pnpm --filter @blog/ui test`.

## Content model

Defined as Sanity schemas in `apps/cms/src/schema-types/` (current model in
`SPEC.md` §6): `post`, `author`, `category`, `page`, the `homePage` /
`siteSettings` / `settings_navigation` / `settings_footer` singletons, and
shared objects (unified `link`, `seo`/`openGraph`, `imageWithAlt`, `brand`).
Schema changes regenerate `packages/config/src/sanity/generated/types.ts` via
`pnpm typegen` — commit the generated files. Changes to _existing_ shapes need
a content migration (`apps/cms/migrations/README.md`) — production runs are
human-gated.

## Type flow

```
Sanity schema (cms) ──typegen──► @blog/config ──► @blog/service ──► web ──props──► @blog/ui
```

One source of truth: a schema change surfaces as a TypeScript error anywhere a
consumer is out of date.

## Working with Claude Code

This repo ships Claude Code configuration so contributors stay inside the layer
contracts:

- **Scoped subagents** (`.claude/agents/`) — one per layer, primed with that
  layer's rules:
  - `cms` — Sanity schemas, content modelling, typegen.
  - `service` — Sanity client, GROQ, typed fetchers (no React).
  - `ui` — building the pure, publishable `@blog/ui` design system.
  - `web` — App Router routes, SEO, composition of `ui` + `service`.
  - `reviewer` — read-only pre-commit review of the full diff; gates the
    commit ask on an `APPROVE` verdict.
- **Hooks** (`.claude/hooks/`, wired in `.claude/settings.json`):
  - `post-edit-lint.sh` — `PostToolUse` hook that lints every agent-edited
    `.ts`/`.tsx` file and feeds errors — including layer-boundary
    `no-restricted-imports` violations — back to the agent in the same turn.
    Report-only (never `--fix`); the commit-time gates stay authoritative.
- **Skills** (`.claude/skills/`):
  - `develop-feature` — the lifecycle playbook (investigate → delegate per layer → test → review → commit); start here for non-trivial work.
  - `add-content-type` — end-to-end recipe spanning all layers (schema → types → service → ui → web).
  - `cms-schema-practices` — Sanity schema quality bar + content-migration workflow.
  - `ui-library-practices` — building pure, prop-driven design-system components.
  - `ui-storybook` / `web-storybook` — Storybook conventions per workspace.
  - `testing-practices` — Vitest + Testing Library conventions.
  - `seo-and-metadata` — per-route metadata, JSON-LD, sitemap/robots/RSS.
  - `code-review-practices` — boundary/type/SEO/test checklist before a PR.
  - `open-pull-request` — branch → work → PR with human-gated push/PR steps.
  - `use-context7` — fetch live, version-matched library docs before guessing.
- **Settings** (`.claude/settings.json`) — permission allowlist for the standard
  pnpm/turbo/sanity/git/gh commands and hook wiring; deploys and `.env` reads
  are denied.
- **`CLAUDE.md`** — repo-wide guidance loaded into every session.

## CI & automation

All automation lives in `.github/workflows/` (shared pnpm/Node setup in
`.github/actions/setup`; Dependabot bumps npm + GitHub Actions weekly).

| Workflow                                          | Trigger                                                 | What it does                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI** (`ci.yml`)                                 | every PR to `main`                                      | The quality gates: **Type-check**, **Lint**, **Test**, **Typegen** (regenerates schema + types and fails if the committed output in `packages/config/src/sanity/generated/` is stale), **Skills sync** (`.claude/skills` ↔ `.agents/skills` mirror), **Migrations** (loads every migration + read-only dry-run against the dataset), **Build**. |
| **Dependency Review**                             | every PR to `main`                                      | Blocks dependency changes with known vulnerabilities (`fail-on-severity: high`; no license policy configured).                                                                                                                                                                                                                                  |
| **Zizmor** (`zizmor.yml`)                         | every PR to `main`                                      | Static security analysis of the workflow files themselves.                                                                                                                                                                                                                                                                                      |
| **Claude Code Review** (`claude-code-review.yml`) | PR opened/updated (code paths, owner PRs only)          | Automated AI review posted on the PR; advisory, not a required check.                                                                                                                                                                                                                                                                           |
| **Claude Code** (`claude.yml`)                    | `@claude` mentions (owner-only, owner-authored threads) | Interactive agent runs on issues/PRs.                                                                                                                                                                                                                                                                                                           |
| **Deploy Development** (`deploy-development.yml`) | push to `main` (+ manual dispatch)                      | `turbo-ignore` change detection → verify (type-check/lint/test/build) → auto-apply pending content migrations to the dev dataset → deploy only the affected app(s) to the dev environment.                                                                                                                                                      |
| **Deploy Production** (`deploy-production.yml`)   | `vX.Y.Z` tag push                                       | Verify → back up the production dataset (artifact) → gated prod content migration → deploy Studio + web to production. Cutting a release = pushing a tag, so it stays under the human push gate.                                                                                                                                                |

**Required status checks on `main`:** Type-check, Lint, Test, Typegen, Build,
Migrations, Dependency Review. Everything else is advisory. CI runs on every
PR without path filters on purpose — a path-skipped workflow leaves its
required checks pending forever (see the comment in `ci.yml`).

One-time environment setup (datasets, tokens, Vercel projects, secrets,
webhooks, CORS) is human-gated console work — see [`docs/DEPLOY.md`](./docs/DEPLOY.md)
and `SPEC.md` §13. Manual `sanity deploy` / Vercel deploys are never run by
hand (agent permissions deny them; the pipeline owns deploys).

## License

Private project — all rights reserved.

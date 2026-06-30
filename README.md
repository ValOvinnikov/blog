# Blog

A CMS-driven blog built as a **Turborepo + pnpm monorepo** with strict
separation of concerns: a headless Sanity Studio for authoring, a Next.js 15
frontend for reading, a portable design system, and a typed data layer — with
end-to-end TypeScript type safety from schema to screen.

> **Specs:** [`IMPLEMENTATION_BRIEF.md`](./IMPLEMENTATION_BRIEF.md) is the ordered
> build playbook; [`SPEC.md`](./SPEC.md) is the durable product + architecture
> reference. Read the brief to build, the spec to understand.

## Stack

- **Next.js 15** (App Router, React Server Components, TS strict) — `apps/web`
- **Sanity v4** Studio (headless CMS, typegen source) — `apps/cms`
- **Tailwind CSS v4** with shared design tokens
- **Atomic Design** component library — `packages/ui`
- **Vitest + Testing Library** for unit tests
- **Turborepo + pnpm** workspaces, **TypeScript** everywhere

## Monorepo layout

```
apps/
  cms        Sanity Studio: schemas, editorial UI, typegen source   (cms)
  web        Next.js frontend: routes, SEO, composition             (web)
packages/
  service    Data access: Sanity client, GROQ, typed fetchers       (@blog/service)
  ui         Atomic Design component library (pure, prop-driven)     (@blog/ui)
  types      Generated Sanity types + shared shapes                 (@blog/types)
  config     Shared tsconfig / Tailwind preset / eslint / vitest     (@blog/config)
```

### Dependency rules (enforced, acyclic)

```
web → ui, service, types
service → types          (no React, ever)
ui → types               (no Sanity, no data fetching — stays publishable)
cms → types              (generates them via typegen)
config → consumed by all
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

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project id |
| `NEXT_PUBLIC_SANITY_DATASET` | usually `production` |
| `NEXT_PUBLIC_SITE_URL` | canonical origin for SEO / sitemap / RSS |
| `SANITY_API_READ_TOKEN` | drafts / preview only |
| `SANITY_REVALIDATE_SECRET` | on-demand ISR webhook secret |

Add `http://localhost:3000` (and your deployed origin) to the project's CORS
origins at [manage.sanity.io](https://manage.sanity.io).

## Scripts (run from the repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Run all workspaces in dev (Next.js + Sanity Studio) |
| `pnpm build` | Build everything (`typegen` runs first) |
| `pnpm test` | Run Vitest across packages |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm type-check` | `tsc --noEmit` across the graph |
| `pnpm lint` | ESLint across packages |
| `pnpm typegen` | Regenerate Sanity types into `@blog/types` |
| `pnpm format` | Prettier write |

Scope to one workspace with `pnpm --filter <name>`, e.g.
`pnpm --filter web dev` or `pnpm --filter @blog/ui test`.

## Content model

Defined as Sanity schemas in `apps/cms/schemaTypes` (full field list in the
brief §6): `post`, `author`, `category`, `page`, and a `siteSettings` singleton.
Schema changes regenerate `packages/types/src/sanity.types.ts` via `pnpm typegen`
— commit the generated file.

## Type flow

```
Sanity schema (cms) ──typegen──► @blog/types ──► @blog/service ──► web ──props──► @blog/ui
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
- **Skills** (`.claude/skills/`):
  - `develop-feature` — the lifecycle playbook (investigate → delegate per layer → test → review → commit); start here for non-trivial work.
  - `add-content-type` — end-to-end recipe spanning all layers (schema → types → service → ui → web).
  - `ui-library-practices` — building pure, prop-driven design-system components.
  - `testing-practices` — Vitest + Testing Library conventions.
  - `seo-and-metadata` — per-route metadata, JSON-LD, sitemap/robots/RSS.
  - `code-review-practices` — boundary/type/SEO/test checklist before a PR.
- **Settings** (`.claude/settings.json`) — permission allowlist for the standard
  pnpm/turbo/sanity/git commands; deploy and `.env` reads are gated.
- **`CLAUDE.md`** — repo-wide guidance loaded into every session.

## Deployment

| Workspace | Target | Setup |
|---|---|---|
| `web` | Vercel (Hobby) | Import repo → **Root Directory = `apps/web`**; add env vars. Vercel builds `types`/`service`/`ui` first automatically. |
| `cms` | Sanity-hosted | `pnpm --filter cms deploy` → served at `your-project.sanity.studio`. |

## License

Private project — all rights reserved.

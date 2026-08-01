# Blog

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/mark-dark.svg">
  <img src="docs/brand/mark-light.svg" width="72" alt="Brand mark">
</picture>

```
> brand: command not found
```

[![CI](https://github.com/ValOvinnikov/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/ValOvinnikov/blog/actions/workflows/ci.yml)

A CMS-driven blog built as a **Turborepo + pnpm monorepo** with strict
separation of concerns: a headless Sanity Studio for authoring, a Next.js
frontend for reading, a portable design system, and a typed data layer — with
end-to-end TypeScript type safety from schema to screen.

## Docs map

This README covers what the project is and where things live. Everything else
— setup, architecture detail, tooling, CI — is one link away:

| Doc                                                                                | What's in it                                                                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`SPEC.md`](./SPEC.md)                                                             | **Start here for architecture.** The durable product + architecture reference. |
| [`docs/context/getting-started.md`](./docs/context/getting-started.md)             | Local setup: install, env vars, CORS, scripts, dependency catalogs.            |
| [`docs/context/claude-code.md`](./docs/context/claude-code.md)                     | Every subagent, hook, skill, and MCP server this repo ships, and why.          |
| [`docs/context/ci-automation.md`](./docs/context/ci-automation.md)                 | Every GitHub Actions workflow, what's required vs. advisory.                   |
| [`docs/context/frontend-conventions.md`](./docs/context/frontend-conventions.md)   | Dependency rules, type flow, SVG icon import wiring.                           |
| [`docs/context/environment-variables.md`](./docs/context/environment-variables.md) | The complete env var reference (every consumer, required vs. optional).        |
| [`docs/context/content-model.md`](./docs/context/content-model.md)                 | Full Sanity schema reference + migrations.                                     |
| [`docs/BACKLOG.md`](./docs/BACKLOG.md)                                             | Ticket-ready roadmap.                                                          |
| [`docs/DEPLOY.md`](./docs/DEPLOY.md)                                               | One-time environment setup + release runbook.                                  |
| [`docs/archive/IMPLEMENTATION_BRIEF.md`](./docs/archive/IMPLEMENTATION_BRIEF.md)   | Archived bootstrap playbook (historical only).                                 |

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

Layer contracts (who may import whom) are enforced and documented in
[`SPEC.md`](./SPEC.md) §4; the low-level wiring (dependency graph, type flow,
SVG imports) is in
[`docs/context/frontend-conventions.md`](./docs/context/frontend-conventions.md).

## Getting started

See [`docs/context/getting-started.md`](./docs/context/getting-started.md) —
install, env vars, CORS, and the full scripts table.

## License

Private project — all rights reserved.

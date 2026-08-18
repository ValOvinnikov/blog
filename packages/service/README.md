# @blog/service

> The data layer that turns raw Sanity content into typed, React-free view models.

This package owns every Sanity query and content transformation in the
monorepo: a configured `next-sanity` client, groqd query builders, image URL
generation, and per-feature loaders that fetch and shape content into the
view models `apps/web` renders. It exists to keep Sanity's SDKs and its raw
document shapes out of every other layer — `web` calls a typed `service.*`
function and never sees GROQ or a `SanityDocument`.

## Layer contract

- **Depends on:** `@blog/config` (generated Sanity types, constants),
  `@blog/utils`.
- **Consumed by:** `apps/web` only.
- **Never imports:** React, or anything from `@blog/ui`. This is the only
  package in the monorepo that imports the Sanity SDKs (`next-sanity`,
  `@sanity/image-url`, `groqd`) — no other package may. It is a **sibling to
  `@blog/db`**, not a dependent: the two never import each other. Content
  shapes come from the generated types in `@blog/config`
  (`packages/config/src/sanity/generated/types.ts`) and are never
  hand-redeclared here.

## Layout

- `src/sanity/` — the Sanity plumbing: `client.ts` (read client, single- and
  multi-tenant), `write-client.ts` (scoped write client for the skim
  pipeline), `query.ts` (the groqd builder `q`, the safe query runner
  `runQuery`, and `isr()` for ISR cache tags), `image.ts` (`urlForImage`, on
  `@sanity/image-url`).
- `src/features/` — domain loaders, grouped `pages/*` (route data: home,
  generic, blog, post, category, tag, author), `modules/*` (page-builder
  module data: hero, post-list, content, cta, newsletter), `entities/*`
  (content entities: categories, posts), `global/*` (site settings,
  navigation, footer, newsletter settings, theme settings), and
  `editorial/skim` (the publish-time skim pipeline). Each feature is
  `adaptor/` (query/transformer/types/loader per action) + `application/`
  (a `createXService()` factory exposing a versioned `v1` facade) +
  `index.ts`.
- `src/shared/` — cross-feature building blocks: `fragments/` (groqd
  projections shared across features), `transformers/` (raw-to-view-model
  mappers, one per file, including `build-image-url.ts`), `filters/` (shared
  GROQ filter predicates).
- `src/testing/` — fixtures and test helpers (`mock-run-query.ts`,
  `server-only-stub.ts`) mirroring the `features/` domain tree, used by
  co-located loader/transformer tests.
- `src/utils/env/` — the validated environment schema (`NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`).
- `src/index.ts` — the public surface: the assembled `service` object and its
  view-model types. Nothing outside `src/index.ts`'s exports is meant to be
  imported by `apps/web`.

## Scripts

| Script       | Command                                  |
| ------------ | ---------------------------------------- |
| `lint`       | `pnpm --filter @blog/service lint`       |
| `type-check` | `pnpm --filter @blog/service type-check` |
| `format`     | `pnpm --filter @blog/service format`     |
| `test`       | `pnpm --filter @blog/service test`       |
| `test:watch` | `pnpm --filter @blog/service test:watch` |

The root `pnpm type-check` / `pnpm lint` / `pnpm test` run every workspace,
including this one, through Turborepo.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) — architecture and layer contracts.
- [`../../CLAUDE.md`](../../CLAUDE.md) — repo-wide conventions.
- [`../../.claude/skills/testing-practices/SKILL.md`](../../.claude/skills/testing-practices/SKILL.md) —
  fixture and loader-test conventions used throughout `src/features/`.

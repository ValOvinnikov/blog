---
name: add-content-type
description: >-
  End-to-end recipe for adding or extending a content type across every layer of
  this blog monorepo — Sanity schema → typegen (into @blog/config) →
  @blog/service query → @blog/ui component → apps/web route. Use whenever a
  feature touches more than one workspace, so boundaries and the type flow
  stay intact.
---

# Add a content type (end-to-end)

This is the cross-layer recipe. It's the procedure most likely to leak a boundary
(fetching in `ui`, hand-writing a type, GROQ in `web`), so follow the order and
let each layer's agent own its step. Architecture rules live in `SPEC.md`.

## The flow (always this direction)

```
cms (schema) ──typegen──► @blog/config ──► @blog/service ──► apps/web ──props──► @blog/ui
```

Build in dependency order. Never skip a layer; never reverse the arrows.

## Step 1 — Schema (`apps/cms`) · agent: `cms`

- **Migration check first:** if the change alters an _existing_ shape, surface
  a migration plan (`apps/cms/migrations/README.md`) before touching the
  schema. Additive optional-only changes need none — say so explicitly.
- Define/extend the type in `apps/cms/src/schema-types/` with
  `defineType`/`defineField`; follow the `{group}_{name}` naming convention.
- Add `validation: rule => rule.required()` on any field consumers will assume;
  images get `options: { hotspot: true }` + a required `alt`. Enum-ish stored
  values use UPPERCASE key/value constants from `@blog/config` (`constants/`).
- Register it in the schema index (and desk structure if it's a singleton).
- If any `defineType`/`defineField`/`defineArrayMember` option or the typegen
  workflow is uncertain, use the `use-context7` skill to fetch Sanity v6 docs
  before writing schema code.

## Step 2 — Typegen (`apps/cms`) · agent: `cms`

- Run `pnpm --filter cms typegen`. Confirm the shape appears in
  `packages/config/src/sanity/generated/types.ts`. Typegen can be
  non-deterministic — re-run until the diff is minimal. **Commit the generated
  files.**
- Do not hand-write the content type anywhere — typegen is the source of truth.

## Step 3 — Data access (`packages/service`) · agent: `service`

- Add a groqd query with explicit `sub.field()` projections (`.notNull()` last
  in the chain for schema-required fields), a transformer to a `T | undefined`
  view-model (no faked defaults), and expose the action through the feature's
  versioned facade (`service.<domain>.<feature>.v1.*`).
- Return types derive from the generated types in `@blog/config` (or
  `InferResultType`/`InferFragmentType`); no `any`. **No React import.**
- **Imports use the workspace alias** (`@blog/service/*` here, `@web/*` in web,
  `@cms/*` in cms, …), never parent-traversal `../` — see CLAUDE.md →
  Conventions. If a layer starts importing a package it didn't before, add that
  dependency's alias to the consumer's `tsconfig` `paths` **and**
  `vitest.config.ts` alias, or type-check/test/build will fail.
- ISR via `runQuery(query, { parameters, ...isr('tag') })`.
- Add a co-located `*.test.ts` (node env) mocking the client.

## Step 4 — Presentation (`packages/ui`) · agent: `ui`

- Build the component(s) at the right Atomic layer; pure and prop-driven.
- **No `service`/`sanity`/`fetch` imports** — accept plain typed props (shared
  types from `@blog/config` where they fit). Portable Text rendering is
  composed in `apps/web` (`PortableTextRenderer`), not here.
- Token utilities only; forward `className`; JSDoc; co-locate a `*.test.tsx`.
- Export from the `src/index.ts` barrel.

## Step 5 — Composition (`apps/web`) · agent: `web`

- Add/extend the route. The Server Component calls the `service` function and
  passes plain props into the `@blog/ui` component. **No GROQ, no Sanity client,
  no inline presentation here.**
- Pass `dataTestId` on every `@blog/ui` component that needs to be targeted by
  E2E tests. Use a consistent, stable naming convention (kebab-case, scoped to
  the page/section):
  ```tsx
  <ThemeToggle dataTestId="header-theme-toggle" />
  ```
- `generateStaticParams` + `generateMetadata` for new routes; update
  `sitemap.ts` / RSS if the content is publicly listed.
- If a new field affects published content, ensure the revalidate webhook covers
  it (right tag/path).

## Step 6 — Verify

- `pnpm typegen` (clean), then from root: `pnpm type-check`, `pnpm lint`,
  `pnpm test`. All green. `pnpm build` is CI-only (`ci.yml`), not part of
  local verify.
- Run the `code-review-practices` skill over the diff before opening the PR.

## Boundary checklist (the whole point)

- [ ] Type came from typegen, not hand-written.
- [ ] Existing-shape changes have a migration plan (dry-run → backup →
      human-gated run).
- [ ] `service` has no React; `ui` has no `service`/`sanity`/`fetch`.
- [ ] `web` has no GROQ/Sanity client and no presentation that belongs in `ui`.
- [ ] Tests added at the `service` and `ui` layers; metadata/feeds updated.

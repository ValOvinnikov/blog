---
name: service
description: >-
  Backend / data-access specialist for packages/service (@blog/service). Use
  for the Sanity client, GROQ queries, typed fetch functions, image URL
  builders, and caching/ISR tags. The only layer that talks to Sanity at
  runtime. Never touches React or presentation.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
isolation: worktree
---

You are the data-layer (backend) engineer. Your workspace is
`packages/service` (`@blog/service`). You turn raw Sanity documents into typed,
React-free data the web app can consume.

## Start here

When invoked, before writing any code:

1. Read the context brief you were given: issue summary, acceptance criteria,
   and what the CMS agent produced (new type names, field names).
2. Verify the types you'll query actually exist in
   `packages/config/src/sanity/generated/types.ts` — do not write queries
   against types that haven't been generated yet.
3. **To determine which fields need `.notNull()`**, use the CMS agent's report
   as the primary source — it lists each field with its required/optional status.
   Generated types mark every field optional regardless of `.required()` validation
   and cannot be trusted for this. If no CMS report was provided, read the schema
   files in `apps/cms/src/schema-types/` directly.
4. Read the existing service files in the relevant domain folder before creating
   anything new — understand current naming conventions. If existing files
   conflict with the Folder Structure spec below, follow the spec, not the files,
   and **report the differences to the user** before proceeding.

All source files live under `packages/service/src/`. Import across the package
with the workspace's **own-name alias** (`@blog/service/*` → `./src/*`, from
tsconfig `paths`) — e.g. `import { q } from '@blog/service/sanity/query'`,
`import { toLink } from '@blog/service/shared/transformers/to-link'`. Use
relative paths only within a single slice (`./query`, `./types`).

## Hard boundaries (do not violate)

- **Never import React** or anything from `@blog/ui`. This package is pure data.
- **Only** `@blog/service` imports `sanity` / `next-sanity` / `@sanity/image-url`.
  No other package may. If `web` or `ui` needs data, it goes through a function
  you export here.
- Depend only on `@blog/config`, `@blog/utils`, and the Sanity SDKs. Generated
  content types come from `@blog/config` — do not redeclare content shapes.
  Import from the package root or plain subpaths, never `@blog/config/react`
  (that subpath exists precisely to keep React out of this package).
- The dependency graph stays acyclic: `service → config, utils`, nothing more.

## What you build

- A configured client in `sanity/client.ts` reading `NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, and (for drafts) `SANITY_API_READ_TOKEN`.
- `sanity/query.ts` — the groqd builder (`q`), `runQuery` (safe runner), `isr()`.
- `urlForImage` (`sanity/image.ts`) on `@sanity/image-url`.
- The `service` facade — the only public surface (`src/index.ts`), grouped by
  domain and version: `service.pages.post.v1.getPost(slug)`,
  `service.entities.author.v1.getAuthorParams()`.
- ISR via `runQuery(query, { parameters, ...isr('tag') })`.

## Folder structure

- **Domains** group features in `features/`: `pages/*` (route data: home,
  generic, blog, post, category), `modules/*` (page-builder module data: hero,
  post-list, content, cta), `entities/*` (content entities: author,
  categories), `global/*` (global settings: site-settings, navigation, footer).
  The root `service` object mirrors these domains →
  `{ pages, modules, entities, global }`.
- **Each feature = `adaptor/` + `application/` + `index.ts`:**
  - **`adaptor/`** — the Sanity-coupled implementation, one slice per action.
    A slice is `query.ts` · `transformer.ts` · `types.ts` · `loader.ts`. **The
    loader is always thin** (`runQuery` → transformer → view-model), so any
    shaping logic lives in `transformer.ts`, never inline in the loader. A
    params slice whose query already projects its final shape (e.g. category
    slug params, `*[…]{ 'slug': slug.current }`) needs no transformer; one that
    **computes** its shape (e.g. the blog index's page params, derived from a
    `count`) gets a `transformer.ts` like any other slice. `types.ts` holds
    the **view-model** type (`TPostDetail`, `THomePage`, …); the transformer
    exports the **raw** input type it maps from
    (`export type TRawPostDetail = NonNullable<InferResultType<typeof query>>`),
    which is what fixtures build. `loader.ts` is the thin orchestrator:
    `runQuery(query, isr('tag'))` → transformer → typed view-model. Single-action
    features keep the four files flat in `adaptor/`; **the moment a feature
    gains a second action, move every action into its own named slice folder —
    never leave two actions flattened together in `adaptor/`.** Name slices by
    page **role**, generically (not by entity): `index-page/` for a list/index
    route's data, `detail-page/` for a single-entity route's data, plus
    `index-page-params/` / `detail-page-params/` for each route's
    `generateStaticParams` source. Prefer these to entity-suffixed names — the
    blog route is an _index_ page (a post list) with no `blogPage` CMS document,
    so its loader is `getIndexPage`, not `getBlogPage`. **One query per file** —
    a slice composing two queries has two files (e.g. category `detail/` has
    `category.query.ts` + `posts.query.ts`). _(Existing `post`/`category`/
    `author` still use the older `detail/`+`params/` names pending a retrofit.)_
    **Loader return type is always `Promise<TViewModel>` — never nullable.**
    Do not add null checks, `| null` return types, or try/catch in loaders.
    If a document is missing, groqd throws (e.g. `ValidationErrors`) — let it
    propagate. `safeAsync` in `application/service.ts` catches all throws and
    converts them to `{ ok: false, error }`. The web layer is responsible for
    deciding what to do (`notFound()`, fallback UI, or early return).
  - **`application/service.ts`** — a `createXService()` **factory** returning the
    versioned facade `{ v1: { …actions } }`. Version is an object key, never in
    the import path. `src/index.ts` calls each factory (`createPostService()`, …)
    to assemble the root `service`, so `service.pages.post.v1.getPost(slug)`
    works. A co-located `service.test.ts` smoke-tests that each `v1.*` is exposed
    as a function.
  - **`index.ts`** — `export { createXService } from './application/service'` +
    the public view-model type(s) from the slice's `adaptor/**/types.ts`.
- **Params slices** produce the `generateStaticParams` source directly, so the
  web route only spreads `result.data`: slug routes
  (`detail-page-params/` — post, category, author) return `{ slug: string }[]`;
  the paginated index (`index-page-params/` — blog) returns `{ page: string }[]`.
- **`shared/`** holds cross-feature building blocks:
  `fragments/` (groqd projections — **multiple fragments per file is fine when
  they belong to one domain**, e.g. `post.ts` holds the post-card + post-detail
  projections and their local author sub-fragments), `transformers/` (**one
  transformer per file** — including `build-image-url.ts` (raw image → URL) —
  each exporting its `TRaw*` input type (`InferFragmentType<typeof fragment>`)
  **and** the view-model `T*` type, both co-located and re-exported for web via
  `src/index.ts`).
- **Put something in `shared/` only if it's reused now or clearly will be**
  (e.g. SEO — there's a `seo-and-metadata` skill, so `seoFragment`/`toSeoMeta`
  stay shared even at one current use). If it's used in exactly one place with no
  foreseeable reuse, inline the projection/type in that feature (or as a local,
  non-exported fragment) instead of creating a shared file. Don't overload files.

## GROQ query conventions (groqd)

Typegen marks **every** field optional regardless of schema `.required()` rules
(validation is runtime, not reflected in types). We restore the schema contract
at the query boundary with explicit projections and **explicit nullability on
every field** (`.notNull()` or `.nullable(true)`).

- **Explicitly project every field we defined** with `sub.field('name')` — never
  the `true` shorthand. `true` is allowed **only** for Sanity's built-in/system
  fields (`_id`, `_type`, `asset`, `hotspot`, `crop`, `_createdAt`, …), which we
  don't own and whose nullability we don't control.
- **Every field's nullability is explicit — terminate every `sub.field(...)`
  in `.notNull()` or `.nullable(true)`. Never leave a projected field implicit.**
  `.notNull()` for schema-required fields (narrows the type _and_ adds a runtime
  check that throws if the CMS violates the contract — fail loud at the data
  boundary rather than leak `null` into the UI); `.nullable(true)` for optional
  ones. There is no "plain `sub.field()`" middle ground: on a `.project()`/
  `.deref()`/reference field, an unmarked field silently requires **non-null**
  and throws at `.parse()` on real null data → the page 404s (this is exactly
  the `ogImage` bug). Grep check: every `sub.field(...)` line ends in
  `.notNull()`/`.nullable()`.
- **`.notNull()` on a schema-_optional_ field is a deliberate "404 if absent"
  assertion — use it only when that's truly intended.** Typegen marks the field
  optional; asserting `.notNull()` means absent content fails the query and
  `notFound()`s the page. For SEO/display fields (e.g. `metaTitle`) prefer a
  fallback in the transformer/consumer over a 404.
- **`.notNull()` must be LAST in a chain** — it returns a non-chainable builder.
  Correct: `sub.field('image').project(imageFragment).notNull()` and
  `sub.field('author').deref().project(authorFragment).notNull()`. You cannot
  `.project()`/`.deref()` after `.notNull()`.
- **Always call it: `.notNull()`, not `.notNull`.** The un-called form is a
  function reference — it often produces no lint/type error at the projection
  site but silently breaks the assertion. Watch for this.
- **Slug → project `sub.field('slug.current').notNull()`** so the result is a
  plain `string`, not the `{ current?: string }` Slug object. No `?.current`
  dance in the transformer afterwards.
- **Block content** (`blockText` / `richText`) rejects the bare field name in
  `.field()`. Use the array form: `sub.field('body[]')` (add `.notNull()` if
  required). Same array form for object arrays you want to re-project:
  `sub.field('socialLinks[]').project((s) => ({ … }))`.

## Transformer rules

- Return types come from the generated types in `@blog/config` (or
  `InferResultType`/`InferFragmentType` off the query). No `any`; narrow
  `unknown`. Return domain-shaped data, never a raw `SanityDocument`.
- **Required fields need no fallback** — after `.notNull()` they're already
  non-null, so assign directly: `title: raw.title`.
- **Never fake absent values.** For optional fields use `raw.field ?? undefined`
  — never `?? ''`, `?? 0`, or any sentinel that hides absence; never `?? null`
  either (view-models use `T | undefined`, not `T | null`). Exceptions where a
  default is genuinely the value: `?? false` for boolean flags, `?? []` for
  arrays. Callers in `apps/web` own missing-value handling (`notFound()`,
  conditional render, fallback UI).

## Code quality bar

- **Discriminators come from constants.** When matching stored values or
  `_type` names (`module_hero`, `LINK_TYPE.INTERNAL`), use the const from
  `@blog/config` — never a raw string literal repeated across query,
  transformer, and test.
- **Array-of-modules semantics are explicit.** When the schema allows multiple
  entries of a type and you pick one (`.find(...)`), state the rule (first
  wins) in a comment and confirm the schema enforces the cardinality you
  assume — if it doesn't, report the gap instead of silently ignoring editor
  input.
- **Extract at the second repetition.** A projection/transform pattern used
  twice becomes a fragment or shared transformer; never copy-paste a third.

## Comments

- Write a comment only when it explains something the code cannot — a groqd
  gotcha, a non-obvious cast, a business rule. Skip comments that restate what
  the code already says (`// title is required`) — they rot and mislead.

## Testing

- Co-locate `*.test.ts` (Vitest, `node` environment). Test query-result mapping
  (transformer/loader) and `urlForImage` output. Mock the client; don't hit the
  network. See the `testing-practices` skill
  (`.claude/skills/testing-practices/SKILL.md` — read it with Read; you have
  no Skill tool) for patterns, fixture conventions, and the loader test setup.
- Run `pnpm --filter @blog/service type-check` after each major group of files
  — fast, catches structural errors early without verbose test output.
- Run the full test suite **once, after all implementation is complete**:
  `pnpm --filter @blog/service test`.

## Definition of done

Run these checks **once, after all work is complete**:

- `pnpm --filter @blog/service type-check`, `lint`, and `test` pass.
- No React import; no presentation; graph still acyclic.
- Every exported function is fully typed end-to-end from the generated types
  in `@blog/config`.

**Report back to the orchestrator** with:

- Exported function names and their signatures
  (e.g. `service.pages.post.v1.getPost(slug: string): Promise<TPostDetail>`)
- View-model type names the `ui`/`web` agents will consume (e.g. `TPostDetail`)
- ISR tag names used (e.g. `isr('post')`)
- Any downstream work needed in `ui` or `web`, described precisely enough
  that the next agent can act without re-reading the service code

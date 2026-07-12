# Modular content architecture — modules as documents

**Status:** design approved (brainstorm), pending spec review
**Date:** 2026-07-12
**Closes:** #242 (supersedes the embedded-object modules built in PR #262, now closed)
**Related:** #251 (remaining `{group}_{name}` renames + named-export sweep — kept separate)

## 1. Context & goal

PR #262 introduced a page-builder where `homePage`/`page` hold a `modules[]`
array of **embedded objects** (`module_hero`, `module_postList`, …), and the
service layer re-projects them back into a flat `THomePage` view-model that the
web layer renders with a **fixed** template (`<Hero>` + `<PostsSection>`). Three
problems motivated a redesign:

1. Modules can't be browsed or managed as first-class content (embedded objects
   aren't listable or cross-referenceable in Studio).
2. The home-page service query hand-projects every module field inline in one
   giant `conditionalByType` — unreadable and unscalable as modules grow.
3. Rendering isn't actually modular: the web layer flattens modules back to a
   fixed hero + posts shape.

**Goal:** modules become **reusable standalone documents** that pages reference;
data is fetched **per module**; the web layer renders modules **generically** by
type. This makes modules browsable, dependency-aware, and independently
fetchable/renderable.

## 2. Locked decisions (from brainstorm)

- **Modules are documents**, not embedded objects. Pages hold references.
- **Reusable library:** one module document may be referenced by many pages;
  editing propagates. The built-in **Incoming references** view is the safety
  net for shared edits.
- **Close PR #262** (embedded approach) and build fresh, salvaging its still-good
  parts: the hero mode/custom fields, the `defineModeFieldPair` helper, the
  `MODULE_TYPE` constants, and the existing `Hero`/`PostsSection` `@blog/ui`
  organisms.
- **Per-module async fetch** (each module component fetches its own data as a
  Server Component; batch-by-type is a later optimization, not now).
- **Studio dependency view:** rely on Sanity's **built-in Incoming references**
  (no custom plugin); optionally pin `sanity-plugin-documents-pane` as a
  persistent "Used by" view later.
- Naming/export conventions applied to everything we build here; the broader
  rename sweep stays in #251.

## 3. Content model

### Module document types

Each becomes `type: 'document'` (was `object`), registered under
`schema-types/modules/`:

- `module_hero` — internal `title` + existing hero fields (featuredPost ref,
  the four mode/custom pairs via `defineModeFieldPair`, primary/secondary
  actions).
- `module_postList` — internal `title` (display heading) + `limit`.
- `module_content` — internal `title` + `body` (rich text).
- `module_cta` — internal `title` + CTA fields.

Every module document gets a required internal `title` (via the reusable
`titleField`, §5) so it is listable and previewable in Studio.

### Pages reference modules

- `page_home` **(singleton)** — `title` (reusable field), `hero` (**single
  required reference** to a `module_hero` document — **#1: hero is separated
  from the module list**), `modules` (array of references; allow
  `[module_postList, module_cta]`), `seo`.
- `page_generic` — `title`, `slug`, `modules` (array of references; allow
  `[module_content, module_cta]`), `seo`.

References use `to: [{ type: MODULE_TYPE.X }]`; arrays use `weak: false` (strong
refs so Studio warns before deleting a module still in use).

### Migration

None. Datasets were recreated clean (see the clean-datasets decision); there is
no content to migrate. This is a fresh model.

## 4. Module registry — single source of truth (#2)

`MODULE_TYPE` in `@blog/config` (`constants/module.ts`) remains the canonical
list of module type names. From it we derive, per layer:

- **cms — `defineModulesField({ allow })` helper** (in
  `schema-types/helpers/`): builds the `modules` array field (title,
  description, `of: allow.map((t) => defineArrayMember({ type: t }))`,
  validation). Replaces the duplicated `modules` field block flagged in #2.
  Each page passes the `allow` subset it permits.
- **cms — module list** for schema registration: `modules/index.ts` exports the
  array of module document schemas (named exports, §9).
- **web — module component map**: `Record<TModuleType, ModuleComponent>` mapping
  each `_type` to its per-module renderer (§7). Exhaustive over `MODULE_TYPE`,
  enforced by the type system.
- **service — module fetcher map / namespace**: `service.modules.<type>` (§6).

Each map is small and layer-local, but all key off the same `MODULE_TYPE`
constants, so adding a module = add the type + register in each map (type errors
guide you if one is missed).

## 5. Reusable title field + singleton "Untitled" fix

**Problem:** Site Settings, Navigation, and Footer show **"Untitled"** as the
document form heading. They have no `title` field; the heading is derived from
the document's `title` field, **not** from `preview.prepare` or the structure
node's `.title()` (PR #280's `S.document().title()` only labels the left-nav
list item, not the form heading).

**Fix — reusable `titleField` definition** (in `schema-types/helpers/`):

```ts
export const titleField = (options?: {
  initialValue?: string;
  readOnly?: boolean;
  description?: string;
  max?: number;
}) =>
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    description: options?.description,
    initialValue: options?.initialValue,
    readOnly: options?.readOnly ?? false,
    validation: (rule) =>
      options?.max ? rule.required().max(options.max) : rule.required(),
  });
```

- **Singletons** (`siteSettings`, `settings_navigation`, `settings_footer`) get
  `titleField({ initialValue: 'Site Settings' | 'Navigation' | 'Footer',
readOnly: true })` — a real, fixed title so the form heading resolves; readOnly
  so editors can't rename a singleton. Their `preview.prepare` can then
  `select: { title: 'title' }` (or keep the hardcoded title).
- **Content documents** (`post`, `page_generic`, module docs, …) use
  `titleField({ max: 120, description: … })` for their editable headline.
- Remove the now-ineffective `S.document().title()` calls added in #280 (the
  list-item `.title()` on the parent stays — it labels the left nav).

This is the "reusable title definition used across all schema definitions"
requested.

## 6. Service — per-module fetchers (#5)

### Thin page query

The page query stops projecting module internals. It returns page fields plus
lightweight module descriptors:

```
page_home: { title, hero { _id, _type }, modules[]{ _key, _type, _id }, seo }
page_generic: { title, slug, modules[]{ _key, _type, _id }, seo }
```

No `conditionalByType`, no per-field hero projection in the page query.

### Per-module features

Each module type gets its own service feature, mirroring the existing
`features/**/adaptor/{query,transformer,loader,types}.ts` +
`application/service.ts` structure:

```
features/modules/hero/       → service.modules.hero.v1.getHero(id)
features/modules/post-list/  → service.modules.postList.v1.getPostList(id)
features/modules/content/    → service.modules.content.v1.getContent(id)
features/modules/cta/        → service.modules.cta.v1.getCta(id)
```

Each owns its GROQ (`*[_id == $id][0]{…}`), transformer, and view-model
(`THeroModule`, `TPostListModule`, …). Required schema fields use `.notNull()`;
optional use plain `sub.field()`; view-models are `T | undefined`, no faked
defaults (existing service conventions).

`module_postList` fetches its own posts (the `limit` newest), so its fetcher
encapsulates the posts query too.

### Caching / revalidation

Each module fetch carries ISR tags (`modules:<type>`, `module:<id>`) so on-demand
revalidation (#93/#274) can target a module and every page referencing it. The
page fetch keeps its own tag.

## 7. Web — module renderer (#5)

- **`ModuleRenderer`** (Server Component, `apps/web/src/modules/`): receives
  `modules: { _key; _type; _id }[]`, and for each entry renders the component
  from the module map keyed by `_type`, passing `id={_id}`. Unknown types render
  nothing (defensive) and log.
- **Per-module components** (`apps/web/src/modules/<type>/<type>-module.tsx`):
  async Server Components that call `service.modules.<type>...`, check the
  `Result`, map the view-model to the pure `@blog/ui` organism's props, and
  render it. This is the only place a module's service + ui meet (the existing
  "web is where ui and service meet" contract, now per module).
- **Home route:** renders `<HeroModule id={hero._id} />` (dedicated) then
  `<ModuleRenderer modules={modules} />`. `HomePageTemplate` slots stay, now fed
  the hero module + the rendered module list.
- `@blog/ui` organisms stay pure and prop-driven: reuse `Hero`, `PostsSection`;
  add `ContentModule`/`CtaModule` presentational organisms as needed (own tests
  - stories per `ui-library-practices`/`ui-storybook`).

Module components fetch in parallel (React streams sibling async server
components); each `Result` failure is handled locally (skip that module, don't
fail the page).

## 8. Studio (#3)

- **Desk:** add a top-level **"Modules"** group with a `documentTypeListItem` per
  module type — "Heroes", "Post Lists", "Content", "CTAs" — so editors browse
  every module of a kind (your "`Page Hero` → all heroes").
- **Dependencies:** use the **built-in Incoming references** view (document "…"
  menu → Incoming references; Content Lake indexes references bi-directionally)
  to see which pages use a module before editing/deleting it. No custom plugin
  required. Optional future enhancement: pin a "Used by" pane via
  `sanity-plugin-documents-pane` running `*[references($id)]`.
- Pages (`page_home` singleton, `page_generic` collection) keep their existing
  desk placement.

## 9. Conventions (#4 + named exports)

- **UPPERCASE `HERO_FIELD_MODE` values** (now safe — clean datasets, no
  migration): `CUSTOM: 'CUSTOM'`, `NONE: 'NONE'`, `POST_CATEGORY: 'POST_CATEGORY'`,
  `POST_TITLE: 'POST_TITLE'`, `POST_EXCERPT: 'POST_EXCERPT'`,
  `POST_IMAGE: 'POST_IMAGE'`. Update schema `options.list` values, `initialValue`,
  and the transformer comparisons. Now matches the UPPERCASE key/value const rule.
- **Named exports for every schema definition** — no `export default
defineType`. Convention `{localName}Schema` (`heroSchema`, `postListSchema`,
  `homeSchema`, `siteSchema`, …). Applied to all module + page + singleton files
  we build/touch here; the remaining files convert in #251.
- Module/page `_type` names use their final `{group}_{name}` form
  (`page_home`, `page_generic`, `module_*`). The broader renames (`blog_post`,
  `imageWithAlt→image`, `portableText→richText`) remain #251.

## 10. Scope, sequencing & PRs

Close #262. Implement in dependency order across focused PRs (writing-plans will
detail steps):

1. **cms** — module document types; `page_home` (hero ref + modules refs) and
   `page_generic` (modules refs); `defineModulesField` + `titleField` helpers;
   uppercase `HERO_FIELD_MODE`; singleton title fields; Studio "Modules" desk +
   incoming-references; named exports for touched files; `pnpm typegen`.
2. **service** — thin page queries; per-module features
   (`service.modules.<type>`); module view-models; cache tags; tests.
3. **ui** — any new module organisms (`ContentModule`, `CtaModule`) + tests +
   stories.
4. **web** — `ModuleRenderer` + per-module components; home route wiring;
   metadata unchanged; tests.

Each layer gate-verified (`pnpm typegen | type-check | lint | test`, web build)
before the next. Human-gated commit/push/PR per repo rules. `SPEC.md` updated in
the same work (content model + data-flow now module-based).

## 11. Testing

- **service:** per-module transformer tests (representative fixture → view-model,
  required/optional handling); thin page-query transformer test.
- **ui:** each new organism gets `*.test.tsx` + a Storybook story.
- **web:** `ModuleRenderer` maps type → component (incl. unknown-type no-op);
  a per-module component renders from a mocked fetcher; home route composition.
- No migration tests (no migrations).

## 12. Out of scope / follow-ups

- #251: `blog_*` document renames, `imageWithAlt→image`, `portableText→richText`,
  and converting the remaining schema files to named exports.
- Batch-by-type module fetching (optimization over per-id fetch).
- `sanity-plugin-documents-pane` "Used by" pane (built-in incoming references
  suffices initially).
- On-demand revalidation route (#274) consumes the new module cache tags.

## 13. Risks

- **N+1 fetching:** a page with M modules issues M+1 queries. Acceptable for
  page-builder scale (handful of modules); parallelized via async RSC; batch-by
  -type available if it ever bites.
- **Shared-edit surprise:** editing a reused module changes every referencing
  page. Mitigated by built-in Incoming references + strong refs (delete warnings).
- **Type-map drift:** adding a module means registering it in the cms list,
  service namespace, and web map. Keying all off `MODULE_TYPE` + exhaustive
  `Record<TModuleType, …>` typing surfaces omissions at compile time.

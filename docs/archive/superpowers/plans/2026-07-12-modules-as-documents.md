# Modules-as-Documents Implementation Plan

> **Archived — implemented.** See SPEC.md §6. Content model for current behavior.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Delegate each layer to its scoped agent (`cms → service → ui → web`) per CLAUDE.md.

**Goal:** Rework the page-builder so modules are standalone reusable Sanity documents that pages reference, fetched per-module and rendered generically by type on the web layer.

**Architecture:** Module document types (`module_hero/postList/content/cta`) are referenced by `page_home` (dedicated `hero` ref + `modules[]` refs) and `page_generic` (`modules[]` refs). The page query is thin (returns module `{_type,_id,_key}` descriptors only). Each module type owns a `service.modules.<type>` fetcher. A web `ModuleRenderer` maps `_type` → an async per-module Server Component that fetches its data and renders a pure `@blog/ui` organism.

**Tech Stack:** Sanity Studio v6, Next.js 16 App Router (RSC), groqd, TypeScript strict, Vitest + Testing Library, Tailwind v4 + tailwind-variants.

## Global Constraints

- Layer contracts (SPEC.md §4): `ui` imports no service/sanity/fetch; `service` imports no React/`@blog/ui`; `web` is the only place `ui` + `service` meet; graph acyclic.
- Content shapes come only from generated types in `@blog/config` (`packages/config/src/sanity/generated/types.ts`); never hand-redeclare. Run `pnpm typegen` after schema changes; commit the regenerated files; re-run until diff is minimal.
- Every schema definition uses a **named export** `{localName}Schema` — never `export default defineType`.
- Enum-ish stored values are consts in `@blog/config`, **both key and value UPPERCASE**, `as const`. `MODULE_TYPE`/`HERO_FIELD_MODE` are the module registry source of truth.
- No migrations (datasets recreated clean).
- Service: explicit `sub.field()` projections, `.notNull()` last-in-chain for schema-required, `T | undefined` view-models, no faked defaults; loaders throw, `application/service.ts` wraps in `safeAsync`.
- `'use client'` never in `@blog/ui`; in `web` only at the leaf that needs it.
- Verify each layer: `pnpm typegen` (cms) then `pnpm type-check | lint | test` and `pnpm --filter web build` (multi-layer) from root before the next layer. Commit/push/PR are human-gated (ask each, separately).
- Conventional commits, one concern per task.

## File Structure

```
packages/config/src/constants/module.ts            # MODULE_TYPE (exists), HERO_FIELD_MODE → UPPERCASE
apps/cms/src/schema-types/
  helpers/title-field.ts                            # NEW titleField() factory
  helpers/define-modules-field.ts                   # NEW defineModulesField({ allow })
  helpers/define-mode-field-pair.ts                 # exists (salvage from #262 branch)
  modules/module-hero.ts                            # document (was object); heroSchema
  modules/module-post-list.ts                       # document; postListSchema
  modules/module-content.ts                         # document; contentSchema
  modules/module-cta.ts                             # document; ctaSchema
  modules/index.ts                                  # named-export array `modules`
  documents/pages/home-page.ts                      # page_home: hero ref + modules refs; homeSchema
  documents/pages/page.ts                           # page_generic: modules refs; genericSchema
  documents/settings/{site-settings,navigation,footer}.ts  # add titleField; siteSchema/navigationSchema/footerSchema
  documents/index.ts, schema-types/index.ts         # named imports
apps/cms/sanity.config.ts                           # Studio desk: Modules section; drop dead .title()
packages/service/src/features/
  pages/home/adaptor/{query,transformer,types,loader}.ts   # thin
  pages/generic/…                                   # NEW thin generic page feature (if not present)
  modules/hero/…  modules/post-list/…  modules/content/…  modules/cta/…   # NEW per-module features
  service.ts (or index)                             # register service.modules.*
packages/ui/src/organisms/content-module/…          # NEW
packages/ui/src/organisms/cta-module/…              # NEW  (Hero, PostsSection reused)
apps/web/src/modules/
  module-map.ts                                     # Record<TModuleType, Component>
  module-renderer.tsx                               # ModuleRenderer
  hero/hero-module.tsx  post-list/…  content/…  cta/…   # async per-module components
apps/web/src/app/[locale]/page.tsx                  # home: <HeroModule> + <ModuleRenderer>
apps/web/src/app/[locale]/[slug]/page.tsx           # generic page (if built)
SPEC.md                                             # content model + data flow → module-based
```

---

## Phase 0 — Shared constants

### Task 0.1: UPPERCASE `HERO_FIELD_MODE`

**Files:**

- Modify: `packages/config/src/constants/module.ts`
- Test: none (const only; downstream type-check covers it)

**Interfaces:**

- Produces: `HERO_FIELD_MODE = { CUSTOM:'CUSTOM', NONE:'NONE', POST_CATEGORY:'POST_CATEGORY', POST_TITLE:'POST_TITLE', POST_EXCERPT:'POST_EXCERPT', POST_IMAGE:'POST_IMAGE' } as const;` `MODULE_TYPE` unchanged.

- [ ] **Step 1:** Rewrite the `HERO_FIELD_MODE` object so each value equals its UPPERCASE key. Delete the "legacy lowercase" comment; add: `// UPPERCASE key/value per convention; datasets are clean so no migration needed.`
- [ ] **Step 2:** Run `pnpm --filter config type-check` — Expected: PASS.
- [ ] **Step 3:** Commit: `refactor(config): uppercase HERO_FIELD_MODE values (clean datasets)`.

> Downstream schema/service updates that consume these values happen in Tasks 1.3 and 2.3; they will read the UPPERCASE constants, so no string literals change by hand.

---

## Phase 1 — CMS (delegate to `cms` agent)

### Task 1.1: `titleField` helper

**Files:**

- Create: `apps/cms/src/schema-types/helpers/title-field.ts`

**Interfaces:**

- Produces: `titleField(options?: { initialValue?: string; readOnly?: boolean; description?: string; max?: number }): FieldDefinition` — a `defineField` for `name:'title'`, `type:'string'`, required (`.max(max)` when given).

- [ ] **Step 1:** Implement per spec §5 (exact code in the spec). `validation`: `rule.required()`, chaining `.max(options.max)` only when `max` is set.
- [ ] **Step 2:** `pnpm --filter cms type-check` — Expected: PASS (helper unused yet compiles).
- [ ] **Step 3:** Commit: `feat(cms): reusable titleField schema helper`.

### Task 1.2: `defineModulesField` helper

**Files:**

- Create: `apps/cms/src/schema-types/helpers/define-modules-field.ts`

**Interfaces:**

- Consumes: `MODULE_TYPE` / `TModuleType` from `@blog/config`.
- Produces: `defineModulesField(options: { allow: TModuleType[]; description?: string }): FieldDefinition` — an `array` field `name:'modules'`, `of: allow.map((t) => defineArrayMember({ type: t }))`, each member a strong reference member. Returns the field ready to spread into a document's `fields`.

- [ ] **Step 1:** Implement. Field shape:

```ts
export const defineModulesField = ({
  allow,
  description,
}: {
  allow: TModuleType[];
  description?: string;
}) =>
  defineField({
    name: 'modules',
    title: 'Modules',
    type: 'array',
    description: description ?? 'Ordered content modules that build this page.',
    of: allow.map((type) =>
      defineArrayMember({ type: 'reference', to: [{ type }] }),
    ),
  });
```

- [ ] **Step 2:** `pnpm --filter cms type-check` — Expected: PASS.
- [ ] **Step 3:** Commit: `feat(cms): defineModulesField registry helper`.

### Task 1.3: Module document types

**Files:**

- Modify (convert object→document, named export, uppercase modes, add titleField): `apps/cms/src/schema-types/modules/module-hero.ts`, `module-post-list.ts`, `module-content.ts`, `module-cta.ts`
- Salvage `helpers/define-mode-field-pair.ts` from the #262 branch (`git show refactor/cms-restructure-phase-5:apps/cms/src/schema-types/helpers/define-mode-field-pair.ts`).

**Interfaces:**

- Consumes: `titleField`, `defineModeFieldPair`, `MODULE_TYPE`, `HERO_FIELD_MODE`.
- Produces: named exports `heroSchema`, `postListSchema`, `contentSchema`, `ctaSchema`, each `defineType({ name: MODULE_TYPE.X, type: 'document', icon, fields: [ titleField({max:120}), … ], preview })`.

Per-type field specs (deltas — the pattern is identical `defineType` document shape):

- **heroSchema** (`MODULE_TYPE.HERO`): `titleField({max:120})`, `featuredPost` (reference→post, warning-only), the four `...defineModeFieldPair(...)` calls (eyebrow/title/subtitle string; subtitle `text` rows 3; image `imageWithAlt` with NONE mode) using `HERO_FIELD_MODE.*` (now UPPERCASE), `primaryActionLabel` (string max 40), `secondaryAction` (link). Preview title = `title`, subtitle = featuredPost title.
- **postListSchema** (`MODULE_TYPE.POST_LIST`): `titleField({max:120})` (the display heading), `limit` (number, required, min 1 max 12). Preview title = `title`.
- **contentSchema** (`MODULE_TYPE.CONTENT`): `titleField({max:120})`, `body` (portableText, required). Preview title = `title`.
- **ctaSchema** (`MODULE_TYPE.CTA`): `titleField({max:120})`, `heading` (string required), `text` (text), `action` (link required). Preview title = `title`.

- [ ] **Step 1:** Convert each file: `type: 'document'`, `export const <name>Schema =`, add `titleField`, keep icons/previews. Hero uses `defineModeFieldPair` + UPPERCASE modes. Remove any `export default`.
- [ ] **Step 2:** `pnpm --filter cms type-check` — Expected: PASS (after Task 1.7 registration; if run now, expect unresolved until index updated — proceed to 1.7 then verify).
- [ ] **Step 3:** Commit: `feat(cms): module document types (hero/postList/content/cta)`.

### Task 1.4: Page documents referencing modules

**Files:**

- Modify: `apps/cms/src/schema-types/documents/pages/home-page.ts` (`homeSchema`, `name: MODULE_TYPE`? no — `name:'page_home'`), `page.ts` (`genericSchema`, `name:'page_generic'`)

**Interfaces:**

- Consumes: `titleField`, `defineModulesField`, `MODULE_TYPE`.
- Produces: `homeSchema` (document `page_home`), `genericSchema` (document `page_generic`).

- [ ] **Step 1:** `page_home` (singleton) fields: `titleField({initialValue:'Home Page', readOnly:true})`, `hero` = `defineField({ name:'hero', type:'reference', to:[{type:MODULE_TYPE.HERO}], validation:(r)=>r.required() })`, `defineModulesField({ allow:[MODULE_TYPE.POST_LIST, MODULE_TYPE.CTA] })`, `seo`. `initialValue` seeds nothing else. Preview title `title`.
- [ ] **Step 2:** `page_generic` fields: `titleField({max:120, description:'Page headline / H1'})`, `slug` (source title, required), `defineModulesField({ allow:[MODULE_TYPE.CONTENT, MODULE_TYPE.CTA] })`, `seo`.
- [ ] **Step 3:** Named exports; remove `export default`.
- [ ] **Step 4:** Commit: `feat(cms): page_home + page_generic reference module documents`.

### Task 1.5: Singleton title fields (fixes "Untitled")

**Files:**

- Modify: `apps/cms/src/schema-types/documents/settings/site-settings.ts`, `navigation.ts`, `footer.ts`
- Modify: `apps/cms/sanity.config.ts` (remove the dead `S.document().title(...)` calls; keep list-item `.title()`)

**Interfaces:**

- Consumes: `titleField`.

- [ ] **Step 1:** Add `titleField({ initialValue: 'Site Settings'|'Navigation'|'Footer', readOnly: true })` as the first field of each singleton. Set each `preview` to `select:{title:'title'}` (or keep hardcoded). Convert to named exports (`siteSchema`, `navigationSchema`, `footerSchema`).
- [ ] **Step 2:** In `sanity.config.ts`, delete the three `.title('…')` lines that sit on the `S.document()` children (lines added by #280); leave the parent `S.listItem().title('…')`.
- [ ] **Step 3:** Commit: `fix(cms): real title field on settings singletons (fixes Untitled heading)`.

### Task 1.6: Studio desk — Modules browse-by-type

**Files:**

- Modify: `apps/cms/sanity.config.ts`

- [ ] **Step 1:** Add a top-level `S.listItem().title('Modules').icon(Blocks).child(S.list().title('Modules').items([...]))` with one `S.documentTypeListItem(MODULE_TYPE.HERO).title('Heroes').icon(...)` per module type (Heroes, Post Lists, Content, CTAs). Import icons from lucide-react.
- [ ] **Step 2:** Ensure `page_generic` has a `documentTypeListItem` under Pages and `page_home` stays a singleton `S.document()`.
- [ ] **Step 3:** Commit: `feat(cms): Studio Modules desk section (browse by type)`.

### Task 1.7: Register schemas + typegen

**Files:**

- Modify: `apps/cms/src/schema-types/modules/index.ts`, `documents/index.ts`, `documents/pages/index.ts` (if present), `documents/settings/index.ts`, `schema-types/index.ts`
- Modify: `packages/config/src/sanity/generated/{schema.json,types.ts}` (regenerated)

- [ ] **Step 1:** Update every index to **named** imports/exports (`import { heroSchema } from './module-hero'`); build the `modules`/`documents` arrays from them.
- [ ] **Step 2:** Run `pnpm typegen` (needs `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET`; offline extract works with any value). Re-run until diff minimal.
- [ ] **Step 3:** `pnpm --filter cms type-check && pnpm --filter cms lint` — Expected: PASS.
- [ ] **Step 4:** Commit: `feat(cms): register module documents + regenerate types`.

---

## Phase 2 — Service (delegate to `service` agent)

### Task 2.1: Thin `page_home` query + view-model

**Files:**

- Modify: `packages/service/src/features/pages/home/adaptor/{query,transformer,types,loader}.ts`
- Modify: `packages/service/src/features/pages/home/adaptor/loader.test.ts` (rewrite for new shape)

**Interfaces:**

- Produces: `THomePage = { title?: string; hero?: TModuleRef; modules: TModuleRef[]; seo?: TSeoMeta }` where `TModuleRef = { key: string; type: TModuleType; id: string }`. `service.pages.home.v1.getHomePage(): AsyncResult<THomePage>`.

- [ ] **Step 1 (test-first):** Rewrite `loader.test.ts` / transformer test: given a raw `page_home` with `hero->{_ref}` and `modules[]->{_key,_type,_ref}`, `toHomePage` returns `{ hero:{key,type,id}, modules:[…], title, seo }`. Run — Expected: FAIL.
- [ ] **Step 2:** Query: project `title.notNull()`, `hero{ _id? no — it's a reference: "hero": hero{ _ref, _type? }` → use groqd `.field('hero').project((h)=>({ id: h.field('_ref').notNull(), type: h.field('_type')… }))`. For array refs: `modules[]{ _key, _type, "id": _ref }`. (Reference member `_type` is `'reference'`; resolve the target type via `*[_id==^._ref][0]._type` OR store module `_type` by dereferencing lightly: `modules[]{ _key, "id": _ref, "type": @->._type }`.)
- [ ] **Step 3:** Transformer maps raw → `THomePage` view-model (`TModuleRef` list). No module internals.
- [ ] **Step 4:** Run test — Expected: PASS. Then `pnpm --filter service type-check | lint | test`.
- [ ] **Step 5:** Commit: `refactor(service): thin page_home query returns module refs`.

> GROQ note: to get each referenced module's concrete `_type` (`module_hero`…) and id in one page query, dereference minimally: `modules[]{ _key, "id": @->._id, "type": @->._type }`. This is a light deref (id+type only), not the module payload.

### Task 2.2: Thin `page_generic` feature

**Files:**

- Create: `packages/service/src/features/pages/generic/**` (mirror home feature)

**Interfaces:**

- Produces: `TGenericPage = { title?: string; slug: string; modules: TModuleRef[]; seo?: TSeoMeta }`. `service.pages.generic.v1.getPage(slug): AsyncResult<TGenericPage>`.

- [ ] **Step 1 (test-first):** transformer test for slug + module refs. FAIL.
- [ ] **Step 2:** query `*[_type=='page_generic' && slug.current==$slug][0]{ title, "slug": slug.current, modules[]{ _key, "id": @->._id, "type": @->._type }, seo }`; transformer; loader; `application/service.ts`.
- [ ] **Step 3:** test PASS; `pnpm --filter service type-check|lint|test`.
- [ ] **Step 4:** Commit: `feat(service): thin page_generic feature`.

### Tasks 2.3–2.6: Per-module fetchers (one task each)

Identical structure; deltas per type. **Files (per type):** `packages/service/src/features/modules/<type>/adaptor/{query,transformer,types,loader}.ts` + `application/service.ts` + `index.ts` + `adaptor/*.test.ts`.

**Interfaces produced:**

- 2.3 hero → `service.modules.hero.v1.getHero(id): AsyncResult<THeroModule>`; `THeroModule` = the current hero view-model (eyebrow/title/subtitle resolved, image, primaryAction, secondaryAction) — **salvage the resolution logic from #262's `home/adaptor/transformer.ts`** (`getCustomOrFallback`, image mode handling) now keyed on UPPERCASE `HERO_FIELD_MODE`. Hero fetches its own `featuredPost` + fallback newest-featured post.
- 2.4 post-list → `service.modules.postList.v1.getPostList(id): AsyncResult<TPostListModule>`; `TPostListModule = { title: string; posts: TPostCard[] }`; fetches the `limit` newest posts (salvage `homePagePostsQuery` + `toPostCard`).
- 2.5 content → `getContent(id): AsyncResult<TContentModule>`; `{ title: string; body: TPortableText }`.
- 2.6 cta → `getCta(id): AsyncResult<TCtaModule>`; `{ heading: string; text?: string; action: TLink }`.

Per task (example = hero, 2.3):

- [ ] **Step 1 (test-first):** `adaptor/transformer.test.ts`: raw hero doc fixture (UPPERCASE modes) → `THeroModule` (assert custom-vs-fallback, `NONE` image → undefined). Run — FAIL.
- [ ] **Step 2:** query `*[_id==$id][0]{…}` projecting the module's fields (`.notNull()` for required); transformer (salvaged resolution); loader throws on missing; `application/service.ts` wraps `safeAsync`; add ISR tags `['modules:hero', 'module:'+id]`.
- [ ] **Step 3:** test PASS; `pnpm --filter service type-check|lint|test`.
- [ ] **Step 4:** Commit: `feat(service): module fetcher — <type>`.

### Task 2.7: Register `service.modules` namespace

**Files:**

- Modify: the service facade (`packages/service/src/service.ts` or equivalent that builds `service.pages`, `service.global`)

**Interfaces:**

- Produces: `service.modules = { hero: createHeroModuleService(), postList: …, content: …, cta: … }`.

- [ ] **Step 1:** Wire the four `create<Type>ModuleService()` into a `modules` namespace on the exported `service`. Export `TModuleType`-keyed types if helpful.
- [ ] **Step 2:** `pnpm --filter service type-check|lint|test` — PASS.
- [ ] **Step 3:** Commit: `feat(service): expose service.modules namespace`.

---

## Phase 3 — UI (delegate to `ui` agent)

Reuse existing `Hero` and `PostsSection` organisms. Add two new pure organisms. Each: component + `*-variants.ts` (tailwind-variants) + `*.test.tsx` + `*.stories.tsx` (per `ui-library-practices`, `ui-storybook`). No `'use client'`, no service imports, own prop types.

### Task 3.1: `ContentModule` organism

**Files:** `packages/ui/src/organisms/content-module/{content-module.tsx,content-module-variants.ts,content-module.test.tsx,content-module.stories.tsx,index.ts}`
**Interfaces:** Produces `ContentModule` with props `{ title?: string; children: ReactNode /* rendered portable text passed from web */ }` (web owns PortableText rendering — ui takes the rendered node).

- [ ] Steps: test-first (renders title + children) → implement → story → `pnpm --filter ui type-check|lint|test` → commit `feat(ui): ContentModule organism`.

### Task 3.2: `CtaModule` organism

**Files:** `packages/ui/src/organisms/cta-module/…`
**Interfaces:** Produces `CtaModule` props `{ heading: string; text?: string; action: ReactNode /* polymorphic link slot */ }` (use `linkAs` pattern, no bare `<a>`).

- [ ] Steps: test-first → implement → story → verify → commit `feat(ui): CtaModule organism`.

Export both from `packages/ui/src/index.ts`.

---

## Phase 4 — Web (delegate to `web` agent)

### Task 4.1: Module map + `ModuleRenderer`

**Files:**

- Create: `apps/web/src/modules/module-map.ts`, `apps/web/src/modules/module-renderer.tsx`, `apps/web/src/modules/module-renderer.test.tsx`

**Interfaces:**

- Consumes: `TModuleRef` (service), the per-module components (Task 4.2).
- Produces: `MODULE_MAP: Record<TModuleType, (props:{id:string})=>ReactNode>`; `ModuleRenderer({ modules }: { modules: TModuleRef[] })` renders `MODULE_MAP[m.type]({id:m.id})` keyed by `m.key`; unknown type → `null` + `console.warn`.

- [ ] **Step 1 (test-first):** render `<ModuleRenderer modules={[{key,type:MODULE_TYPE.CTA,id}]}/>` with a stubbed map entry → asserts the stub rendered with the id; unknown type → renders nothing. FAIL.
- [ ] **Step 2:** Implement map + renderer (map typed `Record<TModuleType,…>` so a missing type is a compile error).
- [ ] **Step 3:** test PASS.
- [ ] **Step 4:** Commit: `feat(web): ModuleRenderer + module map`.

### Task 4.2: Per-module web components

**Files (per type):** `apps/web/src/modules/<type>/<type>-module.tsx` (+ optional test with mocked service).

**Interfaces:** async Server Components `({ id }: { id: string }) => Promise<ReactNode>`: call `service.modules.<type>.v1.getX(id)`, `if (!result.ok) return null`, map view-model → the `@blog/ui` organism props, render. Hero maps to `Hero`; postList to `PostsSection` (pass `formatDate`-formatted posts + `linkAs`); content renders `PortableTextRenderer` inside `ContentModule`; cta renders `CtaModule` with a `SmartLink` action.

- [ ] **Step 1:** Implement the four components (salvage the hero JSX + PostsSection wiring from the current `app/[locale]/page.tsx`).
- [ ] **Step 2:** Register them in `MODULE_MAP` (Task 4.1).
- [ ] **Step 3:** `pnpm --filter web type-check|lint` — PASS.
- [ ] **Step 4:** Commit: `feat(web): per-module render components`.

### Task 4.3: Rewire home + generic routes

**Files:**

- Modify: `apps/web/src/app/[locale]/page.tsx`
- Create (if generic page route is in scope): `apps/web/src/app/[locale]/[slug]/page.tsx`
- Modify: `apps/web/src/components/home-page-template/home-page-template.tsx` (slots now take rendered hero module + module list)

- [ ] **Step 1:** Home `HomePage`: fetch `service.pages.home.v1.getHomePage()`; `if(!ok) notFound()`; render `<HeroModule id={data.hero.id}/>` into the hero slot and `<ModuleRenderer modules={data.modules}/>` into the list slot. `generateMetadata` unchanged except reading the new `THomePage` (title/seo still present).
- [ ] **Step 2:** Generic page (if in scope): `generateStaticParams` from `service.pages.generic` slugs; render `<ModuleRenderer modules={data.modules}/>`; `generateMetadata` from `seo` (per `seo-and-metadata`).
- [ ] **Step 3:** `pnpm --filter web type-check|lint` — PASS.
- [ ] **Step 4:** Commit: `feat(web): render home (and generic page) via modules`.

### Task 4.4: SPEC.md + full verification

**Files:**

- Modify: `SPEC.md` (§5 data flow + §6 content model → module documents, per-module fetch, `service.modules`, `MODULE_TYPE` registry, reusable `titleField`, UPPERCASE `HERO_FIELD_MODE`).

- [ ] **Step 1:** Update SPEC.md sections to the new model.
- [ ] **Step 2:** From root, in order: `pnpm typegen` (diff minimal) → `pnpm type-check` → `pnpm lint` → `pnpm test` → `pnpm --filter web build` (build with dummy `NEXT_PUBLIC_SANITY_*` — fetch failures are environmental; a compile/RSC error is not). All PASS.
- [ ] **Step 3:** Run `code-review-practices` over the full diff; fix boundary/type issues.
- [ ] **Step 4:** Commit: `docs(spec): sync content model + data flow to modules-as-documents`.

---

## Phase 5 — Cleanup & board

### Task 5.1: Close #262, reconcile board/memory

- [ ] **Step 1:** After the new work merges (human-gated), close PR #262 with a comment pointing to this plan/spec; keep its branch for salvage reference.
- [ ] **Step 2:** Ensure #242 is set to close by this work (link in the final PR); verify board status write stuck.
- [ ] **Step 3:** Update memory: modules-as-documents shipped; `service.modules` namespace exists; `titleField` helper exists.

---

## Self-Review (completed while authoring)

- **Spec coverage:** §3 model → Tasks 1.3/1.4; §4 registry → 1.2/1.7/2.7/4.1; §5 titleField+singletons → 1.1/1.5; §6 service → 2.1–2.7; §7 web → 4.1–4.3; §8 Studio → 1.5/1.6; §9 conventions → 0.1 + named exports throughout; §10 scope/close-#262 → 5.1; §11 testing → per-task tests. All covered.
- **Type consistency:** `TModuleRef {key,type,id}` used identically in 2.1/2.2/4.1/4.2; `service.modules.<type>.v1.getX` naming consistent 2.3–2.7/4.2/2.7; `MODULE_TYPE`/`HERO_FIELD_MODE` UPPERCASE throughout.
- **Placeholders:** per-type deltas are enumerated explicitly (fields, view-model shapes, GROQ), not "similar to". GROQ light-deref (`@->._id/_type`) specified where non-obvious.
- **Open follow-ups (out of scope, per spec §12):** #251 renames + remaining named-export sweep; batch-by-type fetch; documents-pane pane; #274 revalidation consuming module tags.

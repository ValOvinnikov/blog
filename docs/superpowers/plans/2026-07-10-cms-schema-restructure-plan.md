# CMS Schema & Studio Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the CMS schema and Studio per the merged #242 spec —
consistent `{group}_{name}` document naming, page-template + `modules[]`, a
unified `link` object, extracted `openGraph`, a split `siteSettings`, and a
`brand` object — migrating live `production` content at every step.

**Architecture:** Ship as **6 sequential, independently-mergeable PRs (phases)**,
cheapest/safest first. Each phase pairs a `cms` schema change + `pnpm typegen`
with a `sanity/migrate` migration (dry-run → backup → **human-gated** run) and
then updates downstream layers in strict dependency order
`cms → typegen → service → ui → web`. Later phases depend on the regenerated
types and migrated data of earlier ones.

**Tech Stack:** Sanity v6 (`sanity`, `sanity/migrate`, `@sanity/cli` v7),
Sanity typegen → `packages/config/src/sanity/generated/types.ts`, groqd in
`@blog/service`, Next.js 15 App Router in `apps/web`, Vitest + Testing Library.

## Global Constraints

- Project `ccs8c2no`, dataset `production`. Content is **live** — see migration
  cost tags 🟢 additive / 🟡 field move / 🔴 `_type` rename.
- **Production migrations are human-gated** (like `sanity deploy`): dry-run →
  `dataset:export` backup → human runs `--no-dry-run`. Agents never run the
  live migration. Follow `apps/cms/migrations/README.md`.
- Naming: documents `{group}_{name}` (`page_home`, `blog_post`, `settings_site`);
  shared objects semantic (`seo`, `openGraph`, `link`, `image`, `richText`,
  `blockText`); modules `module_{name}`.
- `blog_author.name` stays `name` (exception). `blockText` name unchanged.
  `post.tags` removed; `categories` is the only taxonomy.
- After any schema change: `pnpm typegen`, commit
  `packages/config/src/sanity/generated/types.ts`.
- Layer boundaries hold (SPEC.md). TS `strict`, no `any`. No `'use client'` in
  `@blog/ui`. Every `.required()` schema field → `.notNull()` in the groqd
  projection; optional fields use plain `sub.field()`.
- All subagents run **Sonnet**. Delegate per layer: `cms` (schema/typegen),
  `service` (GROQ/fetchers), `ui` (components), `web` (routes/metadata).
- Commit / push / PR are **three separate human gates** per phase — never bundle.

---

## Program roadmap (6 PRs)

| Phase | PR title (conventional)                                          | Cost | Migration | Layers touched           |
| ----- | ---------------------------------------------------------------- | ---- | --------- | ------------------------ |
| **1** | `feat(cms): add SEO to generic pages`                            | 🟢   | none      | cms                      |
| **2** | `refactor(cms): extract openGraph; consolidate SEO/OG`           | 🟡   | yes       | cms → service → web      |
| **3** | `refactor(cms): split siteSettings into site/nav/footer + brand` | 🟡   | yes       | cms → service → ui → web |
| **4** | `refactor(cms): unify links into a single link object`           | 🔴   | yes       | cms → service → ui → web |
| **5** | `refactor(cms): page template with modules[] + module_hero`      | 🔴   | yes       | cms → service → ui → web |
| **6** | `refactor(cms): apply {group}_{name} type naming`                | 🔴   | yes (×N)  | cms → service → ui → web |

**Ordering rationale (refines the spec):** the spec listed a single "additive
foundation" first, but adding orphan unused types (an `openGraph`/`link`/`module_*`
nobody consumes yet) just clutters generated types. Instead each new type is
introduced **in the phase that first uses it**. Crucially, the `link` **object**
cannot share the name `link` with the existing `link` **document**, and the
`module_*` blocks use `link[]` for actions — so **links unification (P4) must
land before pages→modules (P5)**. The `_type` renames (P6) are highest-risk and
come last so downstream fragments are only rewritten once.

Each phase below P1 is a **plan-to-be-expanded**: write its full bite-sized,
no-placeholder task plan (its own `docs/superpowers/plans/…-phase-N.md`) at the
start of that phase, once the previous phase's regenerated types and migration
dry-run output are known. The per-phase sections here fix the scope, files,
migration transform, layer sequence, and definition of done.

---

## PHASE 1 — Add SEO to generic pages (🟢 additive, cms-only, **no migration**)

**Migration check:** purely additive — a new **optional** `seo` field on the
`page` document. Existing `page` documents remain valid (the field is simply
absent). The `page` document is not yet consumed by a route in `@blog/service`
or `apps/web`, so there is **no downstream change**. **No migration required.**

**Layers:** `cms` only. `service`, `ui`, `web` unaffected — do not invoke.

**Files:**

- Modify: `apps/cms/src/schema-types/documents/pages/page.ts`
- Regenerate: `packages/config/src/sanity/generated/types.ts` (via `pnpm typegen`)

**Interfaces:**

- Consumes: the existing `seo` object type (`apps/cms/src/schema-types/objects/seo.ts`).
- Produces: `page` documents gain an optional `seo` field (generated type
  `Page` gets `seo?: Seo`). No new exported symbols.

**Owner:** `cms` subagent.

- [ ] **Step 1: Add the `seo` field to the `page` document**

In `apps/cms/src/schema-types/documents/pages/page.ts`, add a `seo` field as the
last entry of the `fields` array (after `body`), mirroring how `post`/`homePage`
embed SEO:

```ts
    defineField({
      name: 'body',
      title: 'Body',
      type: 'portableText',
      description:
        'Page content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      description:
        'Override meta title, description, and OG image for search engines.',
    }),
  ],
});
```

- [ ] **Step 2: Regenerate types**

Run: `pnpm typegen`
Expected: `packages/config/src/sanity/generated/types.ts` updates; the generated
`Page` type gains `seo?: Seo`. Re-run until the diff is minimal (typegen can be
non-deterministic — only the `Page`/`seo` addition should remain).

- [ ] **Step 3: Verify cms is clean**

Run: `pnpm --filter cms type-check`
Expected: PASS (no errors).
Run: `pnpm --filter cms lint`
Expected: PASS (no errors).

- [ ] **Step 4: Manual Studio sanity check (optional, human)**

`pnpm --filter cms dev` → open a Generic Page → confirm the collapsible **SEO**
section renders with Meta Title / Description / OG fields. (Human step; not a
gate.)

- [ ] **Step 5: Commit (GATE — ask first)**

```bash
git add apps/cms/src/schema-types/documents/pages/page.ts \
        packages/config/src/sanity/generated/types.ts
git commit -m "feat(cms): add SEO to generic pages"
```

Then push + PR as separate gates; set #242 → Code Review on PR open **only if
this is the last phase** — otherwise leave #242 In Progress and note the phase
in the PR body (implementation continues).

---

## PHASE 2 — Extract `openGraph`; consolidate SEO/OG (🟡 field move, migration)

**Migration check:** 🟡 — moves fields on existing `post`, `homePage`, and
`siteSettings` documents. **Migration required** (one per affected shape, or a
combined one keyed by document type).

**Files:**

- Create: `apps/cms/src/schema-types/objects/open-graph.ts` (`openGraph` object:
  `ogTitle` string max 70, `ogDescription` text max 200, `ogImage` type
  `imageWithAlt`).
- Modify: `apps/cms/src/schema-types/objects/index.ts` (register `openGraph`
  before `seo`).
- Modify: `apps/cms/src/schema-types/objects/seo.ts` → `{ metaTitle,
metaDescription, openGraph }` (replace the three flat `og*` fields with an
  `openGraph` field).
- Modify: `apps/cms/src/schema-types/documents/settings/site-settings.ts` →
  replace flat `ogImage`/`ogTitle`/`ogDescription` with a `defaultSeo` field of
  type `openGraph` (`ogImage` required at site level).
- Create migration: `apps/cms/migrations/consolidate-seo-open-graph/index.ts`.
- Modify (service): `packages/service/src/shared/fragments/seo.ts` +
  `shared/transformers/to-seo-meta.ts` (+ site-settings fragment/transformer).
- Modify (web): `apps/web/src/app/[locale]/page.tsx` and any metadata builder
  reading `seo.ogTitle` etc. → `seo.openGraph.ogTitle`.

**Migration transform (sketch — expand in the phase plan):**

```ts
import { at, defineMigration, set, unset } from 'sanity/migrate';

export default defineMigration({
  title: 'Consolidate SEO og* fields into openGraph',
  documentTypes: ['post', 'homePage', 'siteSettings'],
  migrate: {
    document(doc) {
      // For post/homePage: nest seo.og* under seo.openGraph.
      // For siteSettings: nest og* under defaultSeo.
      // (Exact paths depend on each type; author per-type node visitors.)
      return [];
    },
  },
});
```

**Layer sequence:** `cms` (+typegen) → **migration (dry-run → backup →
human-gated run)** → `service` (seo fragment/transformer) → `web` (metadata
reads). `ui` unaffected (SEO is metadata, not components).

**Definition of done:** `seo`/site OG read from `openGraph`; migration dry-run
verified against a fresh export; `pnpm typegen`, `type-check`, `lint`, `test`,
`pnpm --filter web build` green; home + post metadata unchanged in output.

---

## PHASE 3 — Split `siteSettings` into site/navigation/footer + `brand` (🟡)

**Migration check:** 🟡 — extracts `navigation` and `socialLinks` arrays out of
`siteSettings` into two new singletons, and folds `title`/`brandPrefix`/
`brandSuffix`/`logo` into a `brand` object. **Migration required.**

**Files:**

- Create: `apps/cms/src/schema-types/objects/brand.ts` (`brand`: `name`,
  `prefix`, `suffix` required as today, `logo` type `imageWithAlt` required).
- Create: `apps/cms/src/schema-types/documents/settings/navigation.ts`
  (`settings_navigation` singleton — wait: name stays `siteNavigation`/
  `settingsNavigation` per naming; **document `_type` prefixes are applied in
  P6**, so in P3 create it as `siteNavigation` and rename in P6, OR accept the
  prefixed name now — decide in the phase plan; default: use the **final**
  singleton name to avoid a second rename, i.e. create `settings_navigation`
  now). Field: `items: navItem[]` (still `navItem` until P4).
- Create: `apps/cms/src/schema-types/documents/settings/footer.ts`
  (`settings_footer`: `nav: navItem[]`, `social: socialLink[]`).
- Modify: `site-settings.ts` → embed `brand`; remove nav/social; add
  `defaultSeo` already added in P2.
- Modify: `apps/cms/sanity.config.ts` desk → add **Navigation** and **Footer**
  top-level singletons (fixed `documentId`), keep **Site Settings**.
- Modify: `documents/index.ts` register the two new singletons.
- Create migration: `apps/cms/migrations/split-site-settings/index.ts` (create
  the `settings_navigation`/`settings_footer` singleton docs, copy the arrays,
  wrap brand fields).
- Service: split `global/site-settings` into site + navigation + footer
  loaders/fragments/transformers.
- ui/web: header consumes navigation + brand; footer consumes footer social +
  brand `name`.

> **Naming caveat:** P3 creates two _new_ singletons. To avoid renaming them
> again in P6, create them with their **final** `_type` (`settings_navigation`,
> `settings_footer`) now; they are new types so there is no data to migrate for
> the name itself. Existing renamed types (`siteSettings→settings_site`, etc.)
> are still deferred to P6.

**Layer sequence:** `cms` (+typegen) → migration → `service` → `ui` → `web`.

**Definition of done:** header/footer render from the new singletons + `brand`;
single source for brand identity; all gates green; Studio shows Navigation /
Footer / Site Settings singletons.

---

## PHASE 4 — Unify links into one `link` object (🔴)

**Migration check:** 🔴 — replaces the `link` **document**, `navItem`, and
`socialLink` objects with a single `link` object embedded everywhere. Touches
`settings_navigation`, `settings_footer`, `homePage.secondaryAction`, and every
existing `link` document. **Migration required; highest care.**

**Files:**

- Create: `apps/cms/src/schema-types/constants/social-platforms.ts` exporting
  `SOCIAL_PLATFORMS` (the `{ title, value }[]` seed set from the spec).
- Create: `apps/cms/src/schema-types/objects/link.ts` — `link` object:
  `label` (req), `kind` radio `internal|external` (req), `reference`
  (`post|category|page`, shown/required when internal), `href` (shown/required
  when external), `openInNewTab` boolean (shown only when external),
  `platform` string with `options.list: SOCIAL_PLATFORMS` (optional).
- Delete: `objects/nav-item.ts`, `objects/social-link.ts`,
  `documents/settings/link.ts` (and deregister from the index files + desk).
- Modify: `settings_navigation.items`, `settings_footer.nav`/`social`,
  `homePage.secondaryAction` → `link` (arrays or single object).
- Create migration: `apps/cms/migrations/unify-links/index.ts` — map
  `navItem{label,href}` → `link{label,kind:'external'|'internal',href}`,
  `socialLink{platform,url}` → `link{label:platform,kind:'external',href:url,
platform:<mapped key>}`, and inline the referenced `link` documents.
- Service: replace `nav-item`/`social-link`/`link` fragments+transformers with a
  single `to-link` + `link` fragment; update navigation/footer/home loaders.
- ui/web: `Header`/`Footer`/hero actions consume `link` view-models; social
  renderer maps `platform` → icon.

**Layer sequence:** `cms` (+typegen) → migration → `service` → `ui` → `web`.

**Definition of done:** one `link` shape everywhere; social icons resolve from
`platform`; `link` document type gone; all gates green.

---

## PHASE 5 — Page template with `modules[]` + `module_hero` (🔴)

**Migration check:** 🔴 — converts `homePage`'s 8 flat hero fields and
latest-posts settings into `modules[]` entries, and gives the generic page a
`modules[]` body. **Migration required.**

**Files:**

- Create: `apps/cms/src/schema-types/modules/module-hero.ts`,
  `module-post-list.ts`, `module-cta.ts`, and `module-content.ts` (rich-text
  body block for generic pages — the current `page.body` migrates into this).
  Register them in `apps/cms/src/schema-types/modules/index.ts` (currently the
  empty Phase-4 placeholder).
- Modify: `homePage` → `{ title, modules[], seo }` (hero + latestPosts fields
  move into module instances).
- Modify: `page` → `{ title, slug, modules[], seo }` (`body` → `module_content`).
- Modify: `sanity.config.ts` desk previews if needed.
- Create migrations: `migrations/home-to-modules/index.ts`,
  `migrations/page-body-to-modules/index.ts`.
- Service: `pages/home` query → project `modules[]`; add a generic `page`
  loader if a route is introduced; module → view-model transformers.
- ui: module renderer components (atoms/molecules already exist for hero/post
  list — compose, don't duplicate).
- web: home route renders `modules[]`; keep output parity with today's hero.

**Layer sequence:** `cms` (+typegen) → migration → `service` → `ui` → `web`.

**Definition of done:** home renders from `modules[]` with unchanged output;
generic pages support modular bodies; all gates green incl. `web build`.

---

## PHASE 6 — Apply `{group}_{name}` type naming (🔴, one migration per rename)

**Migration check:** 🔴 — renames object `_type`s (`imageWithAlt→image`,
`portableText→richText`) that are embedded across many documents, then document
`_type`s (`post→blog_post`, `author→blog_author`, `category→blog_category`,
`homePage→page_home`, `page→page_generic`, `siteSettings→settings_site`). Each
rename is **its own migration**, validated with `--from-export` dry runs.
**Highest-risk phase — do last.**

**Files (per rename):** the schema type `name`, its `defineType`, all
registrations (`objects/index.ts`, `documents/index.ts`, `sanity.config.ts`
desk `schemaType`/`documentTypeListItem` ids), every `@blog/service` fragment
`_type ==` filter + projection, and generated types consumers in `@blog/ui`/
`apps/web`.

**Migration pattern (object `_type`, embedded):** node-visitor that rewrites the
`_type` of matching embedded objects; **document `_type` renames may require
export → transform → import** rather than in-place patching (validate approach
in the phase plan against a fresh export).

**Layer sequence per rename:** `cms` (+typegen) → migration → `service` → `ui`
→ `web`. Batch the object renames, then the document renames.

**Definition of done:** all types follow `{group}_{name}`/semantic conventions;
`sanity.types.ts` regenerated; full `type-check | lint | test | web build` green;
Studio navigates cleanly. **This phase's PR closes #242** → set board to Code
Review on PR open.

---

## Self-review

**1. Spec coverage:** Every spec decision maps to a phase — page.seo (P1),
openGraph/SEO (P2), siteSettings split + brand (P3), links + `platform`
dropdown + `openInNewTab` (P4), pages→modules + hero (P5), naming + object
renames + tags-drop [fold `post.tags` removal into P2 or its own tiny migration —
noted in P2 files as an additional `unset('tags')`], Studio desk (P3 for
singletons, P6 for renamed ids). Deferred items (series, readingTime, category
color, redirects) remain out of scope per spec.

**2. Placeholder scan:** Phase 1 is fully specified with real code and exact
commands. Phases 2–6 are intentionally roadmap-level **plans-to-expand** (the
skill's scope-check decomposition), not in-phase placeholders — each is expanded
into its own no-placeholder plan at phase start, when the prior phase's
regenerated types and dry-run output are known.

**3. Type consistency:** Names are used consistently with the spec — `openGraph`,
`link` (object), `settings_navigation`/`settings_footer`/`settings_site`,
`module_hero`/`module_postList`/`module_cta`/`module_content`, `image`/`richText`
(renamed in P6). `SOCIAL_PLATFORMS` is created in P4 (its first consumer), not
P1.

## Open decisions for the user

- **`post.tags` removal** — fold the `unset('tags')` into P2's migration (cheap,
  same pass) or give it its own tiny phase? (Default: fold into P2.)
- **Generic `page` route** — the `page` document has no `apps/web` route yet.
  Introduce one during P5 (so `module_content` renders), or keep `page`
  schema-only until a later feature? (Default: keep schema-only; render only
  `homePage` modules in P5.)
- **Sub-issues** — track each phase as a #242 sub-issue for granular board
  status, or ship all 6 PRs against #242 and close it with P6? (Default: ship
  against #242, close with P6.)

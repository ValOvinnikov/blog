# Phase 2 — Extract `openGraph` + consolidate SEO/OG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.
> Part of #242 · sub-issue **#247** · follows the master plan
> `docs/superpowers/plans/2026-07-10-cms-schema-restructure-plan.md`.

**Goal:** Replace the flat `ogTitle`/`ogDescription`/`ogImage` fields on `seo`
and `siteSettings` with a shared `openGraph` object, make `seo` a
collapsed-by-default section everywhere, and drop the unused `post.tags` field —
migrating existing `post`/`homePage`/`siteSettings` documents.

**Architecture:** `cms` schema change + `pnpm typegen` → **one migration**
(dry-run → backup → human-gated run) → `service` (GROQ projections + transformer
inputs move to the nested shape; **view-models `TSeoMeta`/`TSiteSettings` stay
identical**). `ui` and `web` are **unaffected** (they consume the unchanged
view-models) — do not invoke those agents; only verify.

**Tech Stack:** Sanity v6, `sanity/migrate`, Sanity typegen, groqd.

## Global Constraints (inherited)

- Project `ccs8c2no` / dataset `production`. **Production migration is
  human-gated** (dry-run → `dataset:export` backup → human `--no-dry-run`).
- Every `.required()` schema field → `.notNull()` in the groqd projection;
  optional fields use plain `sub.field()`; view-models use `T | undefined`, no
  faked defaults.
- TS `strict`, no `any`. Commit/push/PR are three separate gates.
- After schema change: `pnpm typegen`, commit
  `packages/config/src/sanity/generated/{types.ts,schema.json}`.

## Migration check

🟡 **Migration required.** Moves fields on existing `post`, `homePage`,
`siteSettings` (and any `page` with `seo`) documents, and removes `post.tags`.
Not additive → live data must be transformed.

## Layer sequence

`cms` (+typegen) → **migration** → `service` (+tests) → verify (`ui`/`web`
unchanged). `ui`/`web` agents are **not invoked**.

---

## Task 1 — CMS: openGraph object, seo restructure, siteSettings defaultSeo, drop tags

**Files:**

- Create: `apps/cms/src/schema-types/objects/open-graph.ts`
- Modify: `apps/cms/src/schema-types/objects/index.ts` (register `openGraph`)
- Modify: `apps/cms/src/schema-types/objects/seo.ts` (og* → `openGraph`; add
  collapsible options)
- Modify: `apps/cms/src/schema-types/documents/settings/site-settings.ts`
  (og* → `defaultSeo`)
- Modify: `apps/cms/src/schema-types/documents/pages/home-page.ts` (remove the
  now-redundant `seo` fieldset)
- Modify: `apps/cms/src/schema-types/documents/blog/post.ts` (remove `tags`)
- Regenerate: `packages/config/src/sanity/generated/{types.ts,schema.json}`

**Interfaces / Produces:** a new object type `openGraph`
(`{ _type:'openGraph'; ogTitle?; ogDescription?; ogImage?: ImageWithAlt }`);
`Seo` becomes `{ _type:'seo'; metaTitle?; metaDescription?; openGraph?: OpenGraph }`;
`SiteSettings` loses `ogImage/ogTitle/ogDescription`, gains `defaultSeo?: OpenGraph`;
`Post` loses `tags`.

- [ ] **Step 1: Create the `openGraph` object**

`apps/cms/src/schema-types/objects/open-graph.ts`:

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'openGraph',
  title: 'Open Graph',
  type: 'object',
  fields: [
    defineField({
      name: 'ogTitle',
      title: 'OG Title',
      type: 'string',
      description:
        'Title shown when shared on social media. Defaults to meta title if empty.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'ogDescription',
      title: 'OG Description',
      type: 'text',
      description:
        'Description shown when shared on social media. Defaults to meta description if empty.',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image',
      type: 'imageWithAlt',
      description:
        'Image shown when shared on social media. Recommended size: 1200×630 px.',
    }),
  ],
});
```

- [ ] **Step 2: Register `openGraph` before `seo`**

In `apps/cms/src/schema-types/objects/index.ts` add the import and array entry
(order it before `seo`, which now references it):

```ts
import blockText from './block-text';
import imageWithAlt from './image-with-alt';
import navItem from './nav-item';
import openGraph from './open-graph';
import portableText from './portable-text';
import seo from './seo';
import socialLink from './social-link';

export const objects = [
  imageWithAlt,
  portableText,
  blockText,
  socialLink,
  navItem,
  openGraph,
  seo,
];
```

- [ ] **Step 3: Restructure `seo` + make it collapse by default**

Replace `apps/cms/src/schema-types/objects/seo.ts` with (metaTitle/metaDescription
unchanged; three og* fields replaced by one `openGraph` field; add
`options: { collapsible: true, collapsed: true }` so every embedded `seo`
renders as a collapsed section — this is what the home page did with a fieldset):

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description:
        'Overrides the page title in search results. Keep under 60 characters.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description:
        'Summary shown in search results. Keep between 120–160 characters.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'openGraph',
      title: 'Open Graph',
      type: 'openGraph',
      description: 'Social-sharing overrides (title, description, image).',
    }),
  ],
});
```

- [ ] _*Step 4: siteSettings og* → `defaultSeo`_*

In `apps/cms/src/schema-types/documents/settings/site-settings.ts`, remove the
three fields `ogImage` (line ~57), `ogTitle` (~65), `ogDescription` (~73) and
replace them with a single `defaultSeo` field. Preserve the site-level
**ogImage-required** invariant with a custom rule (so the service projection can
keep `.notNull()` on it):

```ts
    defineField({
      name: 'defaultSeo',
      title: 'Default Social Sharing',
      type: 'openGraph',
      description:
        'Fallback title/description/image used when a page has no own OG values.',
      validation: (rule) =>
        rule.required().custom((value: { ogImage?: unknown } | undefined) =>
          value?.ogImage ? true : 'A default OG image is required.',
        ),
    }),
```

- [ ] **Step 5: Remove the redundant `seo` fieldset on the home page**

In `apps/cms/src/schema-types/documents/pages/home-page.ts`: delete the `seo`
entry from the `fieldsets` array, and remove `fieldset: 'seo'` from the `seo`
field's definition. The `seo` object now self-collapses via its own options, so
the outer fieldset is no longer needed (and a leftover `fieldset: 'seo'` with no
matching fieldset is an error).

```ts
// fieldsets: keep 'hero' and 'latestPosts'; remove the { name: 'seo', ... } entry.

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      description:
        'Override Home page meta title, description, and social sharing image.',
      // fieldset: 'seo'  <-- REMOVE this line
    }),
```

- [ ] **Step 6: Remove `post.tags`**

In `apps/cms/src/schema-types/documents/blog/post.ts`, delete the entire `tags`
`defineField({ ... })` block (name `tags`, `of: [{type:'string'}]`,
`options: { layout: 'tags' }`). Leave `categories` untouched.

- [ ] **Step 7: Regenerate types + verify cms**

```bash
pnpm typegen
pnpm --filter cms type-check
pnpm --filter cms lint
```

Expected: `Seo` gains `openGraph?: OpenGraph` and loses `ogTitle/ogDescription/ogImage`;
`OpenGraph` type appears; `SiteSettings` gains `defaultSeo?: OpenGraph` and loses
the flat og fields; `Post` loses `tags`. type-check + lint PASS. Re-run `pnpm
typegen` if the diff is noisy until only these changes remain.

- [ ] **Step 8: Commit (GATE — ask first)**

```bash
git add apps/cms/src packages/config/src/sanity/generated
git commit -m "refactor(cms): extract openGraph object; consolidate SEO/OG; drop post.tags"
```

---

## Task 2 — Migration: nest og under openGraph/defaultSeo; unset tags

**Files:**

- Create: `apps/cms/migrations/consolidate-seo-open-graph/index.ts`

**Consumes:** the new schema shapes from Task 1.
**Produces:** a migration that transforms live `post`/`homePage`/`page`/
`siteSettings` documents to match.

- [ ] **Step 1: Author the migration**

`apps/cms/migrations/consolidate-seo-open-graph/index.ts`:

```ts
/**
 * Consolidate flat OG fields into the shared `openGraph` object and drop
 * `post.tags`. Run AFTER the schema change (Task 1) + `pnpm typegen`.
 * Human-gated: dry-run → dataset:export backup → --no-dry-run.
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

type OgSource = {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: unknown;
};

const hasOg = (o: OgSource): boolean =>
  o.ogTitle !== undefined ||
  o.ogDescription !== undefined ||
  o.ogImage !== undefined;

const toOpenGraph = (o: OgSource) => ({
  _type: 'openGraph',
  ogTitle: o.ogTitle,
  ogDescription: o.ogDescription,
  ogImage: o.ogImage,
});

const SEO_DOC_TYPES = ['post', 'homePage', 'page'];

export default defineMigration({
  title: 'Consolidate SEO og* into openGraph; drop post.tags',
  migrate: {
    document(doc) {
      const ops = [];

      // seo.og* -> seo.openGraph on docs that embed an seo object
      if (SEO_DOC_TYPES.includes(doc._type)) {
        const seo = (doc as { seo?: OgSource }).seo;
        if (seo && hasOg(seo)) {
          ops.push(at('seo.openGraph', set(toOpenGraph(seo))));
          ops.push(at('seo.ogTitle', unset()));
          ops.push(at('seo.ogDescription', unset()));
          ops.push(at('seo.ogImage', unset()));
        }
      }

      // siteSettings flat og* -> defaultSeo
      if (doc._type === 'siteSettings') {
        const s = doc as OgSource;
        if (hasOg(s)) {
          ops.push(at('defaultSeo', set(toOpenGraph(s))));
          ops.push(at('ogTitle', unset()));
          ops.push(at('ogDescription', unset()));
          ops.push(at('ogImage', unset()));
        }
      }

      // drop post.tags
      if (
        doc._type === 'post' &&
        (doc as { tags?: unknown }).tags !== undefined
      ) {
        ops.push(at('tags', unset()));
      }

      return ops;
    },
  },
});
```

- [ ] **Step 2: Verify the migration type-checks**

```bash
pnpm --filter cms type-check
pnpm --filter cms lint
```

Expected: PASS. (Adjust `at()` path typing if the `sanity/migrate` types
complain — the executing agent should consult context7 for the exact
`NodePatch`/`at` signature rather than guessing.)

- [ ] **Step 3: Dry-run (safe) + human gate — DO NOT run live**

Present these commands to the user; **the agent does not run the live
migration**:

```bash
pnpm --filter cms dataset:export -- migrations/backups/production-pre-openGraph.tar.gz
pnpm --filter cms migrate:dry -- consolidate-seo-open-graph
# inspect the diff, then (human): pnpm --filter cms migrate:run -- consolidate-seo-open-graph
```

- [ ] **Step 4: Commit the migration (GATE)** — fold into Task 1's commit or a
      follow-up `chore(cms): add SEO/openGraph migration` commit on the same branch.

---

## Task 3 — Service: projections + transformers + tests (view-models unchanged)

**Files:**

- Modify: `packages/service/src/shared/fragments/seo.ts`
- Modify: `packages/service/src/shared/transformers/to-seo-meta.ts`
- Modify: `packages/service/src/features/global/site-settings/adaptor/query.ts`
- Modify: `packages/service/src/features/global/site-settings/adaptor/transformer.ts`
- Modify (fixtures/tests): `packages/service/src/shared/transformers/to-seo-meta.test.ts`,
  `packages/service/src/testing/global/fixtures.ts`,
  `packages/service/src/features/global/site-settings/adaptor/loader.test.ts`,
  `.../application/service.test.ts` (only the **raw** fixtures move to the nested
  shape; **assertions stay the same** because view-models are unchanged).

**Consumes:** the migrated data + regenerated types from Tasks 1–2.
**Produces:** unchanged view-models `TSeoMeta` and `TSiteSettings` — so
`apps/web`/`@blog/ui` need no changes.

- [ ] **Step 1: Update `seoFragment` to project the nested openGraph**

`packages/service/src/shared/fragments/seo.ts`:

```ts
import { q } from '#/sanity/query';

import { imageWithAltFragment } from './image';

export const seoFragment = q.fragmentForType<'seo'>().project((sub) => ({
  metaTitle: sub.field('metaTitle').notNull(),
  metaDescription: sub.field('metaDescription'),
  openGraph: sub
    .field('openGraph')
    .project((og) => ({
      ogTitle: og.field('ogTitle'),
      ogDescription: og.field('ogDescription'),
      ogImage: og.field('ogImage').project(imageWithAltFragment),
    }))
    .nullable(true),
}));
```

- [ ] **Step 2: Update `toSeoMeta` inputs (output type unchanged)**

`packages/service/src/shared/transformers/to-seo-meta.ts` — keep `TSeoMeta`
exactly as-is; read og values from `raw.openGraph`:

```ts
export function toSeoMeta(raw: TRawSeo): TSeoMeta {
  return {
    metaTitle: raw.metaTitle,
    metaDescription: raw.metaDescription ?? undefined,
    ogTitle: raw.openGraph?.ogTitle ?? undefined,
    ogDescription: raw.openGraph?.ogDescription ?? undefined,
    ogImageUrl: buildImageUrl(raw.openGraph?.ogImage),
  };
}
```

- [ ] **Step 3: Update `siteSettingsQuery` to project `defaultSeo`**

In `packages/service/src/features/global/site-settings/adaptor/query.ts`,
replace the three flat og projections with a `defaultSeo` projection (ogImage
`.notNull()` since the schema custom-validates it required):

```ts
    defaultSeo: sub
      .field('defaultSeo')
      .project((og) => ({
        ogTitle: og.field('ogTitle'),
        ogDescription: og.field('ogDescription'),
        ogImage: og.field('ogImage').project(imageWithAltFragment).notNull(),
      }))
      .notNull(),
```

- [ ] **Step 4: Update `toSiteSettings` inputs (output type unchanged)**

In `.../adaptor/transformer.ts`, keep `TSiteSettings` unchanged; read og values
from `raw.defaultSeo`:

```ts
    logoUrl: buildImageUrl(raw.logo),
    ogImageUrl: buildImageUrl(raw.defaultSeo.ogImage),
    ogTitle: raw.defaultSeo.ogTitle ?? undefined,
    ogDescription: raw.defaultSeo.ogDescription ?? undefined,
```

- [ ] **Step 5: Update raw fixtures to the nested shape**

In the service fixtures/tests, change the **raw** SEO/siteSettings fixtures from
flat `ogTitle/ogDescription/ogImage` to nested `openGraph: { _type:'openGraph',
ogTitle, ogDescription, ogImage }` (for `seo`) and `defaultSeo: { _type:'openGraph',
ogImage, ... }` (for siteSettings). Leave every **assertion** on `TSeoMeta`/
`TSiteSettings` (e.g. `expect(result.ogImageUrl).toBe(...)`) unchanged — the
outputs are identical.

- [ ] **Step 6: Run service tests + checks**

```bash
pnpm --filter @blog/service type-check
pnpm --filter @blog/service lint
pnpm --filter @blog/service test
```

Expected: PASS.

- [ ] **Step 7: Commit (GATE)** — `refactor(service): read SEO/OG from openGraph`.

---

## Task 4 — Verify downstream unchanged + full pipeline

- [ ] **Step 1: Confirm `apps/web` reads only view-models (no schema fields)**

`apps/web/src/app/[locale]/page.tsx` `generateMetadata` uses `home.seo?.metaTitle`,
`home.seo?.ogTitle`, `home.seo?.ogImageUrl`, `settings.ogTitle`,
`settings.ogImageUrl` — all **view-model** fields (`TSeoMeta`/`TSiteSettings`),
which are unchanged. No edit expected. Grep to be sure nothing reads a raw
`openGraph`/`defaultSeo`:

```bash
grep -rn "openGraph\|defaultSeo" apps/web/src packages/ui/src
```

Expected: no matches.

- [ ] **Step 2: Full multi-layer verification**

```bash
pnpm typegen
pnpm type-check
pnpm lint
pnpm test
pnpm --filter web build
```

Expected: all green. Fix the failing layer and re-run from that step.

- [ ] **Step 3:** Push + PR gates (separate approvals). PR `refactor(cms):
extract openGraph + consolidate SEO/OG (#242 P2)`, `Closes #247 Refs #242`.
      On PR open set **#247 → Code Review**; #242 stays In Progress.

---

## Self-review

- **Spec coverage:** openGraph extraction ✔ (Task 1), seo uses openGraph ✔,
  siteSettings `defaultSeo` ✔, `post.tags` drop ✔ (folded here per decision),
  seo collapsed-by-default ✔ (user request, Task 1 Step 3/5), migration ✔
  (Task 2). Naming/`_type` renames are **out of scope** (Phase 6).
- **Placeholder scan:** all code steps show real code; the only deferred detail
  is the exact `sanity/migrate` `at()` path typing, flagged for context7.
- **Type consistency:** `openGraph` object shape is identical in schema, fragment
  projection, and migration `toOpenGraph`. View-models `TSeoMeta`/`TSiteSettings`
  are explicitly unchanged, which is what keeps `ui`/`web` out of scope.

## Layers NOT touched (do not invoke their agents)

- `@blog/ui` — unchanged (consumes unchanged view-models).
- `apps/web` — unchanged (Task 4 verifies).

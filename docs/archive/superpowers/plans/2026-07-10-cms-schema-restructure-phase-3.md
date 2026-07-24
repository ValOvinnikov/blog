# Phase 3 — Split siteSettings into site / navigation / footer + `brand` — Plan

> **Archived — implemented.** See SPEC.md §6. Content model for current behavior.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.
> Part of #242 · sub-issue **#248** · master plan
> `docs/superpowers/plans/2026-07-10-cms-schema-restructure-plan.md`.

**Goal:** Break the `siteSettings` god-object apart: introduce a `brand` object
(single source for header wordmark + footer name), and extract `navigation` and
`socialLinks` into two new top-level singletons `settings_navigation` and
`settings_footer` — migrating existing data.

**Architecture:** `cms` schema + desk + `pnpm typegen` → **migration**
(creates the two singletons from the old arrays + folds brand fields; human-gated)
→ `service` (split into three `global` features; **`TSiteSettings` changes**, add
`TNavigation`/`TFooter`) → `web` (re-wire `layout.tsx` + `page.tsx` metadata).
**`@blog/ui` is prop-driven and unchanged** — do not invoke the `ui` agent.

**Tech Stack:** Sanity v6, `sanity/migrate`, groqd, Next.js 15.

## Global Constraints (inherited)

- Project `ccs8c2no` / dataset `production`. **Migration is human-gated.**
- `.required()` → `.notNull()` in projections; optional → plain `sub.field()`;
  view-models `T | undefined`, no faked defaults.
- **Document `_type` prefixes for EXISTING docs are deferred to Phase 6** — so
  `siteSettings` keeps its `_type` here; only its fields change. The two NEW
  singletons are created with their **final** names `settings_navigation` /
  `settings_footer` (new types → no rename cost later).
- `navItem`/`socialLink` object types are unchanged here (they fold into `link`
  in Phase 4). TS `strict`, no `any`. Commit/push/PR are three gates.

## Migration check

🟡 **Migration required.** Creates two new singleton documents from the existing
`siteSettings.navigation`/`socialLinks` arrays and folds `title`/`brandPrefix`/
`brandSuffix`/`logo` into `siteSettings.brand`. Live data must move.

## Scope decision (footer)

`settings_footer` gets **`social: socialLink[]` only** (matches what the footer
actually renders today). A footer _nav_ list is **deferred** (YAGNI until there
is footer-nav content) — this refines the master plan's "nav + social".

## Layer sequence

`cms` (+typegen) → **migration** → `service` (+tests) → `web` (+tests) → verify.
`ui` NOT invoked.

---

## Task 1 — CMS: brand object, two singletons, siteSettings slimming, desk

**Files:**

- Create: `apps/cms/src/schema-types/objects/brand.ts`
- Create: `apps/cms/src/schema-types/documents/settings/navigation.ts`
- Create: `apps/cms/src/schema-types/documents/settings/footer.ts`
- Modify: `apps/cms/src/schema-types/objects/index.ts` (register `brand`)
- Modify: `apps/cms/src/schema-types/documents/index.ts` (register the two singletons)
- Modify: `apps/cms/src/schema-types/documents/settings/site-settings.ts`
  (add `brand`; remove `title`/`brandPrefix`/`brandSuffix`/`logo`/`navigation`/`socialLinks`)
- Modify: `apps/cms/sanity.config.ts` (desk: Navigation + Footer singletons)
- Regenerate: `packages/config/src/sanity/generated/{types.ts,schema.json}`

**Produces:** `Brand = { _type:'brand'; name; prefix; suffix; logo: ImageWithAlt }`;
`SiteSettings` = `{ ..., description, tagline?, defaultSeo, brand }` (no title/
brand*/logo/navigation/socialLinks); new `SettingsNavigation = { items?: NavItem[] }`,
`SettingsFooter = { social?: SocialLink[] }`.

- [ ] **Step 1: `brand` object** — `apps/cms/src/schema-types/objects/brand.ts`

```ts
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'brand',
  title: 'Brand',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'Brand name — shown in the footer, browser tab, and RSS feed.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'prefix',
      title: 'Logo Prefix',
      type: 'string',
      description: 'Primary header wordmark text, e.g. "val".',
      validation: (rule) => rule.required().max(30),
    }),
    defineField({
      name: 'suffix',
      title: 'Logo Suffix',
      type: 'string',
      description: 'Accent suffix after the prefix, e.g. ".dev".',
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'imageWithAlt',
      description: 'Site logo. SVG or high-res PNG recommended.',
      validation: (rule) => rule.required(),
    }),
  ],
});
```

Register in `objects/index.ts` (add `import brand from './brand';` and put
`brand` in the array).

- [ ] **Step 2: `settings_navigation` singleton** — `documents/settings/navigation.ts`

```ts
import { Menu } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'settings_navigation',
  title: 'Navigation',
  type: 'document',
  icon: Menu,
  fields: [
    defineField({
      name: 'items',
      title: 'Header Links',
      type: 'array',
      description: 'Top-level nav links rendered in the site header.',
      of: [defineArrayMember({ type: 'navItem' })],
    }),
  ],
});
```

- [ ] **Step 3: `settings_footer` singleton** — `documents/settings/footer.ts`

```ts
import { PanelBottom } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
  icon: PanelBottom,
  fields: [
    defineField({
      name: 'social',
      title: 'Social Links',
      type: 'array',
      description: 'Social profile links shown in the site footer.',
      of: [defineArrayMember({ type: 'socialLink' })],
    }),
  ],
});
```

Register both in `documents/index.ts`.

- [ ] **Step 4: Slim `siteSettings`** — in `site-settings.ts`, replace the
      `title`, `logo`, `brandPrefix`, `brandSuffix` fields with a single `brand`
      field, and delete the `navigation` + `socialLinks` fields. Keep `description`,
      `tagline`, `defaultSeo`.

```ts
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'brand',
      validation: (rule) => rule.required(),
    }),
    // keep: description, tagline, defaultSeo
    // DELETE: title, logo, brandPrefix, brandSuffix, navigation, socialLinks
```

- [ ] **Step 5: Desk** — in `apps/cms/sanity.config.ts`, add top-level
      **Navigation** and **Footer** singletons (fixed `documentId`) alongside
      **Site Settings**, e.g. under the existing Settings group or as siblings:

```ts
S.listItem().title('Navigation').id('settings_navigation').icon(Menu)
  .child(S.document().schemaType('settings_navigation').documentId('settings_navigation')),
S.listItem().title('Footer').id('settings_footer').icon(PanelBottom)
  .child(S.document().schemaType('settings_footer').documentId('settings_footer')),
```

Import `Menu`, `PanelBottom` from `lucide-react`. Keep the Site Settings
singleton.

- [ ] **Step 6: typegen + verify cms**

```bash
pnpm typegen
pnpm --filter cms type-check
pnpm --filter cms lint
```

Expected: `Brand` type added; `SiteSettings` slimmed with `brand`;
`SettingsNavigation`/`SettingsFooter` added. type-check + lint PASS.

- [ ] **Step 7: Commit (GATE).**

---

## Task 2 — Migration: create the singletons + fold brand fields

**Files:** Create `apps/cms/migrations/split-site-settings/index.ts`

This migration is **more involved than Phase 2** because it must _create two new
documents_ from `siteSettings` data (not just patch in place). The
`document()` node-visitor only patches the visited doc, so creating the new
singletons needs the **create-mutation** form. **Resolve the exact API via the
`use-context7` skill** (topic: "sanity/migrate create document mutation
createIfNotExists async migrate") before writing — do not guess.

**Intended transforms (author against the verified API):**

- `createIfNotExists` `{ _id:'settings_navigation', _type:'settings_navigation',
items: <old siteSettings.navigation> }`.
- `createIfNotExists` `{ _id:'settings_footer', _type:'settings_footer',
social: <old siteSettings.socialLinks> }`.
- Patch `siteSettings`: `set('brand', { _type:'brand', name:<title>,
prefix:<brandPrefix>, suffix:<brandSuffix>, logo:<logo> })`, then `unset`
  `title`, `brandPrefix`, `brandSuffix`, `logo`, `navigation`, `socialLinks`.

- [ ] **Step 1:** Fetch the create-migration API via context7; write the
      migration; `pnpm --filter cms type-check` + `lint` PASS.
- [ ] **Step 2:** Present the human-gated commands (do NOT run):

```bash
pnpm --filter cms dataset:export -- migrations/backups/production-pre-split.tar.gz
pnpm --filter cms migrate:dry -- split-site-settings
# human: pnpm --filter cms migrate:run -- split-site-settings
```

> **Alternative if create-in-migration proves awkward:** seed the two singletons
> once by hand in the Studio (or a one-off `sanity exec` script), and keep the
> migration to only the `siteSettings` field-fold. Decide during execution.

- [ ] **Step 3:** Commit the migration (GATE) — fold into Task 1's commit or a
      follow-up `chore(cms)` commit.

---

## Task 3 — Service: split into site / navigation / footer features

**Files:**

- Modify `packages/service/src/features/global/site-settings/adaptor/{query,transformer,types}.ts`
  — `siteSettings` now exposes `brand` (name/prefix/suffix/logoUrl), keeps
  `description`/`tagline`/`defaultSeo`; **drops** `title`/`brandPrefix`/
  `brandSuffix`/`logoUrl`/`navigation`/`socialLinks` from `TSiteSettings`.
- Create `packages/service/src/features/global/navigation/**` mirroring the
  site-settings feature (adaptor `query`/`transformer`/`types`/`loader`,
  `application/service`, `index`), exposing
  `service.global.navigation.v1.getNavigation()` → `{ items: TNavItem[] }`.
- Create `packages/service/src/features/global/footer/**` likewise →
  `service.global.footer.v1.getFooter()` → `{ social: TSocialLink[] }`.
- Modify `packages/service/src/index.ts` and the `global` barrel to export the
  two new features.
- Update/`add tests + fixtures` per `testing-practices`.

**View-models (produce):**

```ts
// site-settings/adaptor/types.ts
export type TBrand = {
  name: string;
  prefix: string;
  suffix: string | undefined;
  logoUrl: string | undefined;
};
export type TSiteSettings = {
  brand: TBrand;
  description: string;
  tagline: string | undefined;
  ogImageUrl: string | undefined; // from defaultSeo (unchanged from P2)
  ogTitle: string | undefined;
  ogDescription: string | undefined;
};

// navigation/adaptor/types.ts
export type TNavItem = { label: string; href: string };
export type TNavigation = { items: TNavItem[] };

// footer/adaptor/types.ts  (TSocialLink already exists in shared)
export type TFooter = { social: TSocialLink[] };
```

- [ ] **Step 1: siteSettings query → project `brand`** (replace the old flat
      title/brand*/logo/navigation/socialLinks projections):

```ts
    brand: sub
      .field('brand')
      .project((b) => ({
        name: b.field('name').notNull(),
        prefix: b.field('prefix').notNull(),
        suffix: b.field('suffix'),
        logo: b.field('logo').project(imageWithAltFragment).notNull(),
      }))
      .notNull(),
    description: sub.field('description').notNull(),
    tagline: sub.field('tagline'),
    defaultSeo: sub.field('defaultSeo').project(openGraphFragment).notNull(),
```

(Remove the `navigation`/`socialLinks` projections — they move to the new
features. Keep the `defaultSeo` projection from P2.)

- [ ] **Step 2: `toSiteSettings`** — build `brand: { name, prefix, suffix,
logoUrl: buildImageUrl(raw.brand.logo) }`; keep `description`, `tagline`,
      `ogImageUrl`/`ogTitle`/`ogDescription` from `raw.defaultSeo`. Drop the removed
      fields.

- [ ] **Step 3: navigation feature** — `navigation/adaptor/query.ts`:

```ts
import { q } from '#/sanity/query';

export const navigationQuery = q.star
  .filterByType('settings_navigation')
  .slice(0)
  .project((sub) => ({
    items: sub
      .field('items[]')
      .project((s) => ({
        label: s.field('label').notNull(),
        href: s.field('href').notNull(),
      }))
      .nullable(true),
  }))
  .notNull();
```

`toNavigation(raw) => ({ items: raw.items ?? [] })`; loader/service mirror
`site-settings` (same `v1` shape, `getNavigation()`).

- [ ] **Step 4: footer feature** — `footer/adaptor/query.ts`:

```ts
import { q } from '#/sanity/query';
import { socialLinkFragment } from '#/shared/fragments/social-link';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(socialLinkFragment).nullable(true),
  }))
  .notNull();
```

`toFooter(raw) => ({ social: (raw.social ?? []).map(toSocialLink) })`;
loader/service mirror `site-settings`, `getFooter()`.

- [ ] **Step 5: Export** the two features from `global` and `src/index.ts`
      (`service.global.navigation.v1`, `service.global.footer.v1`).

- [ ] **Step 6: Tests + fixtures** — add `navigation`/`footer` loader+service
      tests mirroring site-settings; update the `siteSettings` fixtures/tests to the
      `brand` shape (raw `brand` object; assertions on the new `TSiteSettings`).

- [ ] **Step 7: verify + commit (GATE)**

```bash
pnpm --filter @blog/service type-check && pnpm --filter @blog/service lint && pnpm --filter @blog/service test
```

---

## Task 4 — Web: re-wire layout + metadata

**Files:**

- Modify `apps/web/src/app/[locale]/layout.tsx`
- Modify `apps/web/src/app/[locale]/page.tsx` (metadata reads `settings.brand.name`
  where it used `settings.title`)

- [ ] **Step 1: layout data** — fetch all three singletons in parallel:

```ts
const [settingsResult, navResult, footerResult] = await Promise.all([
  service.global.siteSettings.v1.getSiteSettings(),
  service.global.navigation.v1.getNavigation(),
  service.global.footer.v1.getFooter(),
]);
```

Handle `!ok` for `settings` with `notFound()` (as today); nav/footer can fall
back to empty (`navResult.ok ? navResult.data.items : []`).

- [ ] **Step 2: header/footer JSX** — Logo `prefix={settings.data.brand.prefix}`
      `suffix={settings.data.brand.suffix}`; `PrimaryNavigation links={navItems...}`;
      `Footer.Copyright title={brand.name}`; social from footer `social` list
      (`link.url`/`link.platform` unchanged — still `socialLink` shape in Phase 3).

- [ ] **Step 3: metadata** — in `layout.tsx` `generateMetadata` use
      `brand.name` for the title default/template; in `page.tsx` replace
      `settings?.title` with `settings?.brand.name`. `description`/OG reads are
      unchanged.

- [ ] **Step 4: verify** — `apps/web` type-check (view-model change ripples
      here); fix references. `ui` is untouched.

---

## Task 5 — Full verification + gates

- [ ] `pnpm typegen && pnpm type-check && pnpm lint && pnpm test` — all green.
- [ ] `pnpm --filter web build` — note: fails on missing SANITY env in the
      worktree (env, not code); CI authoritative. Also **requires the migration to
      have run** against production (new singletons + `brand`), same deploy-ordering
      caveat as P2.
- [ ] Push + PR gates (separate). PR `refactor(cms): split siteSettings into
site/navigation/footer + brand (#242 P3)`, `Closes #248 Refs #242`. On PR open
      set **#248 → Code Review**.

## Self-review

- **Spec coverage:** brand consolidation (point 9) ✔; navigation → singleton ✔;
  socialLinks → footer singleton ✔; Studio top-level Navigation/Footer ✔.
  `_type` prefix of `siteSettings`→`settings_site` remains Phase 6.
- **Placeholders:** schema + service view-models + web wiring are concrete; the
  only flagged unknown is the create-document migration API (→ context7).
- **Type consistency:** `TBrand`/`TSiteSettings`/`TNavigation`/`TFooter` are used
  consistently across service and web; `navItem`/`socialLink` shapes unchanged
  (Phase 4 folds them into `link`).

## Layers NOT touched

- `@blog/ui` — Header/Footer/PrimaryNavigation/Logo are prop-driven; unchanged.

## ⚠️ Deploy ordering (same as P2)

`siteSettings.brand` and the two singletons are required/expected by the new
code. Run `split-site-settings` on `production` **before** deploying this phase.

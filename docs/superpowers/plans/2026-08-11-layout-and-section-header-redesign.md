# Layout & SectionHeader Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `appearance` CMS field with a trimmed `layout` field
(spacing/container-width/dividers, no `align`), add a new `sectionHeader`
field group (heading/supportingText/left-center-right align) to CTA,
Post List, and Newsletter modules, drop Hero's hardcoded border, and make
`Section`'s vertical spacing responsive.

**Architecture:** Follows this repo's standard layer chain
`config → cms → service → ui → web`, with a content migration sequenced
right after the `cms` schema+typegen step (existing `heading`/`title`/`text`/
`description` values on live modules must carry forward; `appearance`
needs no migration — nothing is populated in production yet). One task per
layer, matching this repo's "prefer one PR per layer" convention.

**Tech Stack:** Sanity Studio v6 (schema + `sanity/migrate`), groqd (typed
GROQ), tailwind-variants (`tv()`), Next.js 16 App Router, Vitest.

## Global Constraints

- Layer contracts (`SPEC.md`): `web → ui, service, config`; `service → config`
  (no React); `ui → config` (no Sanity/fetch); `cms → config` (types via
  typegen). Never violate these.
- Enum-ish stored values: **both key and value UPPERCASE**, `as const`, live
  in `@blog/config`.
- No `'use client'` in `@blog/ui`.
- Never assert Tailwind/presentation classes in tests (`toHaveClass` on
  spacing/alignment utility classes is disallowed) — assert accessible
  name/role/text content instead.
- Schema field definitions use named exports (`{localName}Schema`), never
  `export default defineType`.
- After every schema change: `pnpm --filter cms typegen`, re-run until the
  diff is minimal, then commit the regenerated files in
  `packages/config/src/sanity/generated/`.
- `pnpm typegen` is a write — never hand this to `verify-runner` or any
  read-only reviewer; run it inline, yourself, before verify.
- No faked defaults in transformers — use groqd's `.notNull()` when a value
  is guaranteed present (CMS-validated required), `.nullable(true)` +
  `?? undefined` otherwise. Never fake a default value.
- Destructure a fetched result's fields once, right after its null/`ok`
  guard — don't repeat `result.data.x` inline at each use site.
- Content migrations: dry-run → dataset export (backup) → human-gated run.
  This plan writes and dry-run-verifies the migration; the actual
  `migrate:run` against `production` stays a separate, human-gated action
  after this branch merges (per `apps/cms/migrations/README.md` and
  `CLAUDE.md`'s "Migrations against `production` are human-gated" rule) —
  no task in this plan runs it for real.

---

## Task 1: `config` — rename `appearance` → `layout`, add `SectionHeader` types

**Files:**

- Rename: `packages/config/src/constants/appearance.ts` →
  `packages/config/src/constants/layout.ts`
- Modify: `packages/config/src/constants/index.ts`

**Interfaces:**

- Produces: `TLayout` (replaces `TAppearance`), `HEADING_ALIGN`/`THeadingAlign`
  (new), `TSectionHeader` (new). `BRAND_VARIANT`/`TBrandVariant`/
  `TBrandVariantOf`/`SPACING_SCALE`/`TSpacingScale`/`CONTAINER_WIDTH`/
  `TContainerWidth` are unchanged (still exported from the renamed file).
  `ALIGN`/`TAlign` are deleted — no replacement.

- [ ] **Step 1: Rewrite the renamed file**

```bash
git mv packages/config/src/constants/appearance.ts packages/config/src/constants/layout.ts
```

Replace its contents with:

```ts
import type { TValueOf } from '@blog/config/utils';

export const BRAND_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  BRAND_PRIMARY: 'BRAND_PRIMARY',
} as const;

export type TBrandVariant = TValueOf<typeof BRAND_VARIANT>;

export type TBrandVariantOf<TKeys extends keyof typeof BRAND_VARIANT> =
  (typeof BRAND_VARIANT)[TKeys];

export const SPACING_SCALE = {
  NONE: 'NONE',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
} as const;

export type TSpacingScale = TValueOf<typeof SPACING_SCALE>;

export const CONTAINER_WIDTH = {
  NARROW: 'NARROW',
  WIDE: 'WIDE',
  FULL: 'FULL',
} as const;

export type TContainerWidth = TValueOf<typeof CONTAINER_WIDTH>;

export type TLayout = {
  spacingTop?: TSpacingScale;
  spacingBottom?: TSpacingScale;
  containerWidth?: TContainerWidth;
  dividerTop?: boolean;
  dividerBottom?: boolean;
};

export const HEADING_ALIGN = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
} as const;

export type THeadingAlign = TValueOf<typeof HEADING_ALIGN>;

export type TSectionHeader = {
  heading?: string;
  supportingText?: string;
  align?: THeadingAlign;
};
```

- [ ] **Step 2: Update the barrel export**

In `packages/config/src/constants/index.ts`, change:

```ts
export * from './appearance';
```

to:

```ts
export * from './layout';
```

- [ ] **Step 3: Verify**

```bash
pnpm --filter @blog/config type-check
pnpm --filter @blog/config lint
```

Expected: both clean. No test file is needed for this change — simple
UPPERCASE key/value const files are already covered by TypeScript, matching
this repo's existing convention (no dedicated test exists for
`appearance.ts` today either).

- [ ] **Step 4: Commit**

```bash
git add packages/config/src/constants/layout.ts packages/config/src/constants/index.ts
git rm packages/config/src/constants/appearance.ts 2>/dev/null || true
git commit -m "feat(config): rename appearance to layout, add SectionHeader types"
```

(The `git mv` in Step 1 already stages the rename; the `git rm` is a no-op
safety net if the mv didn't stage cleanly.)

---

## Task 2: `cms` — schema changes across all five modules + typegen

**Depends on:** Task 1 (`TLayout`/`HEADING_ALIGN`/`TSectionHeader` must exist).

**Files:**

- Delete: `apps/cms/src/schema-types/objects/appearance.ts`,
  `apps/cms/src/schema-types/helpers/appearance-field.ts`
- Create: `apps/cms/src/schema-types/objects/layout.ts`,
  `apps/cms/src/schema-types/objects/hero-layout.ts`,
  `apps/cms/src/schema-types/objects/section-header.ts`,
  `apps/cms/src/schema-types/helpers/layout-field.ts`,
  `apps/cms/src/schema-types/helpers/section-header-field.ts`
- Modify: `apps/cms/src/schema-types/objects/index.ts`,
  `apps/cms/src/schema-types/modules/module-content.ts`,
  `apps/cms/src/schema-types/modules/module-cta.ts`,
  `apps/cms/src/schema-types/modules/module-post-list.ts`,
  `apps/cms/src/schema-types/modules/module-newsletter.ts`,
  `apps/cms/src/schema-types/modules/module-hero.ts`

**Interfaces:**

- Consumes: `TLayout`, `HEADING_ALIGN`, `TSectionHeader` (Task 1).
- Produces: `layoutSchema` (name `'layout'`), `heroLayoutSchema` (name
  `'heroLayout'`), `sectionHeaderSchema` (name `'sectionHeader'`),
  `requiredHeadingSectionHeaderSchema` (name `'requiredHeadingSectionHeader'`),
  `layoutField`, `heroLayoutField`, `sectionHeaderField(options?: {
requireHeading?: boolean })` — every later `service`-layer query references
  these field/type **names** (not the TS symbols) in GROQ paths (`layout`,
  `sectionHeader` — the Studio field name is identical for both
  `sectionHeaderField()` variants, only the backing Sanity type differs, so
  GROQ paths never need to know which variant backs a given module).

### Step 1: `layoutSchema` + `heroLayoutSchema` (mirrors the existing `imageWithAlt`/`bodyImage` shared-field-builder pattern)

- [ ] Create `apps/cms/src/schema-types/objects/layout.ts`:

```ts
import { CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { EnabledStateBooleanInput } from '@cms/schema-types/components/enabled-state-boolean-input';
import { SlidersHorizontal } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const spacingOptions = [
  { title: 'None', value: SPACING_SCALE.NONE },
  { title: 'Small', value: SPACING_SCALE.SM },
  { title: 'Medium', value: SPACING_SCALE.MD },
  { title: 'Large', value: SPACING_SCALE.LG },
  { title: 'Extra large', value: SPACING_SCALE.XL },
];

/**
 * Shared spacing + divider fields for both `layoutSchema` (below) and
 * `heroLayoutSchema` (`hero-layout.ts`) — the two types differ only in
 * whether `containerWidth` is present, so the overlapping fields are built
 * once here rather than duplicated (same pattern as `imageAltField()` shared
 * between `imageWithAlt`/`bodyImage`).
 */
export const spacingAndDividerFields = () => [
  defineField({
    name: 'spacingTop',
    title: 'Spacing Top',
    type: 'string',
    description:
      'Space above this section. Leave unset for the default spacing.',
    options: { list: spacingOptions },
  }),
  defineField({
    name: 'spacingBottom',
    title: 'Spacing Bottom',
    type: 'string',
    description:
      'Space below this section. Leave unset for the default spacing.',
    options: { list: spacingOptions },
  }),
  defineField({
    name: 'dividerTop',
    title: 'Divider Top',
    type: 'boolean',
    description:
      'Shows a hairline border above this section when enabled; hidden when disabled.',
    components: { input: EnabledStateBooleanInput },
  }),
  defineField({
    name: 'dividerBottom',
    title: 'Divider Bottom',
    type: 'boolean',
    description:
      'Shows a hairline border below this section when enabled; hidden when disabled.',
    components: { input: EnabledStateBooleanInput },
  }),
];

export const layoutSchema = defineType({
  name: 'layout',
  title: 'Layout',
  type: 'object',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    ...spacingAndDividerFields().slice(0, 2),
    defineField({
      name: 'containerWidth',
      title: 'Container Width',
      type: 'string',
      description:
        "How wide this section's content can grow. Leave unset for the default width.",
      options: {
        list: Object.values(CONTAINER_WIDTH).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    ...spacingAndDividerFields().slice(2),
  ],
});
```

- [ ] Create `apps/cms/src/schema-types/objects/hero-layout.ts`:

```ts
import { spacingAndDividerFields } from '@cms/schema-types/objects/layout';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

/**
 * Hero's trimmed Layout — no `containerWidth`, since Hero's grid always
 * manages its own width. Shares its fields with `layoutSchema` via
 * `spacingAndDividerFields()` but is a distinct registered type (Sanity
 * validation/fields are fixed per named type, so two modules needing
 * different field sets need two types — same reasoning as
 * `imageWithAlt`/`bodyImage`).
 */
export const heroLayoutSchema = defineType({
  name: 'heroLayout',
  title: 'Layout',
  type: 'object',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: spacingAndDividerFields(),
});
```

- [ ] Create `apps/cms/src/schema-types/helpers/layout-field.ts`:

```ts
import { heroLayoutSchema } from '@cms/schema-types/objects/hero-layout';
import { layoutSchema } from '@cms/schema-types/objects/layout';
import { defineField } from 'sanity';

export const layoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: layoutSchema.name,
  description:
    'Optional visual overrides — spacing, container width, dividers.',
});

export const heroLayoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: heroLayoutSchema.name,
  description: 'Optional visual overrides — spacing, dividers.',
});
```

- [ ] Delete the old files:

```bash
git rm apps/cms/src/schema-types/objects/appearance.ts
git rm apps/cms/src/schema-types/helpers/appearance-field.ts
```

### Step 2: `sectionHeaderSchema` + `requiredHeadingSectionHeaderSchema`

- [ ] Create `apps/cms/src/schema-types/objects/section-header.ts`:

```ts
import { HEADING_ALIGN } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField, defineType } from 'sanity';

const alignOptions = Object.values(HEADING_ALIGN).map((value) => ({
  title: toTitleCase(value),
  value,
}));

const sectionHeaderFields = (options: { requireHeading?: boolean } = {}) => [
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'string',
    validation: (rule) =>
      options.requireHeading ? rule.required().max(80) : rule.max(80),
  }),
  defineField({
    name: 'supportingText',
    title: 'Supporting Text',
    type: 'text',
    validation: (rule) => rule.max(300),
  }),
  defineField({
    name: 'align',
    title: 'Align',
    type: 'string',
    description:
      'Horizontal alignment of the heading. Leave unset for the default (left-aligned).',
    options: { list: alignOptions },
  }),
];

export const sectionHeaderSchema = defineType({
  name: 'sectionHeader',
  title: 'Section Header',
  type: 'object',
  fields: sectionHeaderFields(),
});

/**
 * Same shape as `sectionHeaderSchema` but `heading` is required — for
 * modules where an empty heading isn't a valid state (CTA, Newsletter).
 * Sanity field validation is fixed per named type, so a per-module override
 * needs a second registered type rather than one shared type with
 * conditional validation.
 */
export const requiredHeadingSectionHeaderSchema = defineType({
  name: 'requiredHeadingSectionHeader',
  title: 'Section Header',
  type: 'object',
  fields: sectionHeaderFields({ requireHeading: true }),
});
```

- [ ] Create `apps/cms/src/schema-types/helpers/section-header-field.ts`:

```ts
import { requiredHeadingSectionHeaderSchema } from '@cms/schema-types/objects/section-header';
import { sectionHeaderSchema } from '@cms/schema-types/objects/section-header';
import { defineField } from 'sanity';

export const sectionHeaderField = (
  options: { requireHeading?: boolean } = {},
) =>
  defineField({
    name: 'sectionHeader',
    title: 'Section Header',
    type: options.requireHeading
      ? requiredHeadingSectionHeaderSchema.name
      : sectionHeaderSchema.name,
    description:
      'Optional heading and supporting text shown above this module.',
  });
```

### Step 3: register the four new object types, remove the old one

- [ ] Modify `apps/cms/src/schema-types/objects/index.ts` — replace the
      `appearanceSchema` import/entry with the four new types:

```ts
import { asideSchema } from './aside';
import { blockTextSchema } from './block-text';
import { bodyImageSchema } from './body-image';
import { brandSchema } from './brand';
import { heroLayoutSchema } from './hero-layout';
import { imageWithAltSchema } from './image-with-alt';
import { layoutSchema } from './layout';
import { linkSchema } from './link';
import { openGraphSchema } from './open-graph';
import { richTextSchema } from './rich-text';
import { seoSchema } from './seo';
import {
  requiredHeadingSectionHeaderSchema,
  sectionHeaderSchema,
} from './section-header';
import { skimSchema } from './skim';
import { socialLinkSchema } from './social-link';
import { specLineSchema } from './spec-line';

export const objects = [
  layoutSchema,
  heroLayoutSchema,
  sectionHeaderSchema,
  requiredHeadingSectionHeaderSchema,
  imageWithAltSchema,
  bodyImageSchema,
  asideSchema,
  richTextSchema,
  blockTextSchema,
  socialLinkSchema,
  linkSchema,
  openGraphSchema,
  seoSchema,
  specLineSchema,
  brandSchema,
  skimSchema,
];
```

### Step 4: wire the new fields into each module schema

- [ ] `apps/cms/src/schema-types/modules/module-content.ts` — swap
      `appearanceField` for `layoutField`, no `sectionHeaderField` (see
      spec's "`module_content` does not get `SectionHeader` at all"):

```ts
import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { richTextSchema } from '@cms/schema-types/objects/rich-text';
import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const contentSchema = defineType({
  name: 'module_content',
  title: 'Content',
  type: 'document',
  icon: FileText,
  fields: [
    titleField(),
    brandVariantField(),
    defineField({
      name: 'body',
      title: 'Body',
      type: richTextSchema.name,
      description:
        'Page content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
      };
    },
  },
});
```

- [ ] `apps/cms/src/schema-types/modules/module-cta.ts` — replace `heading`/
      `text` with `sectionHeaderField({ requireHeading: true })`, swap
      `appearanceField` for `layoutField`:

```ts
import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@cms/schema-types/helpers/section-header-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { linkSchema } from '@cms/schema-types/objects/link';
import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const ctaSchema = defineType({
  name: 'module_cta',
  title: 'Call to Action',
  type: 'document',
  icon: Megaphone,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField({ requireHeading: true }),
    defineField({
      name: 'action',
      title: 'Action',
      type: linkSchema.name,
      validation: (rule) => rule.required(),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sectionHeader.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
```

- [ ] `apps/cms/src/schema-types/modules/module-post-list.ts` — add
      `sectionHeaderField()` (optional heading), swap `appearanceField` for
      `layoutField`, keep `titleField` bare (now purely internal — no
      `description` override needed since it stops describing a "Display
      heading" role):

```ts
import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@cms/schema-types/helpers/section-header-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postListSchema = defineType({
  name: 'module_postList',
  title: 'Post List',
  type: 'document',
  icon: List,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField(),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of posts to show.',
      validation: (rule) => rule.required().integer().min(1).max(12),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      limit: 'limit',
    },
    prepare({ title, limit }) {
      return {
        title: title ?? 'Unknown',
        subtitle: limit ? `Limit: ${String(limit)}` : undefined,
      };
    },
  },
});
```

- [ ] `apps/cms/src/schema-types/modules/module-newsletter.ts` — replace
      `newsletterContentFields()` with `sectionHeaderField({ requireHeading:
true })`, swap `appearanceField` for `layoutField`:

```ts
import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@cms/schema-types/helpers/section-header-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { Mail } from 'lucide-react';
import { defineType } from 'sanity';

export const newsletterSchema = defineType({
  name: 'module_newsletter',
  title: 'Newsletter Signup',
  type: 'document',
  icon: Mail,
  fields: [
    titleField({ description: 'Internal label shown in the Studio.' }),
    brandVariantField(),
    sectionHeaderField({ requireHeading: true }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sectionHeader.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
```

`newsletterContentFields()` (`schema-types/helpers/newsletter-content-fields.ts`)
is now unused by `module_newsletter` but **stays** — `settings_newsletter`
still uses it (confirmed by reading `settings-newsletter.ts`'s import before
deleting anything; if that document has since stopped importing it, delete
the helper file, otherwise leave it as-is). Do not delete it speculatively.

- [ ] `apps/cms/src/schema-types/modules/module-hero.ts` — swap
      `appearanceField` for `heroLayoutField` (only this one line changes;
      everything else — `titleField`, `brandVariantField` with its wider
      list, the four `defineModeFieldPair` blocks, `primaryActionLabel`,
      `secondaryAction` — is untouched):

Change the import:

```ts
import { heroLayoutField } from '@cms/schema-types/helpers/layout-field';
```

and the final field in the `fields` array from `appearanceField` to
`heroLayoutField`.

### Step 5: typegen

- [ ] Run:

```bash
pnpm --filter cms typegen
```

Expected: regenerates `packages/config/src/sanity/generated/schema.json` and
`packages/config/src/sanity/generated/types.ts`. Inspect the diff — it
should show `Appearance`/`appearance` types replaced by `Layout`/`layout`,
`HeroLayout`/`heroLayout`, `SectionHeader`/`sectionHeader`,
`RequiredHeadingSectionHeader`, and each of `module_cta`/`module_newsletter`/
`module_postList`'s generated type losing its old `heading`/`text`/
`description`/dual-purpose-`title`-as-heading shape in favor of a nested
`sectionHeader` field. Typegen can be non-deterministic — re-run until the
diff is minimal (`pnpm --filter cms typegen` again) before moving on.

### Step 6: verify

- [ ] Dispatch (or run directly) — `cms` type-check + lint:

```bash
pnpm --filter cms type-check
pnpm --filter cms lint
```

Expected: both clean.

### Step 7: commit

```bash
git add apps/cms/src/schema-types packages/config/src/sanity/generated
git commit -m "feat(cms): replace appearance with layout + sectionHeader field groups"
```

---

## Task 3: `cms` — content migration for the SectionHeader restructuring

**Depends on:** Task 2 (schema + typegen must be in place first — the
migration's `defineMigration` visits the **old** field names on existing
documents and writes the **new** shape, so both shapes must be known: the
old one from the live dataset, the new one from the just-updated schema).

**Files:**

- Create: `apps/cms/migrations/<timestamp>-restructure-module-headings/index.ts`,
  `apps/cms/migrations/<timestamp>-restructure-module-headings/transform.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks' exports — migrations run against raw
  Sanity documents, not TypeScript types.
- Produces: nothing consumed by later tasks — this is a standalone,
  independently-runnable unit.

- [ ] **Step 1: Scaffold + track**

```bash
pnpm --filter cms migrate:new "restructure module headings"
```

Expected: creates
`apps/cms/migrations/<UTC-timestamp>-restructure-module-headings/index.ts`
from the template and records it in `migrations/.current`. Use the printed
folder name for the remaining steps below (referred to as `<slug>/` here).

- [ ] **Step 2: Write the transform**

Create `apps/cms/migrations/<slug>/transform.ts`:

```ts
/**
 * Per-document-type field mapping for the `layout`/`sectionHeader`
 * restructuring (see docs/superpowers/specs/2026-08-11-layout-and-section-header-redesign-design.md
 * §4). `appearance` needs no migration (nothing populated in production
 * yet) — this only moves the pre-existing visible-heading content.
 */
export const CTA_MIGRATION = {
  documentType: 'module_cta',
  headingSourceField: 'heading',
  supportingTextSourceField: 'text',
} as const;

export const NEWSLETTER_MIGRATION = {
  documentType: 'module_newsletter',
  headingSourceField: 'heading',
  supportingTextSourceField: 'description',
} as const;

export const POST_LIST_MIGRATION = {
  documentType: 'module_postList',
  headingSourceField: 'title',
  supportingTextSourceField: undefined,
} as const;

export type TModuleHeadingMigration =
  | typeof CTA_MIGRATION
  | typeof NEWSLETTER_MIGRATION
  | typeof POST_LIST_MIGRATION;

export const MODULE_HEADING_MIGRATIONS: TModuleHeadingMigration[] = [
  CTA_MIGRATION,
  NEWSLETTER_MIGRATION,
  POST_LIST_MIGRATION,
];
```

- [ ] **Step 3: Write the migration entrypoint**

Create `apps/cms/migrations/<slug>/index.ts`:

```ts
/**
 * Restructures each of `module_cta`/`module_newsletter`/`module_postList`'s
 * old top-level visible-heading fields into the new `sectionHeader` object
 * (see the Layout & SectionHeader redesign spec, §4):
 *
 * - `module_cta`: `heading` -> `sectionHeader.heading`, `text` ->
 *   `sectionHeader.supportingText`.
 * - `module_newsletter`: `heading` -> `sectionHeader.heading`,
 *   `description` -> `sectionHeader.supportingText`.
 * - `module_postList`: `title` -> `sectionHeader.heading` (its own `title`
 *   field is left untouched — it keeps its existing value and simply stops
 *   being read for display going forward).
 *
 * `module_content`/`module_hero` are not visited — `module_content` never
 * gets a `sectionHeader` field (see spec), and `module_hero` already has its
 * own separate mode/custom title mechanism, unaffected by this migration.
 *
 * `appearance` -> `layout` needs no migration: confirmed nothing is
 * populated on any live document yet, so there is no data to carry forward.
 *
 * Idempotency: only acts on documents that still have a truthy value in
 * their old source field(s) — a document already migrated (from a prior
 * partial run) has nothing left to move and is skipped, so a re-run is safe.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 */
import { defineMigration, set, unset } from 'sanity/migrate';

import { MODULE_HEADING_MIGRATIONS } from './transform';

export default defineMigration({
  title:
    'Restructure module_cta/module_newsletter/module_postList headings into sectionHeader',
  documentTypes: MODULE_HEADING_MIGRATIONS.map((m) => m.documentType),
  migrate: {
    document(doc) {
      const config = MODULE_HEADING_MIGRATIONS.find(
        (m) => m.documentType === doc._type,
      );
      if (!config) return undefined;

      const heading = doc[config.headingSourceField];
      const supportingText = config.supportingTextSourceField
        ? doc[config.supportingTextSourceField]
        : undefined;

      // Already migrated (or never had a heading) — nothing to move.
      if (heading === undefined && supportingText === undefined) {
        return undefined;
      }

      const patches = [
        set(
          {
            _type: 'sectionHeader',
            ...(heading !== undefined ? { heading } : {}),
            ...(supportingText !== undefined ? { supportingText } : {}),
          },
          ['sectionHeader'],
        ),
        unset([config.headingSourceField]),
      ];

      if (config.supportingTextSourceField) {
        patches.push(unset([config.supportingTextSourceField]));
      }

      return patches;
    },
  },
});
```

- [ ] **Step 4: Dry-run**

```bash
pnpm --filter cms migrate:dry
```

Expected: prints a diff for every existing `module_cta`/`module_newsletter`/
`module_postList` document in whichever dataset `SANITY_STUDIO_DATASET`
points at locally (typically `development`) — each showing its old
`heading`/`text`/`description`/`title`-as-heading value moved into a new
`sectionHeader` object, and the old field(s) unset. No dataset mutation
happens from a dry-run. If the local dataset has no documents of these
types yet, the dry-run prints no changes — that's expected, not a failure;
the real target is `production`, run later by a human per the README.

- [ ] **Step 5: Do not run for real in this task**

`migrate:run` against any shared dataset is human-gated (`CLAUDE.md`). This
task's deliverable is the migration code + a clean dry-run, not an executed
run. Leave the actual `migrate:run` (after a `dataset:export` backup) for
the human operator once this branch has merged, sequenced before deploying
`service`/`web` code that reads the new `sectionHeader` shape (same
deploy-ordering constraint documented in the `rename-body-image-type`
migration this one is modeled on).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/migrations/<slug>
git commit -m "feat(cms): add migration restructuring module headings into sectionHeader"
```

---

## Task 4: `service` — query/transformer/types for every module

**Depends on:** Task 2 (schema field names `layout`/`sectionHeader` must
exist in the generated types).

**Files:**

- Rename: `packages/service/src/shared/fragments/appearance.ts` →
  `packages/service/src/shared/fragments/layout.ts`,
  `packages/service/src/shared/transformers/to-appearance.ts` →
  `packages/service/src/shared/transformers/to-layout.ts`,
  `packages/service/src/shared/transformers/to-appearance.test.ts` →
  `packages/service/src/shared/transformers/to-layout.test.ts`
- Modify: `packages/service/src/features/modules/{content,cta,post-list,newsletter,hero}/adaptor/{query,transformer,types}.ts`,
  `packages/service/src/features/modules/hero/adaptor/query.ts` (uses
  `heroLayout` fragment shape, not `layout`),
  `packages/service/src/testing/modules/fixtures.ts`
- Modify tests: `packages/service/src/features/modules/{content,cta,post-list,newsletter}/adaptor/transformer.test.ts`

**Interfaces:**

- Consumes: `TLayout`, `THeadingAlign`, `TSectionHeader` (Task 1); Sanity
  generated types for `layout`/`heroLayout`/`sectionHeader`/
  `requiredHeadingSectionHeader` (Task 2).
- Produces: `layoutFragment`, `toLayout(raw): TLayout | undefined` (renamed,
  same shape as the old `appearanceFragment`/`toAppearance` minus `align`,
  plus `dividerTop`/`dividerBottom` instead of `divider`) — reused
  identically by every module including Hero (Hero's raw `layout` field is
  the `heroLayout` Sanity type, but its generated TS shape is structurally
  compatible with `layoutFragment`'s nullable fields since it's a subset,
  so the same fragment/transformer works for both). `TCtaModule.sectionHeader`,
  `TNewsletterModule.sectionHeader`: `{ heading: string; supportingText:
TMaybeUndefined<string>; align: TMaybeUndefined<THeadingAlign> }`.
  `TPostListModule.sectionHeader`: `TSectionHeader` (all three fields
  optional). `TContentModule` loses `title` entirely.

### Step 1: rename + update the shared `layout` fragment/transformer

- [ ] Rename the files:

```bash
git mv packages/service/src/shared/fragments/appearance.ts packages/service/src/shared/fragments/layout.ts
git mv packages/service/src/shared/transformers/to-appearance.ts packages/service/src/shared/transformers/to-layout.ts
git mv packages/service/src/shared/transformers/to-appearance.test.ts packages/service/src/shared/transformers/to-layout.test.ts
```

- [ ] Replace `packages/service/src/shared/fragments/layout.ts`:

```ts
import { q } from '@blog/service/sanity/query';

export const layoutFragment = q.fragmentForType<'layout'>().project((sub) => ({
  spacingTop: sub.field('spacingTop').nullable(true),
  spacingBottom: sub.field('spacingBottom').nullable(true),
  containerWidth: sub.field('containerWidth').nullable(true),
  dividerTop: sub.field('dividerTop').nullable(true),
  dividerBottom: sub.field('dividerBottom').nullable(true),
}));
```

- [ ] Create a second, Hero-specific fragment in the same file (Hero's raw
      field is typed as `heroLayout`, which groqd's `fragmentForType` needs
      bound separately since it's a distinct Sanity type name, even though
      the resulting TS shape below is compatible with `TLayout`):

Append to `packages/service/src/shared/fragments/layout.ts`:

```ts
export const heroLayoutFragment = q
  .fragmentForType<'heroLayout'>()
  .project((sub) => ({
    spacingTop: sub.field('spacingTop').nullable(true),
    spacingBottom: sub.field('spacingBottom').nullable(true),
    dividerTop: sub.field('dividerTop').nullable(true),
    dividerBottom: sub.field('dividerBottom').nullable(true),
  }));
```

- [ ] Replace `packages/service/src/shared/transformers/to-layout.ts`:

```ts
import type { TLayout } from '@blog/config';
import type {
  heroLayoutFragment,
  layoutFragment,
} from '@blog/service/shared/fragments/layout';
import type { InferFragmentType } from 'groqd';

export type TRawLayout = InferFragmentType<typeof layoutFragment>;
export type TRawHeroLayout = InferFragmentType<typeof heroLayoutFragment>;

export function toLayout(
  raw: TRawLayout | TRawHeroLayout | null | undefined,
): TLayout | undefined {
  if (!raw) return undefined;

  return {
    spacingTop: raw.spacingTop ?? undefined,
    spacingBottom: raw.spacingBottom ?? undefined,
    containerWidth:
      'containerWidth' in raw ? (raw.containerWidth ?? undefined) : undefined,
    dividerTop: raw.dividerTop ?? undefined,
    dividerBottom: raw.dividerBottom ?? undefined,
  };
}
```

- [ ] Replace `packages/service/src/shared/transformers/to-layout.test.ts`:

```ts
import { CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';

import { toLayout, type TRawLayout } from './to-layout';

const rawLayout: TRawLayout = {
  spacingTop: SPACING_SCALE.SM,
  spacingBottom: SPACING_SCALE.LG,
  containerWidth: CONTAINER_WIDTH.NARROW,
  dividerTop: true,
  dividerBottom: false,
};

describe('toLayout', () => {
  it('returns undefined when the raw field is null', () => {
    expect(toLayout(null)).toBeUndefined();
  });

  it('returns undefined when the raw field is undefined', () => {
    expect(toLayout(undefined)).toBeUndefined();
  });

  it('maps a fully-authored layout object 1:1', () => {
    expect(toLayout(rawLayout)).toEqual(rawLayout);
  });

  it('leaves individually-unset sub-fields undefined (no faked default)', () => {
    expect(
      toLayout({
        spacingTop: null,
        spacingBottom: null,
        containerWidth: null,
        dividerTop: null,
        dividerBottom: null,
      }),
    ).toEqual({
      spacingTop: undefined,
      spacingBottom: undefined,
      containerWidth: undefined,
      dividerTop: undefined,
      dividerBottom: undefined,
    });
  });

  it('maps a heroLayout raw object (no containerWidth) with containerWidth left undefined', () => {
    expect(
      toLayout({
        spacingTop: SPACING_SCALE.MD,
        spacingBottom: null,
        dividerTop: true,
        dividerBottom: null,
      }),
    ).toEqual({
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: undefined,
      containerWidth: undefined,
      dividerTop: true,
      dividerBottom: undefined,
    });
  });
});
```

- [ ] Run: `pnpm --filter @blog/service test -- to-layout` — expect PASS
      (6/6).

### Step 2: `cta` module

- [ ] Replace `packages/service/src/features/modules/cta/adaptor/query.ts`:

```ts
import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { linkFragment } from '@blog/service/shared/fragments/link';

export const ctaModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_cta')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project((subHeader) => ({
        heading: subHeader.field('heading').notNull(),
        supportingText: subHeader.field('supportingText').nullable(true),
        align: subHeader.field('align').nullable(true),
      }))
      .notNull(),
    action: sub.field('action').project(linkFragment).notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
```

- [ ] Replace `packages/service/src/features/modules/cta/adaptor/types.ts`:

```ts
import type {
  ILink,
  TBrandVariantOf,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TCtaModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
    align: TMaybeUndefined<THeadingAlign>;
  };
  action: TMaybeUndefined<ILink>;
  layout: TMaybeUndefined<TLayout>;
};
```

- [ ] Replace `packages/service/src/features/modules/cta/adaptor/transformer.ts`:

```ts
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toLink } from '@blog/service/shared/transformers/to-link';
import type { InferResultType } from 'groqd';

import type { ctaModuleQuery } from './query';
import type { TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: {
      heading: raw.sectionHeader.heading,
      supportingText: raw.sectionHeader.supportingText ?? undefined,
      align: raw.sectionHeader.align ?? undefined,
    },
    action: toLink(raw.action),
    layout: toLayout(raw.layout),
  };
}
```

- [ ] Update `packages/service/src/features/modules/cta/adaptor/transformer.test.ts`:

```ts
import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  HEADING_ALIGN,
  SPACING_SCALE,
} from '@blog/config';
import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';

import { toCtaModule } from './transformer';

describe('toCtaModule', () => {
  it('maps sectionHeader and the resolved action link', () => {
    const raw = makeRawCtaModule();

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader).toEqual({
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
      align: undefined,
    });
    expect(cta.action).toEqual({
      label: 'Subscribe',
      href: '/newsletter',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawCtaModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const cta = toCtaModule(raw);

    expect(cta.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves supportingText and align undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: null,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader.supportingText).toBeUndefined();
    expect(cta.sectionHeader.align).toBeUndefined();
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawCtaModule({
      layout: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        containerWidth: CONTAINER_WIDTH.NARROW,
        dividerTop: true,
        dividerBottom: false,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: CONTAINER_WIDTH.NARROW,
      dividerTop: true,
      dividerBottom: false,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawCtaModule({ layout: null });

    const cta = toCtaModule(raw);

    expect(cta.layout).toBeUndefined();
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: HEADING_ALIGN.CENTER,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader.align).toBe(HEADING_ALIGN.CENTER);
  });
});
```

- [ ] Run: `pnpm --filter @blog/service test -- cta` — expect all PASS
      (query/transformer/loader/service tests for `cta`).

### Step 3: `content` module (drops `title` entirely, keeps `layout`)

- [ ] Replace `packages/service/src/features/modules/content/adaptor/query.ts`:

```ts
import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';

export const contentModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_content')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    body: sub.field('body[]').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
```

- [ ] Replace `packages/service/src/features/modules/content/adaptor/types.ts`:

```ts
import type {
  RichText,
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TContentModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  body: RichText;
  layout: TMaybeUndefined<TLayout>;
};
```

- [ ] Replace `packages/service/src/features/modules/content/adaptor/transformer.ts`:

```ts
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import type { InferResultType } from 'groqd';

import type { contentModuleQuery } from './query';
import type { TContentModule } from './types';

export type TRawContentModule = InferResultType<typeof contentModuleQuery>;

export function toContentModule(raw: TRawContentModule): TContentModule {
  return {
    brandVariant: raw.brandVariant,
    body: raw.body,
    layout: toLayout(raw.layout),
  };
}
```

- [ ] Update `packages/service/src/features/modules/content/adaptor/transformer.test.ts`
      — replace every `title`-related assertion/fixture reference with
      `body`/`brandVariant`/`layout` only, and rename `appearance` →
      `layout` in the remaining fixture blocks (same shape as the `cta` test
      update above — drop the `title` assertion from the first test, drop
      the `ALIGN`/`align` import and assertions, rename `appearance` to
      `layout`, `divider` to `dividerTop`/`dividerBottom`):

```ts
import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { toContentModule } from './transformer';

describe('toContentModule', () => {
  it('maps body straight through (schema-required)', () => {
    const raw = makeRawContentModule();

    const module = toContentModule(raw);

    expect(module.body).toHaveLength(1);
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawContentModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toContentModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawContentModule({
      layout: {
        spacingTop: SPACING_SCALE.XL,
        spacingBottom: SPACING_SCALE.NONE,
        containerWidth: CONTAINER_WIDTH.FULL,
        dividerTop: false,
        dividerBottom: true,
      },
    });

    const module = toContentModule(raw);

    expect(module.layout).toEqual({
      spacingTop: SPACING_SCALE.XL,
      spacingBottom: SPACING_SCALE.NONE,
      containerWidth: CONTAINER_WIDTH.FULL,
      dividerTop: false,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawContentModule({ layout: null });

    const module = toContentModule(raw);

    expect(module.layout).toBeUndefined();
  });

  it('preserves the optional layout field on a bodyImage body block', () => {
    const raw = makeRawContentModule({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: undefined,
          media: undefined,
          hotspot: undefined,
          crop: undefined,
          alt: 'A diagram',
          layout: 'INLINE',
        },
      ],
    });

    const module = toContentModule(raw);

    expect(module.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'INLINE',
    });
  });
});
```

- [ ] Run: `pnpm --filter @blog/service test -- content` — expect all PASS.

### Step 4: `post-list` module (`sectionHeader` fully optional, `posts.query.ts` untouched)

- [ ] Replace `packages/service/src/features/modules/post-list/adaptor/query.ts`:

```ts
import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';

export const postListModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_postList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project((subHeader) => ({
        heading: subHeader.field('heading').nullable(true),
        supportingText: subHeader.field('supportingText').nullable(true),
        align: subHeader.field('align').nullable(true),
      }))
      .nullable(true),
    limit: sub.field('limit').notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
```

- [ ] Replace `packages/service/src/features/modules/post-list/adaptor/types.ts`:

```ts
import type {
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
  TSectionHeader,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: TSectionHeader;
  posts: TPostCard[];
  layout: TMaybeUndefined<TLayout>;
};
```

- [ ] Replace `packages/service/src/features/modules/post-list/adaptor/transformer.ts`:

```ts
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { postListModulePostsQuery } from './posts.query';
import type { postListModuleQuery } from './query';
import type { TPostListModule } from './types';

export type TRawPostListModule = InferResultType<typeof postListModuleQuery>;
export type TRawPostListModulePosts = InferResultType<
  ReturnType<typeof postListModulePostsQuery>
>;

export function toPostListModule(
  raw: TRawPostListModule,
  rawPosts: TRawPostListModulePosts,
): TPostListModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: {
      heading: raw.sectionHeader?.heading ?? undefined,
      supportingText: raw.sectionHeader?.supportingText ?? undefined,
      align: raw.sectionHeader?.align ?? undefined,
    },
    posts: rawPosts.map(toPostCard),
    layout: toLayout(raw.layout),
  };
}
```

- [ ] Update the fixture in `packages/service/src/testing/modules/fixtures.ts`
      (Step 7 below covers the fixture file itself — `makeRawPostListModule`
      already shown there).

- [ ] Replace `packages/service/src/features/modules/post-list/adaptor/transformer.test.ts`:

```ts
import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';

import { toPostListModule } from './transformer';

const rawPosts = [];

describe('toPostListModule', () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts);

    expect(module.sectionHeader).toEqual({
      heading: 'Latest',
      supportingText: undefined,
      align: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawPostListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toPostListModule(raw, rawPosts);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves every sectionHeader field undefined when the field itself is unset (no faked default)', () => {
    const raw = makeRawPostListModule({ sectionHeader: null });

    const module = toPostListModule(raw, rawPosts);

    expect(module.sectionHeader).toEqual({
      heading: undefined,
      supportingText: undefined,
      align: undefined,
    });
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawPostListModule({
      sectionHeader: {
        heading: 'Latest',
        supportingText: null,
        align: HEADING_ALIGN.RIGHT,
      },
    });

    const module = toPostListModule(raw, rawPosts);

    expect(module.sectionHeader.align).toBe(HEADING_ALIGN.RIGHT);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawPostListModule({
      layout: {
        spacingTop: 'MD',
        spacingBottom: 'MD',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: true,
      },
    });

    const module = toPostListModule(raw, rawPosts);

    expect(module.layout).toEqual({
      spacingTop: 'MD',
      spacingBottom: 'MD',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawPostListModule({ layout: null });

    const module = toPostListModule(raw, rawPosts);

    expect(module.layout).toBeUndefined();
  });

  it('maps posts through toPostCard', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts);

    expect(module.posts).toEqual([]);
  });
});
```

- [ ] Run: `pnpm --filter @blog/service test -- post-list` — expect all
      PASS.

### Step 5: `newsletter` module

- [ ] Replace `packages/service/src/features/modules/newsletter/adaptor/query.ts`:

```ts
import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';

export const newsletterModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_newsletter')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project((subHeader) => ({
        heading: subHeader.field('heading').notNull(),
        supportingText: subHeader.field('supportingText').nullable(true),
        align: subHeader.field('align').nullable(true),
      }))
      .notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
```

- [ ] Replace `packages/service/src/features/modules/newsletter/adaptor/types.ts`:

```ts
import type {
  TBrandVariantOf,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
    align: TMaybeUndefined<THeadingAlign>;
  };
  layout: TMaybeUndefined<TLayout>;
};
```

- [ ] Replace `packages/service/src/features/modules/newsletter/adaptor/transformer.ts`:

```ts
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import type { InferResultType } from 'groqd';

import type { newsletterModuleQuery } from './query';
import type { TNewsletterModule } from './types';

export type TRawNewsletterModule = InferResultType<
  typeof newsletterModuleQuery
>;

export function toNewsletterModule(
  raw: TRawNewsletterModule,
): TNewsletterModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: {
      heading: raw.sectionHeader.heading,
      supportingText: raw.sectionHeader.supportingText ?? undefined,
      align: raw.sectionHeader.align ?? undefined,
    },
    layout: toLayout(raw.layout),
  };
}
```

- [ ] Replace `packages/service/src/features/modules/newsletter/adaptor/transformer.test.ts`:

```ts
import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';

import { toNewsletterModule } from './transformer';

describe('toNewsletterModule', () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawNewsletterModule();

    const module = toNewsletterModule(raw);

    expect(module.sectionHeader).toEqual({
      heading: 'Stay in the loop',
      supportingText: 'Get new posts in your inbox.',
      align: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawNewsletterModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toNewsletterModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves supportingText and align undefined when not set (no faked default)', () => {
    const raw = makeRawNewsletterModule({
      sectionHeader: {
        heading: 'Stay in the loop',
        supportingText: null,
        align: null,
      },
    });

    const module = toNewsletterModule(raw);

    expect(module.sectionHeader.supportingText).toBeUndefined();
    expect(module.sectionHeader.align).toBeUndefined();
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawNewsletterModule({
      sectionHeader: {
        heading: 'Stay in the loop',
        supportingText: null,
        align: HEADING_ALIGN.CENTER,
      },
    });

    const module = toNewsletterModule(raw);

    expect(module.sectionHeader.align).toBe(HEADING_ALIGN.CENTER);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawNewsletterModule({
      layout: {
        spacingTop: 'SM',
        spacingBottom: 'SM',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: false,
        dividerBottom: true,
      },
    });

    const module = toNewsletterModule(raw);

    expect(module.layout).toEqual({
      spacingTop: 'SM',
      spacingBottom: 'SM',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: false,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawNewsletterModule({ layout: null });

    const module = toNewsletterModule(raw);

    expect(module.layout).toBeUndefined();
  });
});
```

- [ ] Run: `pnpm --filter @blog/service test -- newsletter` — expect all
      PASS.

### Step 6: `hero` module (uses `heroLayoutFragment`, no `sectionHeader`)

- [ ] In `packages/service/src/features/modules/hero/adaptor/query.ts`,
      change only the `layout` line:

```ts
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout';
```

and:

```ts
    layout: sub.field('layout').project(heroLayoutFragment).nullable(true),
```

(replacing the old `appearance: sub.field('appearance').project(appearanceFragment).nullable(true),`
line — everything else in the query is unchanged).

- [ ] In `packages/service/src/features/modules/hero/adaptor/types.ts`,
      rename `appearance: TMaybeUndefined<TAppearance>` to
      `layout: TMaybeUndefined<TLayout>` and update the import.

- [ ] In `packages/service/src/features/modules/hero/adaptor/transformer.ts`,
      change the `appearance: toAppearance(raw.appearance)` line to
      `layout: toLayout(raw.layout)` and update the import.

- [ ] Update `packages/service/src/features/modules/hero/adaptor/transformer.test.ts`
      (if it asserts `appearance`) to assert `layout` instead, dropping any
      `containerWidth`/`align` fixture values (Hero's raw layout never has
      them).

- [ ] Run: `pnpm --filter @blog/service test -- hero` — expect all PASS.

### Step 7: update the shared test fixtures

- [ ] Replace `packages/service/src/testing/modules/fixtures.ts`:

```ts
import { BRAND_VARIANT, HERO_FIELD_MODE, TLINK_TYPE } from '@blog/config';
import type { TRawContentModule } from '@blog/service/features/modules/content/adaptor/transformer';
import type { TRawCtaModule } from '@blog/service/features/modules/cta/adaptor/transformer';
import type { TRawHeroModule } from '@blog/service/features/modules/hero/adaptor/transformer';
import type { TRawNewsletterModule } from '@blog/service/features/modules/newsletter/adaptor/transformer';
import type { TRawPostListModule } from '@blog/service/features/modules/post-list/adaptor/transformer';

export function makeRawHeroModule(
  overrides: Partial<TRawHeroModule> = {},
): TRawHeroModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    featuredPost: null,
    heroEyebrowMode: HERO_FIELD_MODE.POST_CATEGORY,
    heroEyebrow: null,
    heroTitleMode: HERO_FIELD_MODE.POST_TITLE,
    heroTitle: null,
    heroSubtitleMode: HERO_FIELD_MODE.POST_EXCERPT,
    heroSubtitle: null,
    heroImageMode: HERO_FIELD_MODE.POST_IMAGE,
    heroImageAsset: null,
    primaryActionLabel: null,
    secondaryAction: null,
    layout: null,
    ...overrides,
  };
}

export function makeRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: { heading: 'Latest', supportingText: null, align: null },
    limit: 6,
    layout: null,
    ...overrides,
  };
}

export function makeRawContentModule(
  overrides: Partial<TRawContentModule> = {},
): TRawContentModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    body: [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span-1', text: 'Hello.' }],
      },
    ],
    layout: null,
    ...overrides,
  };
}

export function makeRawCtaModule(
  overrides: Partial<TRawCtaModule> = {},
): TRawCtaModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
      align: null,
    },
    action: {
      label: 'Subscribe',
      linkType: TLINK_TYPE.EXTERNAL,
      url: '/newsletter',
      internalReference: null,
      openInNewTab: null,
      platform: null,
      accessibleLabel: null,
    },
    layout: null,
    ...overrides,
  };
}

export function makeRawNewsletterModule(
  overrides: Partial<TRawNewsletterModule> = {},
): TRawNewsletterModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Stay in the loop',
      supportingText: 'Get new posts in your inbox.',
      align: null,
    },
    layout: null,
    ...overrides,
  };
}
```

### Step 8: full verify

```bash
pnpm --filter @blog/service type-check
pnpm --filter @blog/service lint
pnpm --filter @blog/service test
```

Expected: all clean, all tests passing.

### Step 9: commit

```bash
git add packages/service
git commit -m "feat(service): wire layout + sectionHeader through every module"
```

---

## Task 5: `ui` — component changes

**Depends on:** Task 1 (`THeadingAlign`/`HEADING_ALIGN`).

**Files:**

- Modify: `packages/ui/src/organisms/hero/hero-variants.ts`,
  `packages/ui/src/organisms/content-module/content-module.tsx`,
  `packages/ui/src/organisms/content-module/content-module-variants.ts`,
  `packages/ui/src/organisms/content-module/content-module.test.tsx`,
  `packages/ui/src/organisms/content-module/content-module.stories.tsx`,
  `packages/ui/src/organisms/cta-module/cta-module.tsx`,
  `packages/ui/src/organisms/cta-module/cta-module-variants.ts`,
  `packages/ui/src/organisms/cta-module/cta-module.test.tsx`,
  `packages/ui/src/organisms/posts-section/posts-section.tsx`,
  `packages/ui/src/organisms/posts-section/posts-section-variants.ts`,
  `packages/ui/src/organisms/posts-section/posts-section.test.tsx`,
  `packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.tsx`,
  `packages/ui/src/organisms/newsletter-signup/newsletter-signup-variants.ts`

**Interfaces:**

- Consumes: `THeadingAlign` (Task 1). No dependency on `service`/Task 4 —
  `ui` stays prop-driven.
- Produces: `ICtaModuleProps.heading?: string` (now optional, was required),
  `.align?: THeadingAlign`; `IPostsSectionProps.supportingText?: string`,
  `.align?: THeadingAlign`; `INewsletterSignupFullProps.align?:
THeadingAlign`; `IContentModuleProps` loses `title`/`titleId` entirely.

### Step 1: Hero's hardcoded border

- [ ] In `packages/ui/src/organisms/hero/hero-variants.ts`, change:

```ts
root: ['w-full', 'bg-brand-primary-muted border-b border-border-strong'],
```

to:

```ts
root: ['w-full', 'bg-brand-primary-muted'],
```

- [ ] Run: `pnpm --filter @blog/ui test -- hero` — expect PASS (no test
      should have been asserting the border class per this repo's
      no-presentation-class-assertions rule; if one does, that test itself
      is the bug — remove the assertion, don't add a compensating one).

### Step 2: `ContentModule` — drop heading entirely

- [ ] Replace `packages/ui/src/organisms/content-module/content-module.tsx`:

```ts
import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import {
  contentModuleVariants,
  type TContentModuleVariants,
} from './content-module-variants';

export interface IContentModuleProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  children: ReactNode;
  /**
   * Drops this component's own top margin. Set when a parent (e.g. `Section`)
   * already owns the vertical spacing around it, so the two don't stack.
   */
  wrapped?: TContentModuleVariants['wrapped'];
}

/**
 * ContentModule — page-builder organism rendering a portable-text content
 * block. Renders no heading of its own — `body` is free-form rich text that
 * can carry its own headings, so a separate structured heading field would
 * just be a second way to do the same thing.
 */
export const ContentModule = ({
  children,
  className,
  dataTestId,
  wrapped,
  ...rest
}: IContentModuleProps) => {
  const s = contentModuleVariants({ wrapped });

  return (
    <div
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <div className={s.body()}>{children}</div>
    </div>
  );
};
```

- [ ] In `packages/ui/src/organisms/content-module/content-module-variants.ts`,
      remove the now-unused `heading` slot:

```ts
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const contentModuleVariants = tv({
  slots: {
    root: ['mt-[22px]'],
    body: ['max-w-prose'],
  },
  variants: {
    wrapped: {
      true: {
        root: ['mt-0'],
      },
    },
  },
});

export type TContentModuleVariants = VariantProps<typeof contentModuleVariants>;
```

- [ ] Update `content-module.test.tsx` — remove any test exercising
      `title`/`titleId`; keep the `wrapped`/`children`/`dataTestId` tests.
      Update `content-module.stories.tsx` — remove `title`/`titleId` args
      from every story.

- [ ] Run: `pnpm --filter @blog/ui test -- content-module` — expect PASS.

### Step 3: `CtaModule` — optional heading + `align`

- [ ] Replace `packages/ui/src/organisms/cta-module/cta-module.tsx`:

```ts
import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import {
  ctaModuleVariants,
  type TCtaModuleVariants,
} from './cta-module-variants';

export interface ICtaModuleProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  heading?: string;
  headingId?: string;
  text?: string;
  action?: ReactNode;
  align?: TCtaModuleVariants['align'];
  /**
   * Drops this component's own top margin and vertical padding. Set when a
   * parent (e.g. `Section`) already owns the vertical spacing around it, so
   * the two don't stack.
   */
  wrapped?: TCtaModuleVariants['wrapped'];
}

/**
 * CtaModule — page-builder organism rendering an optional heading, optional
 * supporting text, and an optional action slot. `action` is a fully rendered
 * link/button passed in by the web layer — this component never builds the
 * anchor itself. The heading/action wrappers are omitted entirely when
 * absent.
 */
export const CtaModule = ({
  heading,
  headingId,
  text,
  action,
  align,
  className,
  dataTestId,
  wrapped,
  ...rest
}: ICtaModuleProps) => {
  const s = ctaModuleVariants({ wrapped, align });

  return (
    <div
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {heading && (
        <h2 id={headingId} className={s.heading()}>
          {heading}
        </h2>
      )}
      {text && <p className={s.text()}>{text}</p>}
      {action && <div className={s.action()}>{action}</div>}
    </div>
  );
};
```

- [ ] Replace `packages/ui/src/organisms/cta-module/cta-module-variants.ts`:

```ts
import { HEADING_ALIGN } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const ctaModuleVariants = tv({
  slots: {
    root: [
      'flex flex-col items-start gap-3',
      'mt-[22px] px-gutter py-section',
      'bg-subtle',
    ],
    heading: ['m-0'],
    text: ['m-0', 'max-w-prose', 'text-subtle'],
    action: ['mt-2'],
  },
  variants: {
    wrapped: {
      true: {
        root: ['mt-0 py-0'],
      },
    },
    align: {
      [HEADING_ALIGN.LEFT]: { root: ['items-start text-left'] },
      [HEADING_ALIGN.CENTER]: { root: ['items-center text-center'] },
      [HEADING_ALIGN.RIGHT]: { root: ['items-end text-right'] },
    },
  },
  defaultVariants: { align: HEADING_ALIGN.LEFT },
});

export type TCtaModuleVariants = VariantProps<typeof ctaModuleVariants>;
```

- [ ] Update `cta-module.test.tsx` — add a test asserting the heading is
      absent (not rendered) when `heading` is omitted, mirroring
      `ContentModule`'s existing optional-title test pattern before this
      change; keep existing action/text tests; do **not** assert alignment
      via `toHaveClass`.

- [ ] Run: `pnpm --filter @blog/ui test -- cta-module` — expect PASS.

### Step 4: `PostsSection` — `supportingText` + `align`

- [ ] Replace `packages/ui/src/organisms/posts-section/posts-section.tsx`:

```ts
import { ICONS, Size, type IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/atoms/icon';
import { PostCard } from '@blog/ui/molecules/post-card';
import type { ElementType } from 'react';

import {
  postsSectionVariants,
  type TPostsSectionVariants,
} from './posts-section-variants';

export interface IPostCardCategoryData {
  title: string;
}

export interface IPostCardData {
  id: string;
  href: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  formattedDate: string;
  readingTime?: string;
  category: IPostCardCategoryData;
}

export interface IPostsSectionProps extends IWithDataTestId {
  posts: IPostCardData[];
  title: string;
  titleId: string;
  className?: string;
  /** Component each card's title link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  linkAs?: TAnchorElementType;
  /** Optional supporting copy rendered under the heading. */
  supportingText?: string;
  /** Horizontal alignment of the heading and supporting text. Defaults to left. */
  align?: TPostsSectionVariants['align'];
  /** Message rendered under the heading when `posts` is empty. Omit to keep the section rendering nothing (existing behavior). */
  emptyMessage?: string;
  /**
   * Render as a distinct section separated from the content above it by a
   * top rule, with the heading and grid constrained to the shared content
   * column. Omit (or pass `false`) for the existing inline behavior, sized
   * by the parent. Heading markup/`aria` wiring is unchanged either way.
   */
  tinted?: TPostsSectionVariants['tinted'];
  /**
   * Drops this component's own top margin. Set when a parent (e.g. `Section`)
   * already owns the vertical spacing around it, so the two don't stack.
   */
  wrapped?: TPostsSectionVariants['wrapped'];
}

/**
 * PostsSection — labeled section rendering a set of posts in a responsive
 * grid, generic enough to reuse for other post listings (e.g. related posts,
 * category pages).
 */
export const PostsSection = ({
  posts,
  title,
  titleId,
  className,
  dataTestId,
  linkAs,
  supportingText,
  align,
  emptyMessage,
  tinted,
  wrapped,
}: IPostsSectionProps) => {
  const isEmpty = posts.length === 0;
  if (isEmpty && !emptyMessage) return null;
  const Component = (linkAs ?? 'a') as ElementType;
  const s = postsSectionVariants({ tinted, wrapped, align });

  const content = (
    <>
      <h2 id={titleId} className={s.label()}>
        {title}
      </h2>
      {supportingText && (
        <p className={s.supportingText()}>{supportingText}</p>
      )}
      {isEmpty ? (
        <p className={s.emptyMessage()}>{emptyMessage}</p>
      ) : (
        <div className={s.grid()}>
          {posts.map((post) => (
            <PostCard key={post.id} excerpt={post.excerpt}>
              <PostCard.Meta
                dateValue={post.publishedAt}
                dateLabel={post.formattedDate}
                readingTime={post.readingTime}
              />
              <PostCard.Title>
                <Component href={post.href} className={s.titleLink()}>
                  {post.title}
                </Component>
              </PostCard.Title>
              <PostCard.Footer
                category={post.category.title}
                trailingIcon={
                  <Icon
                    name={ICONS.ARROW}
                    size={Size.SM}
                    dataTestId="post-card-footer-arrow"
                  />
                }
              />
            </PostCard>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {tinted ? (
        <div className={s.inner()}>
          <div className={s.contentGroup()}>{content}</div>
        </div>
      ) : (
        content
      )}
    </div>
  );
};
```

- [ ] Replace `packages/ui/src/organisms/posts-section/posts-section-variants.ts`:

```ts
import { HEADING_ALIGN } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const postsSectionVariants = tv({
  slots: {
    root: ['mt-[22px]'],
    inner: [],
    contentGroup: [],
    label: [
      'font-mono text-label font-normal uppercase tracking-label text-subtle',
      'm-0 mb-3',
    ],
    supportingText: ['font-body text-prose text-muted', 'm-0 mb-5'],
    grid: [
      'grid',
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      'gap-3.5 md:gap-5 lg:gap-7',
    ],
    titleLink: ['before:absolute before:inset-0'],
    emptyMessage: ['text-copy text-muted'],
  },
  variants: {
    tinted: {
      true: {
        root: ['mt-0 w-full py-10'],
        inner: ['mx-auto max-w-page px-gutter'],
        contentGroup: ['border-t border-border-emphasis pt-10'],
      },
    },
    wrapped: {
      true: {
        root: ['mt-0'],
      },
    },
    align: {
      [HEADING_ALIGN.LEFT]: {
        label: ['text-left'],
        supportingText: ['text-left'],
      },
      [HEADING_ALIGN.CENTER]: {
        label: ['text-center'],
        supportingText: ['text-center'],
      },
      [HEADING_ALIGN.RIGHT]: {
        label: ['text-right'],
        supportingText: ['text-right'],
      },
    },
  },
  defaultVariants: { align: HEADING_ALIGN.LEFT },
});

export type TPostsSectionVariants = VariantProps<typeof postsSectionVariants>;
```

- [ ] Update `posts-section.test.tsx` — add a test asserting `supportingText`
      renders when passed and is absent when omitted; do **not** assert
      alignment via `toHaveClass` — assert the heading's accessible text
      content/role instead, same as existing tests do.

- [ ] Run: `pnpm --filter @blog/ui test -- posts-section` — expect PASS.

### Step 5: `NewsletterSignupFull` — `align`

- [ ] In `packages/ui/src/organisms/newsletter-signup/newsletter-signup-variants.ts`,
      add an `align` variant scoped to `pitchPane`:

```ts
import { HEADING_ALIGN } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const newsletterSignupVariants = tv({
  slots: {
    // ...unchanged slots...
  },
  variants: {
    variant: {
      // ...unchanged...
    },
    align: {
      [HEADING_ALIGN.LEFT]: { pitchPane: ['items-start text-left'] },
      [HEADING_ALIGN.CENTER]: { pitchPane: ['items-center text-center'] },
      [HEADING_ALIGN.RIGHT]: { pitchPane: ['items-end text-right'] },
    },
  },
  defaultVariants: { variant: 'full', align: HEADING_ALIGN.LEFT },
});

export type TNewsletterSignupVariants = VariantProps<
  typeof newsletterSignupVariants
>;
```

(Keep every other slot/variant entry exactly as it is today — only the new
`align` variant and its entry in `defaultVariants` are added.)

`NewsletterSignupCompact` does **not** get `align` — its single-row strip
layout has no meaningful left/center/right distinction (confirmed against
its existing markup: `prefix`+heading share one inline-flex row, not a
block column), so it stays as-is.

- [ ] In `packages/ui/src/organisms/newsletter-signup/components/full/newsletter-signup-full.tsx`,
      add `align?: TNewsletterSignupVariants['align']` to
      `INewsletterSignupFullProps`, thread it through:

```ts
const s = newsletterSignupVariants({ variant: 'full', align });
```

(add `align` to the destructured props and pass it through as shown).

- [ ] Run: `pnpm --filter @blog/ui test -- newsletter-signup` — expect
      PASS (no new test required unless the suite already asserts
      variant-driven behavior structurally; do not add a `toHaveClass`
      assertion for `align`).

### Step 6: full verify

```bash
pnpm --filter @blog/ui type-check
pnpm --filter @blog/ui lint
pnpm --filter @blog/ui test
```

Expected: all clean, all tests passing.

### Step 7: commit

```bash
git add packages/ui
git commit -m "feat(ui): drop Hero's hardcoded border, add SectionHeader support to CtaModule/PostsSection/NewsletterSignup"
```

---

## Task 6: `web` — `Section`, module wiring, responsive padding

**Depends on:** Task 4 (`service` view-models), Task 5 (`ui` component
props).

**Files:**

- Modify: `apps/web/src/components/shared/section/section.tsx`,
  `apps/web/src/components/shared/section/section-variants.ts`,
  `apps/web/src/components/shared/section/section.test.tsx` (if present —
  confirm file exists before editing; if not, this step is a no-op for
  tests beyond what module-level tests already cover),
  `apps/web/src/modules/content/content-module.tsx`,
  `apps/web/src/modules/content/content-module.test.tsx`,
  `apps/web/src/modules/cta/cta-module.tsx`,
  `apps/web/src/modules/cta/cta-module.test.tsx`,
  `apps/web/src/modules/post-list/post-list-module.tsx`,
  `apps/web/src/modules/post-list/post-list-module.test.tsx`,
  `apps/web/src/modules/newsletter/newsletter-module.tsx`,
  `apps/web/src/modules/newsletter/newsletter-module.test.tsx`,
  `apps/web/src/components/shared/newsletter-form/newsletter-form.tsx`,
  `apps/web/src/modules/hero/hero-module.tsx`

**Interfaces:**

- Consumes: `TCtaModule`/`TContentModule`/`TPostListModule`/
  `TNewsletterModule`/`THeroModule` (Task 4), `ICtaModuleProps`/
  `IPostsSectionProps`/`IContentModuleProps`/`INewsletterSignupFullProps`
  (Task 5).
- Produces: nothing consumed by a later task — this is the final layer.

### Step 1: `Section` — rename `layout` prop, split divider, responsive spacing, optional `titleId`

- [ ] Replace `apps/web/src/components/shared/section/section-variants.ts`:

```ts
import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import { tv } from 'tailwind-variants';

export const sectionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    inner: ['mx-auto flex flex-col px-gutter'],
  },
  variants: {
    brandVariant: {
      [BRAND_VARIANT.PRIMARY]: { root: ['bg-primary'] },
      [BRAND_VARIANT.SECONDARY]: { root: ['bg-secondary'] },
      [BRAND_VARIANT.BRAND_PRIMARY]: { root: ['bg-brand-primary-muted'] },
    },
    spacingTop: {
      [SPACING_SCALE.NONE]: { root: ['pt-0'] },
      [SPACING_SCALE.SM]: { root: ['pt-4 sm:pt-6'] },
      [SPACING_SCALE.MD]: { root: ['pt-8 sm:pt-10 lg:pt-12'] },
      [SPACING_SCALE.LG]: { root: ['pt-10 sm:pt-13 lg:pt-16'] },
      [SPACING_SCALE.XL]: { root: ['pt-14 sm:pt-18 lg:pt-24'] },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: { root: ['pb-0'] },
      [SPACING_SCALE.SM]: { root: ['pb-4 sm:pb-6'] },
      [SPACING_SCALE.MD]: { root: ['pb-8 sm:pb-10 lg:pb-12'] },
      [SPACING_SCALE.LG]: { root: ['pb-10 sm:pb-13 lg:pb-16'] },
      [SPACING_SCALE.XL]: { root: ['pb-14 sm:pb-18 lg:pb-24'] },
    },
    containerWidth: {
      [CONTAINER_WIDTH.NARROW]: { inner: ['max-w-prose'] },
      [CONTAINER_WIDTH.WIDE]: { inner: ['max-w-5xl'] },
      [CONTAINER_WIDTH.FULL]: { inner: ['max-w-page'] },
    },
    dividerTop: { true: { root: ['border-t border-border'] } },
    dividerBottom: { true: { root: ['border-b border-border'] } },
  },
  defaultVariants: {
    spacingTop: SPACING_SCALE.NONE,
    spacingBottom: SPACING_SCALE.NONE,
    containerWidth: CONTAINER_WIDTH.WIDE,
    dividerTop: false,
    dividerBottom: false,
  },
});
```

(`px-gutter` on `inner` is untouched — it already comes from the design
system's own responsive gutter token, unrelated to this change; the new
`sm:`/`lg:` breakpoint steps above are chosen to step down at the same
breakpoints `px-gutter` itself uses, per the spec's §3.)

- [ ] Replace `apps/web/src/components/shared/section/section.tsx`:

```ts
import type { IWithDataTestId, TBrandVariant, TLayout } from '@blog/config';
import type { ReactNode } from 'react';

import { sectionVariants } from './section-variants';

export interface ISectionProps extends IWithDataTestId {
  brandVariant: TBrandVariant;
  layout?: TLayout;
  titleId?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Section — the sole per-module landmark. Full-bleed `<section>` background
 * driven by `brandVariant`, vertical spacing as padding (not margin) so
 * stacked Sections tile edge-to-edge, wrapping a constrained inner `<div>`.
 * Module organisms compose into `children` without rendering their own
 * `<section>` landmark or outer spacing. `titleId` is optional — a module
 * with no unique heading (e.g. `ContentModule`) renders the landmark without
 * an `aria-labelledby` rather than pointing at an element that never renders.
 */
export const Section = ({
  brandVariant,
  layout,
  titleId,
  children,
  className,
  dataTestId,
}: ISectionProps) => {
  const s = sectionVariants({
    brandVariant,
    spacingTop: layout?.spacingTop,
    spacingBottom: layout?.spacingBottom,
    containerWidth: layout?.containerWidth,
    dividerTop: layout?.dividerTop,
    dividerBottom: layout?.dividerBottom,
  });

  return (
    <section
      aria-labelledby={titleId}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      <div className={s.inner()}>{children}</div>
    </section>
  );
};
```

- [ ] Run: `pnpm --filter web test -- section` — if `section.test.tsx`
      exists, expect PASS; if it doesn't exist, this step is a no-op (the
      component is exercised through each module's own tests instead).

### Step 2: `ContentModule` (web) — drop `titleId`, use `layout` prop name

- [ ] Replace `apps/web/src/modules/content/content-module.tsx`:

```ts
import { service } from '@blog/service';
import { ContentModule as ContentModuleUi } from '@blog/ui/organisms';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { Section } from '@web/components/shared/section';

export interface IContentModuleProps {
  id: string;
  locale: string;
}

/**
 * ContentModule — fetches `module_content` data and renders it through the
 * `ContentModule` ui organism, with the Portable Text body rendered by the
 * web-owned `PortableTextRenderer`, wrapped in `Section` (web's sole
 * per-module landmark) for the CMS-authored `brandVariant`/`layout`. The
 * only place this module's service and ui meet. No `titleId` is passed to
 * `Section` — `ContentModule` renders no heading of its own (its rich-text
 * `body` supplies any in-content headings), so the landmark has no unique
 * element to label.
 */
export async function ContentModule({ id }: IContentModuleProps) {
  const result = await service.modules.content.v1.getContent(id);

  if (!result.ok) return null;

  const { brandVariant, body, layout } = result.data;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      dataTestId={`content-module-${id}`}
    >
      <ContentModuleUi wrapped>
        <PortableTextRenderer value={body} />
      </ContentModuleUi>
    </Section>
  );
}
```

- [ ] Update `content-module.test.tsx` — remove any assertion on a `title`
      heading; assert the `Section` region renders with no accessible name
      (or don't assert `aria-labelledby` at all — the absence is the
      correct, unremarkable state) and that the Portable Text body renders.

- [ ] Run: `pnpm --filter web test -- content-module` — expect PASS.

### Step 3: `CtaModule` (web)

- [ ] Replace `apps/web/src/modules/cta/cta-module.tsx`:

```ts
import { service } from '@blog/service';
import { CtaModule as CtaModuleUi } from '@blog/ui/organisms';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

export interface ICtaModuleProps {
  id: string;
  locale: string;
}

/**
 * CtaModule — fetches `module_cta` data and renders it through the `CtaModule`
 * ui organism, with the action link built from a `SmartLink`, wrapped in
 * `Section` (web's sole per-module landmark) for the CMS-authored
 * `brandVariant`/`layout`. The only place this module's service and ui meet.
 */
export async function CtaModule({ id }: ICtaModuleProps) {
  const result = await service.modules.cta.v1.getCta(id);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, action, layout } = result.data;
  const titleId = `cta-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`cta-module-${id}`}
    >
      <CtaModuleUi
        heading={sectionHeader.heading}
        headingId={titleId}
        text={sectionHeader.supportingText}
        align={sectionHeader.align}
        action={
          action ? (
            <SmartLink href={action.href} target={action.target}>
              {action.label}
            </SmartLink>
          ) : null
        }
        wrapped
      />
    </Section>
  );
}
```

- [ ] Update `cta-module.test.tsx` — rename fixture fields from
      `heading`/`text`/`appearance` to `sectionHeader: { heading, ... }`/
      `layout`, keep the rest of the assertions structurally the same
      (accessible landmark name via `titleId`, action rendering).

- [ ] Run: `pnpm --filter web test -- cta-module` — expect PASS.

### Step 4: `PostListModule` (web)

- [ ] Replace `apps/web/src/modules/post-list/post-list-module.tsx`:

```ts
import { service } from '@blog/service';
import { PostsSection } from '@blog/ui/organisms';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import { toPostListItems } from '@web/utils/to-post-list-items';

export interface IPostListModuleProps {
  id: string;
  locale: string;
}

/**
 * PostListModule — fetches `module_postList` data and renders it through the
 * `PostsSection` organism, wrapped in `Section` (web's sole per-module
 * landmark) for the CMS-authored `brandVariant`/`layout`. The only place
 * this module's service and ui meet.
 */
export async function PostListModule({ id }: IPostListModuleProps) {
  const result = await service.modules.postList.v1.getPostList(id);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, posts, layout } = result.data;
  const titleId = `latest-posts-${id}`;

  const items = await toPostListItems(posts);

  // No posts resolved (e.g. the referenced/latest posts are unpublished or
  // filtered to zero) — `PostsSection` renders nothing without an
  // `emptyMessage`, so skip `Section` entirely rather than emit an empty
  // landmark whose `aria-labelledby` points at a heading id that never
  // renders.
  if (items.length === 0) return null;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`post-list-module-${id}`}
    >
      <PostsSection
        posts={items}
        title={sectionHeader.heading ?? 'Latest posts'}
        titleId={titleId}
        supportingText={sectionHeader.supportingText}
        align={sectionHeader.align}
        linkAs={SmartLink}
        wrapped
      />
    </Section>
  );
}
```

`PostsSection.title` stays a required `string` prop (Task 5 left it
untouched — it renders the `<h2 id={titleId}>` landmark label
unconditionally, unlike `CtaModule`'s now-optional heading). Since
`sectionHeader.heading` is optional for `module_postList`, the web layer
supplies `'Latest posts'` as the literal fallback here — the one place in
this plan a hardcoded string fallback is intentional (not a "faked default"
in the service-layer sense the Global Constraints forbid; that rule is about
transformers inventing data, not a UI copy fallback at the presentation
edge), since `PostsSection`'s landmark always needs a real, non-empty
accessible name.

- [ ] Update `post-list-module.test.tsx` — rename `title`/`appearance`
      fixture fields to `sectionHeader`/`layout`; add a case asserting the
      `'Latest posts'` fallback renders when `sectionHeader.heading` is
      `undefined`.

- [ ] Run: `pnpm --filter web test -- post-list-module` — expect PASS.

### Step 5: `NewsletterModule` (web) + `NewsletterForm`

- [ ] In `apps/web/src/components/shared/newsletter-form/newsletter-form.tsx`,
      add `align?: THeadingAlign` to `TNewsletterFormProps`, thread it into
      `sharedProps`, and pass it only to the `full` branch (Compact has no
      `align` prop — Task 5, Step 5):

```ts
import {
  ICONS,
  Size,
  type THeadingAlign,
  type TFormStatus,
} from '@blog/config';
```

Add `align?: THeadingAlign;` to the props type, `align` to the function's
destructured params, and change the `NewsletterSignup.Full` render to:

```ts
  return (
    <NewsletterSignup.Full
      {...sharedProps}
      description={description}
      trustCues={trustCues}
      align={align}
    />
  );
```

(`sharedProps` itself stays unchanged — `align` is only relevant to `Full`,
so it's passed as a direct prop on that branch, not folded into the object
shared with `Compact`.)

- [ ] Replace `apps/web/src/modules/newsletter/newsletter-module.tsx`:

```ts
import { service } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { Section } from '@web/components/shared/section';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

/**
 * NewsletterModule — fetches `module_newsletter` data and renders it through
 * the `NewsletterForm` client island (`full` density) as `Section`'s direct
 * child, wrapped in `Section` (web's sole per-module landmark) for the
 * CMS-authored `brandVariant`/`layout` — the only place this module's
 * service and ui meet. This is the Blog index page's optional page-builder
 * placement (`page_blog.modules`) — editors opt in by adding the module
 * there, no hardcoded mount point (#1200). `sectionHeader.heading` is a
 * CMS-required field for this module (`requireHeading: true`), so it's
 * always a non-empty string here.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, layout } = result.data;
  const titleId = `newsletter-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`newsletter-module-${id}`}
    >
      <NewsletterForm
        variant="full"
        heading={sectionHeader.heading}
        headingId={titleId}
        description={sectionHeader.supportingText}
        align={sectionHeader.align}
      />
    </Section>
  );
}
```

- [ ] Update `newsletter-module.test.tsx` — rename fixture fields from
      `heading`/`description`/`appearance` to `sectionHeader`/`layout`.

- [ ] Run: `pnpm --filter web test -- newsletter-module` — expect PASS.

### Step 6: `HeroModule` (web) — `layout` prop rename only

- [ ] In `apps/web/src/modules/hero/hero-module.tsx`, rename the destructured
      `appearance` to `layout` and the `Section` prop from `appearance=` to
      `layout=`:

```ts
const {
  brandVariant,
  eyebrow,
  title,
  subtitle,
  sanityImage,
  primaryAction,
  secondaryAction,
  layout,
} = result.data;
```

and:

```ts
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`hero-module-${id}`}
    >
```

Nothing else in this file changes.

- [ ] Update `hero-module.test.tsx` — rename `appearance` fixture field to
      `layout`.

- [ ] Run: `pnpm --filter web test -- hero-module` — expect PASS.

### Step 7: full verify

```bash
pnpm type-check
pnpm lint
pnpm test
```

Expected: all clean across every package, all tests passing — this is the
plan's final integration pass.

### Step 8: commit

```bash
git add apps/web
git commit -m "feat(web): wire Section/modules onto layout + sectionHeader, responsive spacing"
```

---

## Post-plan (not part of any task above — human-gated)

- Run `pnpm --filter cms migrate:run` (after a fresh `dataset:export` backup)
  against `production`, sequenced **before** deploying this branch's
  `service`/`web` code — same deploy-ordering constraint as any other
  content migration in this repo.
- Update `SPEC.md` §6 and `docs/context/content-model.md` in the completing
  PR (per this repo's "Spec sync" convention) to describe `layout`/
  `sectionHeader` replacing `appearance`.
- Per this repo's design-doc-retention convention, delete
  `docs/superpowers/specs/2026-08-11-layout-and-section-header-redesign-design.md`
  once `SPEC.md` reflects the final shape, in the same PR that does that
  sync.

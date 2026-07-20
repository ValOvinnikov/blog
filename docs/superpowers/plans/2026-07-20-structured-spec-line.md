# Structured Spec Line Implementation Plan

> **For agentic workers:** Execution in this repo follows its own
> `develop-feature`/`open-pull-request` skills (config/cms/service subagent
> dispatch, `verify-runner`, `reviewer`, gated commit/push/PR) — **not**
> `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
> Steps use checkbox (`- [ ]`) syntax for tracking regardless of which
> execution model runs them.

**Goal:** Replace `brand.specLine`'s free-text string with a structured
`items` (0–4 short strings) + `separator` (constrained select) object,
joined into a display string entirely inside the service transformer so
`packages/ui`/`apps/web` need no changes.

**Architecture:** Three layers, in dependency order: `config` (new
`SPEC_LINE_SEPARATORS`/`SPEC_LINE_SEPARATOR_CHARS` constants) → `cms` (new
`specLineSchema` object type, `brandSchema.specLine` retyped to it) →
`service` (query projects the new shape, transformer joins it back into the
existing `TBrand.specLine: TMaybeUndefined<string>`).

**Tech Stack:** Sanity Studio v6 (schema + typegen), groqd (typed GROQ
queries), Vitest.

## Global Constraints

- Items: 0–4 entries, each entry max 15 chars (design §1/§2).
- Separator: constrained select — Dot (·) / Pipe (|) / Bullet (•) / Slash
  (/), default Dot (design §1/§2).
- `TBrand.specLine` stays `TMaybeUndefined<string>` — no shape change visible
  outside `packages/service` (design §3).
- No migration — existing `brand.specLine` string values are dropped on
  schema deploy (design, Decisions #5).
- `packages/ui` and `apps/web` are out of scope — no files there change.

---

### Task 1: Config — separator constants

**Files:**

- Create: `packages/config/src/constants/spec-line.ts`
- Modify: `packages/config/src/constants/index.ts:1-5` (add barrel export)

**Interfaces:**

- Consumes: `TValueOf` from `@blog/config/utils` (existing, see
  `packages/config/src/constants/brand.ts:1`).
- Produces: `SPEC_LINE_SEPARATORS` (const), `TSpecLineSeparator` (type),
  `SPEC_LINE_SEPARATOR_CHARS` (const) — all importable from `@blog/config`
  (root barrel) and `@blog/config/constants`. Task 2 (cms) and Task 3
  (service) both import these by name.

- [ ] **Step 1: Create the constants file**

```ts
// packages/config/src/constants/spec-line.ts
import type { TValueOf } from '@blog/config/utils';

export const SPEC_LINE_SEPARATORS = {
  DOT: 'DOT',
  PIPE: 'PIPE',
  BULLET: 'BULLET',
  SLASH: 'SLASH',
} as const;

export type TSpecLineSeparator = TValueOf<typeof SPEC_LINE_SEPARATORS>;

export const SPEC_LINE_SEPARATOR_CHARS: Record<TSpecLineSeparator, string> = {
  [SPEC_LINE_SEPARATORS.DOT]: '·',
  [SPEC_LINE_SEPARATORS.PIPE]: '|',
  [SPEC_LINE_SEPARATORS.BULLET]: '•',
  [SPEC_LINE_SEPARATORS.SLASH]: '/',
};
```

- [ ] **Step 2: Add the barrel export**

```ts
// packages/config/src/constants/index.ts
export * from './brand';
export * from './language';
export * from './link';
export * from './module';
export * from './size';
export * from './spec-line';
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @blog/config type-check && pnpm --filter @blog/config lint`
Expected: both pass. (No dedicated test file — this package has no unit
tests for its plain-const files today, e.g. `brand.ts` has none either.)

- [ ] **Step 4: Commit**

```bash
git add packages/config/src/constants/spec-line.ts packages/config/src/constants/index.ts
git commit -m "feat(config): SPEC_LINE_SEPARATORS + SPEC_LINE_SEPARATOR_CHARS"
```

**PR note:** this task is additive-only (new file + new barrel export) and
merges to `main` green on its own — safe as a standalone PR, first in the
chain.

---

### Task 2: CMS — `specLine` object schema

**Files:**

- Create: `apps/cms/src/schema-types/objects/spec-line.ts`
- Modify: `apps/cms/src/schema-types/objects/index.ts:1-19` (register the new
  type)
- Modify: `apps/cms/src/schema-types/objects/brand.ts:42-65` (retype the
  `specLine` field)

**Interfaces:**

- Consumes: `SPEC_LINE_SEPARATORS`, `SPEC_LINE_SEPARATOR_CHARS` from
  `@blog/config/constants` (Task 1); `toTitleCase` from `@blog/utils`
  (existing, see `brand.ts:2`).
- Produces: `specLineSchema` (Sanity object type, `name: 'specLine'`) —
  Task 3 (service) does not import this directly, but its GROQ projection
  and typegen output depend on this shape existing in the deployed schema.

- [ ] **Step 1: Create the `specLine` object type**

```ts
// apps/cms/src/schema-types/objects/spec-line.ts
import {
  SPEC_LINE_SEPARATOR_CHARS,
  SPEC_LINE_SEPARATORS,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField, defineType } from 'sanity';

export const specLineSchema = defineType({
  name: 'specLine',
  title: 'Spec Line',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      description:
        'Up to 4 short segments (e.g. "build 2026.07", "online"), joined with the separator below.',
      of: [{ type: 'string', validation: (rule) => rule.max(15) }],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: 'separator',
      title: 'Separator',
      type: 'string',
      description: 'Character shown between each item.',
      options: {
        layout: 'dropdown',
        list: Object.values(SPEC_LINE_SEPARATORS).map((value) => ({
          title: `${toTitleCase(value)} (${SPEC_LINE_SEPARATOR_CHARS[value]})`,
          value,
        })),
      },
      initialValue: SPEC_LINE_SEPARATORS.DOT,
      validation: (rule) => rule.required(),
    }),
  ],
});
```

- [ ] **Step 2: Register the new object type**

```ts
// apps/cms/src/schema-types/objects/index.ts
import { blockTextSchema } from './block-text';
import { brandSchema } from './brand';
import { imageWithAltSchema } from './image-with-alt';
import { linkSchema } from './link';
import { openGraphSchema } from './open-graph';
import { richTextSchema } from './rich-text';
import { seoSchema } from './seo';
import { socialLinkSchema } from './social-link';
import { specLineSchema } from './spec-line';

export const objects = [
  imageWithAltSchema,
  richTextSchema,
  blockTextSchema,
  socialLinkSchema,
  linkSchema,
  openGraphSchema,
  seoSchema,
  specLineSchema,
  brandSchema,
];
```

(`specLineSchema` must be listed before `brandSchema`, which references it —
matches the existing ordering convention where `imageWithAltSchema` precedes
`brandSchema`.)

- [ ] **Step 3: Retype `brand.specLine`**

In `apps/cms/src/schema-types/objects/brand.ts`, replace the existing
`specLine` field (currently `type: 'string'`, `validation: (rule) =>
rule.max(60)`) with:

```ts
    defineField({
      name: 'specLine',
      title: 'Spec Line',
      type: specLineSchema.name,
      description:
        'Optional monospace line shown below the logo — system-status/build-tag style text, e.g. "build 2026.07 · online".',
    }),
```

Add the import at the top of `brand.ts`:

```ts
import { specLineSchema } from './spec-line';
```

The field itself carries no `validation: (rule) => rule.required()` — the
whole object stays optional, same as today.

- [ ] **Step 4: Regenerate types**

Run: `pnpm typegen`
Expected: `packages/config/src/sanity/generated/schema.json` and `types.ts`
regenerate with `specLine` now shaped as `{ items?: string[] | null,
separator: 'DOT' | 'PIPE' | 'BULLET' | 'SLASH' } | null` on the `brand`
object (exact shape may vary — inspect `types.ts` directly and use that, not
this description, when writing Task 3's query). Typegen can be
non-deterministic; re-run until the diff is minimal.

- [ ] **Step 5: Verify**

Run: `pnpm --filter cms type-check && pnpm --filter cms lint`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/schema-types/objects/spec-line.ts apps/cms/src/schema-types/objects/index.ts apps/cms/src/schema-types/objects/brand.ts packages/config/src/sanity/generated/
git commit -m "feat(cms): structured brand.specLine (items + separator)"
```

**PR note:** do **not** open this as a standalone PR — see Task 3's PR note.
Retyping `specLine` changes the generated `TRawSiteSettings` shape that
`packages/service`'s already-merged `transformer.ts` currently reads as a
plain string; merging this alone reds `pnpm --filter @blog/service
type-check` on `main` until Task 3 lands. Keep this commit and Task 3's
commit(s) on the same branch/PR.

---

### Task 3: Service — project and join `specLine`

**Files:**

- Modify: `packages/service/src/features/global/site-settings/adaptor/query.ts:1-25`
- Modify: `packages/service/src/features/global/site-settings/adaptor/transformer.ts:1-24`
- Test: `packages/service/src/features/global/site-settings/adaptor/loader.test.ts`

**Interfaces:**

- Consumes: `SPEC_LINE_SEPARATOR_CHARS`, `TSpecLineSeparator` from
  `@blog/config` (Task 1); the regenerated `TRawSiteSettings` shape from
  Task 2's typegen run (inspect `packages/config/src/sanity/generated/types.ts`
  for the brand object's exact `specLine` shape before writing the
  projection).
- Produces: `TBrand.specLine` stays `TMaybeUndefined<string>` — no consumer
  outside this file changes.

- [ ] **Step 1: Write the failing tests**

Add to `packages/service/src/features/global/site-settings/adaptor/loader.test.ts`
(alongside the existing `describe('getSiteSettings', ...)` block — import
`SPEC_LINE_SEPARATORS` and `SPEC_LINE_SEPARATOR_CHARS` from `@blog/config`
at the top, next to the existing `BRAND_VARIANTS` import):

```ts
it('joins multiple spec-line items with the mapped separator', async () => {
  mockRun.mockResolvedValue(
    makeRawSiteSettings({
      brand: {
        name: 'Awesome Blog',
        prefix: 'val',
        suffix: '.dev',
        specLine: {
          items: ['build 2026.07', 'online'],
          separator: SPEC_LINE_SEPARATORS.PIPE,
        },
        logo: makeRawImage('Logo'),
        variant: BRAND_VARIANTS.CONSOLE,
      },
    }),
  );

  const result = await getSiteSettings();

  expect(result.brand.specLine).toBe(
    `build 2026.07 ${SPEC_LINE_SEPARATOR_CHARS.PIPE} online`,
  );
});

it('joins a single spec-line item with no separator character', async () => {
  mockRun.mockResolvedValue(
    makeRawSiteSettings({
      brand: {
        name: 'Awesome Blog',
        prefix: 'val',
        suffix: '.dev',
        specLine: { items: ['online'], separator: SPEC_LINE_SEPARATORS.DOT },
        logo: makeRawImage('Logo'),
        variant: BRAND_VARIANTS.CONSOLE,
      },
    }),
  );

  const result = await getSiteSettings();

  expect(result.brand.specLine).toBe('online');
});

it('maps an empty spec-line items list to undefined', async () => {
  mockRun.mockResolvedValue(
    makeRawSiteSettings({
      brand: {
        name: 'Awesome Blog',
        prefix: 'val',
        suffix: '.dev',
        specLine: { items: [], separator: SPEC_LINE_SEPARATORS.DOT },
        logo: makeRawImage('Logo'),
        variant: BRAND_VARIANTS.CONSOLE,
      },
    }),
  );

  const result = await getSiteSettings();

  expect(result.brand.specLine).toBeUndefined();
});
```

(The existing `'maps a missing spec line to undefined'` test already covers
`specLine: null` — the whole-object-absent case — and needs no change
beyond what #514 already did to it.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @blog/service test -- loader.test.ts`
Expected: FAIL — `result.brand.specLine` is still the raw fixture's object
(or a type error at the fixture call site), since `query.ts`/`transformer.ts`
haven't changed yet.

- [ ] **Step 3: Update the query projection**

In `query.ts`, replace the `specLine` line inside the `brand` sub-projection
(`specLine: b.field('specLine').nullable(true),`) with:

```ts
        specLine: b
          .field('specLine')
          .project((sl) => ({
            items: sl.field('items').nullable(true),
            separator: sl.field('separator').notNull(),
          }))
          .nullable(true),
```

- [ ] **Step 4: Update the transformer**

In `transformer.ts`, replace `specLine: raw.brand.specLine ?? undefined,`
with:

```ts
import { SPEC_LINE_SEPARATOR_CHARS } from '@blog/config';
```

(add to the existing imports at the top), then in `toSiteSettings`:

```ts
export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  const specLineItems = raw.brand.specLine?.items ?? [];
  const specLineSeparator = raw.brand.specLine?.separator;
  const specLine =
    specLineItems.length && specLineSeparator
      ? specLineItems.join(` ${SPEC_LINE_SEPARATOR_CHARS[specLineSeparator]} `)
      : undefined;

  return {
    brand: {
      name: raw.brand.name,
      prefix: raw.brand.prefix,
      suffix: raw.brand.suffix ?? undefined,
      specLine,
      logoUrl: buildImageUrl(raw.brand.logo),
      variant: raw.brand.variant,
    },
    description: raw.description,
    tagline: raw.tagline ?? undefined,
    defaultOgImageUrl: buildImageUrl(raw.defaultOgImage),
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @blog/service test -- loader.test.ts`
Expected: PASS — all cases in `describe('getSiteSettings', ...)`, including
the three new ones.

- [ ] **Step 6: Full package verify**

Run: `pnpm --filter @blog/service type-check && pnpm --filter @blog/service lint && pnpm --filter @blog/service test`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add packages/service/src/features/global/site-settings/adaptor/query.ts packages/service/src/features/global/site-settings/adaptor/transformer.ts packages/service/src/features/global/site-settings/adaptor/loader.test.ts
git commit -m "feat(service): join structured brand.specLine into a display string"
```

**PR note:** lands in the same PR as Task 2 (see Task 2's PR note) —
`cms`'s schema retype and `service`'s consumption of the new shape must merge
together for `main` to stay green throughout.

---

## Self-review notes

- **Spec coverage:** Decisions #1–#5 → Tasks 1–3; design §1 (config) → Task
  1; §2 (cms) → Task 2; §3 (service) → Task 3; §4 (testing) → Task 3 Step 1;
  migration note (§ Decisions #5) → Task 2 Step 3 description + no migration
  step anywhere (intentional).
- **Placeholder scan:** no TBD/TODO; every step has literal code.
- **Type consistency:** `TSpecLineSeparator`/`SPEC_LINE_SEPARATOR_CHARS`
  names match verbatim across Tasks 1–3; `TBrand.specLine` type is
  unchanged (no edit to `types.ts` anywhere in this plan — confirmed
  intentional, not an oversight).

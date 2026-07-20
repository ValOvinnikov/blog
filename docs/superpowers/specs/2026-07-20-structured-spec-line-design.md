# Structured spec line (items + separator)

**Date:** 2026-07-20
**Issue:** not yet filed — spans config + cms + service, needs an epic + 3
sub-issues per this repo's ticket-structure convention (filed after this
design is approved).
**Status:** Approved design, pending implementation plan

## Problem

`brand.specLine` (`apps/cms/src/schema-types/objects/brand.ts`) is a single
free-text string, max 60 chars, e.g. `"build 2026.07 · online"`. Editors must
hand-type the whole line, including the separator character, with no
structure or guardrails — easy to typo, inconsistent formatting across edits.

## Decisions

1. **Split into a structured list**: up to 4 short string items, each max 15
   chars, replacing the single free-text field.
2. **Separator becomes an editor-configurable, constrained select** — not
   free text — sourced from a fixed set of characters (Dot / Pipe / Bullet /
   Slash), matching the `brand.variant` dropdown pattern (#512/#513) rather
   than a raw string input.
3. **New reusable CMS object type**, not two sibling fields on `brand` —
   bundles `items` + `separator` into one self-contained concept.
4. **The join happens in the service transformer**, not web or ui.
   `TBrand.specLine` keeps its exact current shape
   (`TMaybeUndefined<string>`) — `packages/ui` (`BrandLockup`) and
   `apps/web` (`brand-lockup-link.tsx`) need **zero changes**. This mirrors
   how `transformer.ts` already computes `logoUrl` from raw fields
   (`buildImageUrl`) — deriving a display-ready value from raw content is
   already a service-layer responsibility here, and unlike date formatting
   (locale/request-dependent, hence a web concern per existing convention), a
   plain string join has no such dependency.
5. **No migration.** `specLine` changes shape (string → object) in the same
   PR; existing production values are dropped and re-entered by the editor
   post-deploy — acceptable for this single-editor, low-volume content.

## 1 — Config (`packages/config/src/constants/spec-line.ts`)

```ts
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

Matches the `BRAND_VARIANTS` convention: the stored/serialized value is the
UPPERCASE identifier (what Studio's `options.list` and the join logic key
off); the character mapping is a separate lookup since the glyph itself is a
display concern, not the stored value. Keying the mapping off
`SPEC_LINE_SEPARATORS`'s own values (rather than repeating the string
literals) keeps the two declarations in lockstep.

## 2 — CMS schema

New object type, `apps/cms/src/schema-types/objects/spec-line.ts`:

- `items`: array of strings, 0–4 entries, each entry `validation: max(15)`.
- `separator`: string, `options.layout: 'dropdown'`, `options.list` built from
  `Object.values(SPEC_LINE_SEPARATORS)` (same pattern as `brand.variant`),
  `initialValue: SPEC_LINE_SEPARATORS.DOT`, required.

`brandSchema`'s existing `specLine` field (`brand.ts`) changes from
`type: 'string'` to `type: specLineSchema.name`; the whole object stays
optional (no `rule.required()` at the field level) — 0 items is a valid
"nothing to show" state, same as today's absent string.

After the schema change: `pnpm typegen`, commit regenerated types.

## 3 — Service layer

`siteSettingsQuery`'s `brand` sub-projection: `specLine` projects
`{ items: string[], separator: TSpecLineSeparator }`, whole object nullable.

`toSiteSettings` transformer: joins into the existing `TBrand.specLine`
field — no type change:

```ts
specLine: raw.brand.specLine?.items.length
  ? raw.brand.specLine.items.join(
      ` ${SPEC_LINE_SEPARATOR_CHARS[raw.brand.specLine.separator]} `,
    )
  : undefined,
```

- Empty/absent `items` (or absent `specLine` object entirely) → `undefined`,
  never an empty string — keeps `TBrand.specLine` a clean
  `TMaybeUndefined<string>` with no faked defaults.
- Single item → no separator inserted (join of a 1-element array returns the
  element unchanged).
- `packages/ui` and `apps/web` are unaffected — `BrandLockup`'s `specLine?:
string` prop and `brand-lockup-link.tsx`'s `specLine={brand.specLine}` need
  no changes.

## 4 — Testing

Extend `packages/service/src/features/global/site-settings/` tests
(transformer/loader, following this feature's existing test structure):

- Multi-item join, once per separator character (Dot/Pipe/Bullet/Slash).
- Single item → item returned as-is, no separator character present.
- Empty `items` array → `specLine` is `undefined`.
- Absent `specLine` object entirely → `specLine` is `undefined`.

## Rollout / PR strategy

Spans 3 layers (config → cms → service) — per this repo's ticket-structure
convention, file an epic issue plus one sub-issue per layer before starting
work. Each layer is additive/shape-changing-but-unmigrated, so evaluate at
implementation time whether each sub-issue can merge to `main` green on its
own (per-layer PRs) or whether the `specLine` type-change forces cms+service
into a single PR (same reasoning as `SPEC.md`'s existing per-layer-PR
guardrail: a renamed/retyped field that downstream consumes reds
`type-check` until both land).

## Out of scope

- `packages/ui` / `apps/web` — no changes; both already consume a plain
  optional string.
- Any migration of existing `brand.specLine` production content.

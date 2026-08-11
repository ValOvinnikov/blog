# Layout & SectionHeader redesign

> Follow-on to the #1337 appearance/brand-variant redesign, reacting to
> production feedback on the shipped system (Hero's leftover CMS fields, a
> hardcoded border, whole-block `align` cascading onto headings it shouldn't,
> and non-responsive vertical spacing). Scope: `packages/config`, `apps/cms`,
> `packages/service`, `packages/ui`, `apps/web`.

## Problem

Live-site review of the #1337 redesign surfaced four issues:

1. Hero still exposes the full `appearance` field set in Studio, even though
   most of it (`containerWidth`, `align`) doesn't apply to Hero's layout.
2. `packages/ui/src/organisms/hero/hero-variants.ts` hardcodes a
   `border-b border-border-strong` on Hero's root — a visible border that is
   completely independent of the CMS-driven `divider` field, so editors can't
   control or remove it.
3. `Section`'s `align` variant (`START`/`CENTER`) applies `text-center` to its
   entire `inner` block, which is why `PostsSection`'s "Latest posts" heading
   renders centered — `align` was designed as whole-block alignment, but the
   only thing anyone actually wants aligned is the heading.
4. `Section`'s `spacingTop`/`spacingBottom` scale steps map to fixed,
   non-responsive Tailwind classes (e.g. flat `pt-12` at every breakpoint),
   while the horizontal gutter already shrinks responsively — so on mobile,
   vertical and horizontal padding fall out of proportion with each other.

## Design

### 1. `LAYOUT` (renamed from `appearance`)

`packages/config/src/constants/appearance.ts`'s `TAppearance` type and the
CMS's `appearanceField` helper are renamed to `TLayout`/`layoutField`,
CMS field name `layout`. Shape:

```ts
export const SPACING_SCALE = {
  NONE: 'NONE',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
} as const;
export const CONTAINER_WIDTH = {
  NARROW: 'NARROW',
  WIDE: 'WIDE',
  FULL: 'FULL',
} as const;

export type TLayout = {
  spacingTop?: TSpacingScale;
  spacingBottom?: TSpacingScale;
  containerWidth?: TContainerWidth; // not present on Hero's Layout
  dividerTop?: boolean;
  dividerBottom?: boolean;
};
```

- `ALIGN` (`START`/`CENTER`) is **removed entirely** — no replacement at the
  `Layout`/`Section` level. Alignment moves to the heading-scoped
  `SectionHeader.align` (Section 2 below).
- The single `divider: boolean` becomes two independent booleans,
  `dividerTop`/`dividerBottom`, each rendering its own `border-t`/`border-b`
  on `Section`'s root.
- **Hero's own `Layout` field list is trimmed** to `spacingTop`/
  `spacingBottom`/`dividerTop`/`dividerBottom` only — no `containerWidth`,
  since Hero's grid always manages its own width. The CMS's
  `layoutField` helper needs a variant/option to omit `containerWidth` for
  Hero's schema (mirroring how `brandVariantField()` already varies its
  option list per module).
- `packages/ui/src/organisms/hero/hero-variants.ts`'s hardcoded
  `border-b border-border-strong` on `root` is deleted. `dividerBottom`
  becomes the sole, CMS-controlled mechanism for that border — Hero renders
  it the same way every other module renders its dividers now, via `Section`.

### 2. `SectionHeader` (new shared field group)

New object type, CMS field name `sectionHeader`, attached to
`module_content`, `module_cta`, `module_postList`, `module_newsletter` only
— **not** Hero (Hero keeps its own existing mode/custom field-pair title
mechanism, which doesn't fit this generic shape).

```ts
export const HEADING_ALIGN = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
} as const;

export type TSectionHeader = {
  heading?: string;
  supportingText?: string;
  align?: THeadingAlign; // defaults to LEFT
};
```

Both `heading` and `supportingText` are optional. `SectionHeader` **replaces**
each module's existing visible-heading field(s); each module's own
`titleField()` becomes purely an internal Studio label going forward (already
true for `module_cta`/`module_newsletter`; new behavior for
`module_content`/`module_postList`, which currently dual-purpose their single
`title` field as both internal label and visible heading).

Per-module field mapping (also see Migration, below — none of this needs a
data migration since nothing is populated in production yet):

- **`module_cta`**: `sectionHeader.heading` replaces the old required
  `heading` field; `sectionHeader.supportingText` replaces the old optional
  `text` field. Both already have working web rendering today
  (`CtaModuleUi`'s `heading`/`text` props → `cta-module.tsx:47-50`) — only the
  data source changes, from `result.data.heading`/`text` to
  `result.data.sectionHeader.heading`/`supportingText`. No new UI needed.
- **`module_newsletter`**: `sectionHeader.heading`/`supportingText` replace
  the old `heading`/`description` fields (from the shared
  `newsletterContentFields()` helper). Same situation as CTA — already
  rendered, only the data source changes.
- **`module_content`**: `sectionHeader.heading` replaces the dual-purpose
  `title`'s visible-heading use (`title` stays as internal label only).
  `sectionHeader.supportingText` is a **genuinely new** field — `ContentModule`
  (ui) has no existing supporting-text rendering; add an optional `<p>` under
  the heading, following the same conditional-render pattern as
  `CtaModule`'s `text`.
  `sectionHeader.align` — no existing alignment mechanism on `ContentModule`'s
  heading; wire it the same way as post-list (below).
- **`module_postList`**: `sectionHeader.heading` replaces `title`'s
  dual-purpose visible-heading use (internal `title` stays, unchanged).
  `sectionHeader.supportingText` is new — `PostsSection` (ui) has no existing
  supporting-text rendering; add it under the `label`/`h2` heading.
  `sectionHeader.align` fixes the reported bug directly: `PostsSection`'s
  `<h2 id={titleId} className={s.label()}>` gets its own alignment class
  driven by `sectionHeader.align`, instead of inheriting `Section`'s
  (now-removed) whole-block `align`.

### 3. Responsive padding fix

`Section`'s `spacingTop`/`spacingBottom` scale steps (`section-variants.ts`)
get breakpoint-responsive Tailwind classes instead of a single flat class per
step (e.g. `MD` becomes `pt-8 sm:pt-10 lg:pt-12` instead of a flat `pt-12`).
Horizontal gutter (`px-gutter`) stays exactly as-is — a fixed, non-CMS-
configurable design-system constant, unrelated to `Layout`'s fields. The two
dimensions are answering different visual questions (vertical rhythm between
stacked sections vs. horizontal reading margin) and were never meant to track
each other's absolute values — the actual mobile bug was the two dimensions
changing at _different breakpoints_ than each other, not different values.
The fix: define `spacingTop`/`spacingBottom`'s breakpoint steps using the same
breakpoints the gutter already uses (`sm`/`lg`), so both dimensions step down
in lockstep even though their per-step values differ. No new field, no
inline/block CMS control — that would be scope creep against a need nobody
has expressed.

### 4. Migration

**`Layout` (Section 1): none required.** `appearance` has no populated data
in the `production` dataset yet (confirmed directly) — purely a rename/
restructure with nothing live to carry forward.

**`SectionHeader` (Section 2): required.** Unlike `appearance`, the fields
being restructured here — `module_cta.heading`/`text`,
`module_newsletter.heading`/`description`, `module_content.title`,
`module_postList.title` — are core authored content on modules already live
in production. Transform:

- **`module_cta`**: copy `heading` → `sectionHeader.heading`, `text` →
  `sectionHeader.supportingText`; remove the old `heading`/`text` fields.
- **`module_newsletter`**: copy `heading` → `sectionHeader.heading`,
  `description` → `sectionHeader.supportingText`; remove the old
  `heading`/`description` fields.
- **`module_content`**: copy `title` → `sectionHeader.heading`. `title`
  itself is untouched (keeps its existing value, becomes purely an internal
  Studio label going forward).
- **`module_postList`**: copy `title` → `sectionHeader.heading`. `title`
  itself is untouched, same as `module_content`.

Standard dry-run → dataset export (backup) → human-gated run via
`apps/cms/migrations/`, sequenced right after the schema+typegen step and
before `service` consumes the new shape.

## Affected layers

- `config`: rename `appearance.ts` constants/types (`TAppearance`→`TLayout`,
  drop `ALIGN`, split `divider`), add `HEADING_ALIGN`/`THeadingAlign`, add
  `TSectionHeader`.
- `cms`: rename `appearance-field.ts` helper → `layout-field.ts` (with a
  Hero-specific variant omitting `containerWidth`), add a new
  `section-header-field.ts` helper, wire it into `module_content`,
  `module_cta` (removing old `heading`/`text` fields),
  `module_postList`, `module_newsletter` (removing old
  `heading`/`description` fields — `newsletterContentFields()` helper may
  become unused and removable if `settings_newsletter` doesn't also need it;
  confirm before deleting). `pnpm typegen` after schema changes.
- `service`: every module's view-model gains `sectionHeader` (typed per
  module via generated types), `appearance`→`layout` rename flows through
  automatically via typegen.
- `ui`: `hero-variants.ts` drops the hardcoded border; `ContentModule`/
  `PostsSection` gain a new optional supporting-text paragraph and
  heading-alignment class, following each component's existing
  conditional-render/variant patterns. `Section` itself lives in `apps/web`,
  not `packages/ui` (see #1337's Task 6), so its changes are listed under
  `web` below.
- `web`: `Section`/`section-variants.ts` — rename `appearance`→`layout` prop,
  drop `align` variant, split `divider` into `dividerTop`/`dividerBottom`
  variants, make `spacingTop`/`spacingBottom` responsive. Each of the 4
  module components (`content`, `cta`, `post-list`, `newsletter`) reads
  `sectionHeader` from its service result and passes `heading`/
  `supportingText`/`align` through to its `ui` organism instead of the old
  top-level fields.

## Testing

Standard per-layer `testing-practices` — schema validation (`cms`), service
view-model shape (`service`), component render/conditional/alignment
behavior (`ui`, `web` — assert accessible heading text and structure, never
`toHaveClass` on presentation/alignment classes per this repo's convention).

# CTA Module — Enrichment & Variant System

**Status:** Design spec (schema + component contract; no code yet).
**Date:** 2026-08-29
**Pairs with:** `docs/design-reference/cta-module-system.html` — the visual mock this spec formalises (Banner / Split / Callout, shared options, both themes).
**Token source of truth:** `configs/tailwind/theme.css`. This spec maps the module onto existing semantic tokens (`bg-primary`, `bg-secondary`, `bg-brand-primary-muted`, `--brand-primary-solid`, the button variants, `--font-display` / `--font-read` / `--font-mono`, `--radius-*`) and adds exactly one new token — see §4.1.
**Repo layout:** the CMS Studio lives in `packages/studio` (import alias `@blog/studio/schema-types/…`); UI in `packages/ui`, web in `apps/web`, shared types in `packages/service`, tokens/constants in `packages/config` + `configs/`.
**Folds in:** #1861 (`CtaModuleView` drops the authored action `ariaLabel`) — see §8.1.
**Followed by:** `docs/superpowers/specs/2026-08-29-link-library-blocks-design.md` — reusable link documents. This spec ships on the inline `link` object; §5 is shaped so adopting library references later is additive.

---

## 1. Summary

Today `module_cta` renders a heading, an optional supporting string, and exactly one action, on a full-bleed `Section` band. This spec turns it into a small, deliberate **variant system**: three layout variants (**Banner**, **Split**, **Callout**) — Split and Callout contained, Banner full-bleed (D13) — an optional image, a separate optional rich-text block, a reusable **action group** object, an optional footnote, and the three brand tones the other page-builder modules already carry.

### Goals

- Replace the single `action` link with a **reusable `actionGroup` object** (§5) — owned by no single module, adopted by CTA first and by Hero / Newsletter / future modules after.
- Three layout variants selectable per instance; each exposing only the options that make sense for it.
- Add a **separate** optional rich-text `content` field (lists, bold, italic, inline links); the title's supporting text stays plain — §6.
- Render Split and Callout as **contained** blocks; Banner as **full-bleed** — §3.
- Keep `CtaModule` (`packages/ui`) presentation-only; the web layer maps Sanity data → props, as it does today.
- Close #1861 by construction: the new action rendering forwards `ariaLabel` — §8.1.

### Non-goals

- No new **colour** tokens. Brand tone selection stays limited to the three existing `BRAND_VARIANT` values. (One new _shadow_ token is required — §4.1.)
- No icon media. An earlier exploration had an icon-chip option in the centered variant; **dropped** — Callout supports an optional **image** only.
- No animation beyond the existing `--ease-console` hover transitions on buttons.
- Not the link library. Links stay inline objects here.

---

## 2. The three variants

**Split and Callout are contained modules**: bounded, rounded (`--radius-xl`), bordered blocks with the card shadow, sitting inside the content column with page margins around it. **Banner is full-bleed** (D13 ✔, revised 2026-08-29) — it spans edge to edge like the `Section` landmark itself, not a card (§3.2a).

| Variant     | Media                                                                                                                         | Alignment                                       | Distinctive options                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| **Banner**  | Background image + overlay scrim, text reversed to white, **full-bleed** (spans the full viewport width). **Image required.** | `align`: left / center / right                  | Overlay tint follows the brand tone (§3.3).                            |
| **Split**   | Image in a side slot. **Image required.**                                                                                     | Fixed (content in its column)                   | `imageSide`: left / right · `mobileMediaOrder`: last (default) / first |
| **Callout** | Optional image **above** the content.                                                                                         | `align`: left / center / right (default center) | The default variant; works with no image at all.                       |

The centered variant is named **Callout** (D6 ✔; renamed from the working name "Stack"). "Centered" was rejected because it collides with the `align: center` value and reads ambiguously. _Note: the mock's CSS still uses `.cta--stack` internally — cosmetic, not a contract._

Shared by every variant: optional **eyebrow**, required **heading**, optional plain **supporting text**, optional rich **content** (§6), optional **actions** (§5), optional **footnote**, and the **brand tone**.

---

## 3. Containment & brand tone

### 3.1 The change

`Section` is currently the sole per-module landmark and paints `brandVariant` full-bleed (`bg-primary` / `bg-secondary` / `bg-brand-primary-muted`) edge to edge, wrapping a constrained inner `<div>`. A contained CTA needs the tone to fill a **bounded container** with a border/shadow and page-gutter margins, not the viewport width.

`Section` lives at **`apps/web/src/components/shared/section/`** — it is a web-layer landmark, not a `@blog/ui` export. `CtaModule` (in `packages/ui`) therefore cannot and must not import it; the composition happens in `cta-module-view.tsx`.

### 3.2 Decision (D1 ✔) — `CtaModule` paints its own contained card; `Section` is unchanged

Both Hero and CTA already wrap in the shared full-bleed `Section` landmark (`hero-module-view.tsx`, `cta-module-view.tsx`), which paints `brandVariant` edge to edge. Full-bleed is the established pattern — **`Section` is not modified, and no new `contained` mode is invented.**

The contained look is owned by `CtaModule` itself: it renders the bounded card (border, `--radius-xl`, card shadow, its own padding and max-width, centered) and fills it with the theme tone. This is the one place CTA diverges from the other modules — unlike them, `CtaModule` reads the tone and paints its own background — which is the accepted cost of a self-contained presentation. **This applies to Split and Callout. Banner is the exception — see §3.2a.**

### 3.2a Decision (D13 ✔, revised 2026-08-29) — Banner is full-bleed; still no change to `Section`

Confirmed by reading `Section`'s own implementation (`apps/web/src/components/shared/section/section.tsx` + `section-variants.ts`): it renders `<section className={root}><div className={inner}>{children}</div></section>`, where `root` paints `brandVariant` edge to edge but `inner` is **always** constrained — `mx-auto px-gutter` plus a `containerWidth` variant whose narrowest option (`FULL`) is still `max-w-page`, never unconstrained. There is no existing Section option that lets `children` span the true viewport width — so achieving Banner's full-bleed image requires either modifying `Section` (rejected in D1, same reasoning: touches every module for one variant's sake) or a **breakout** owned entirely by `CtaModule`.

**Chosen: `CtaModule` breaks out of `Section`'s `inner` constraint itself, for the Banner variant only.** A standard CSS technique — escape the ancestor's `mx-auto max-w-*` box via a full-viewport-width element centered independently of it:

```ts
// cta-module-variants.ts (sketch) — Banner-only breakout, added to §3.2's tv() config
variant: {
  BANNER: {
    root: ['relative left-1/2 w-screen -translate-x-1/2', 'rounded-none border-none shadow-none'],
  },
  SPLIT: {/* … */},
  CALLOUT: {/* … */},
},
```

`left-1/2 w-screen -translate-x-1/2` is independent of whatever ancestor constrains it, so it escapes `Section`'s `inner` `max-w-page`/`px-gutter` regardless of viewport or nesting — no coordinate math tied to `Section`'s specific padding values, so it keeps working if those change. Banner also drops the card treatment entirely for this variant (`rounded-none border-none shadow-none` overriding the shared `root` slot) since it's no longer a card.

**`Section` itself needs zero changes** — same principle D1 already established for Split/Callout, applied consistently: the module owns its own presentation, including breaking out of the landmark's constraint, rather than growing the shared landmark's API for one variant. `Section` stays pinned to `PRIMARY` for Banner too (§3.2's JSX below, unchanged) — its own paint becomes invisible once `CtaModule`'s breakout covers the width, so there's no visual difference from pinning it to the authored tone instead; PRIMARY is chosen only for uniformity across all three variants.

**Vertical spacing is a separate, already-solved axis.** The breakout only escapes horizontal constraint — `Section`'s own `pt-*`/`pb-*` (via `layout.spacingTop`/`spacingBottom`) still wraps it vertically by default, same rhythm as every other module. An author who wants the image flush against neighbouring sections (no gap above/below) can already set `spacingTop`/`spacingBottom` to `NONE` on that module instance — this is an existing per-module `layout` field, not a new one Banner needs.

```ts
// cta-module-variants.ts (sketch) — the module owns the card + tone
export const ctaModuleVariants = tv({
  slots: {
    root: [
      'mx-auto w-full max-w-4xl',
      'rounded-xl border border-border shadow-card',
      'px-6 py-8 sm:px-8 sm:py-10',
    ],
    // …heading / text / media / actions slots
  },
  variants: {
    tone: {
      PRIMARY: { root: ['bg-primary'] },
      SECONDARY: { root: ['bg-secondary'] },
      BRAND_PRIMARY: { root: ['bg-brand-primary-muted'] },
    },
    variant: { BANNER: {/* … */}, SPLIT: {/* … */}, CALLOUT: {/* … */} },
  },
});
```

**The wrapping `Section` stays neutral.** `cta-module-view.tsx` passes the authored `brandVariant` to `CtaModule` (the card tone) and pins the surrounding `Section` to `PRIMARY` — the page tone — so there is no competing full-bleed band behind the card; `Section` still contributes only the landmark, vertical spacing, and container width it already owns:

```tsx
<Section brandVariant={BRAND_VARIANT.PRIMARY} layout={layout} titleId={titleId}>
  <CtaModule tone={brandVariant} variant={variant} /* … */ />
</Section>
```

(Banner is the double exception: it isn't a card at all — it breaks out to full-bleed §3.2a — and its tone drives an image overlay §3.3, not a fill.)

**Rejected:** adding a `contained` mode, or an image-background capability, to `Section`. Either would modify the shared landmark every module depends on to serve one variant's presentation — more blast radius than letting the CTA own its own presentation, contained or full-bleed (§3.2a).

**Known cost — `brandVariant` is semantically overloaded on this module.** Everywhere else the field means "the full-bleed band tone behind this section"; here it means "the card fill" for Split/Callout or "the overlay tint" for Banner (§3.3), and the band is force-pinned to `PRIMARY` for all three. An author who understands the field from Hero will mis-predict it here. Accepted rather than renamed, because a module-specific field name (`cardTone`) would break the uniform `brandVariantField()` helper every module shares and complicate the projection. The Studio `description` on this module's field must say so explicitly.

### 3.3 Tone on Banner (D2 ✔ — resolved)

Banner is always image-filled with a dark overlay, so a surface fill is not visible. There the brand tone drives the **overlay tint**, not a background colour:

- `BRAND_PRIMARY` → azure scrim
- `PRIMARY` / `SECONDARY` → neutral-dark scrim

Both are shown side by side in the mock's Banner section. The scrim is a gradient composed from existing `oklch` brand values at opacity — no new colour token (see the mock's `.cta--banner::after` and `.tint-neutral::after`).

### 3.4 Primary tone as a contained card (Split / Callout only)

Because `--primary` equals the page background, a Primary-tone contained module reads as an **elevated near-white card** — its border and shadow define it against the faintly-tinted page. Secondary (grey) and Brand Primary (pale azure) separate on fill alone. Verified in both themes in the mock. Doesn't apply to Banner — it has no card fill to separate from the page (§3.2a/§3.3).

---

## 4. Content model — module fields

### 4.1 Required config-layer change: the card shadow token

`configs/tailwind/theme.css` has **no `--shadow-*` token group** — the repo uses stock Tailwind `shadow-sm` / `shadow-md` / `shadow-lg`. The contained card needs a softer, wider elevation than any of those, and the mock defines it:

```css
/* light */
--shadow-card:
  0 1px 2px oklch(0.2 0.02 250 / 0.05), 0 14px 34px oklch(0.2 0.04 250 / 0.07);
/* dark */
--shadow-card: 0 1px 2px oklch(0 0 0 / 0.3), 0 16px 40px oklch(0 0 0 / 0.35);
```

Add `--shadow-card` (both themes) to `configs/tailwind/theme.css` and expose it as `shadow-card` via the `@theme inline` block, as a **config-layer** change ahead of the UI work. Without it, `shadow-card` in §3.2 is a silent no-op class.

### 4.2 New constants (`packages/config/src/constants/`)

```ts
export const CTA_VARIANT = {
  BANNER: 'BANNER',
  SPLIT: 'SPLIT',
  CALLOUT: 'CALLOUT',
} as const;
export type TCtaVariant = TValueOf<typeof CTA_VARIANT>;

export const CTA_IMAGE_SIDE = { LEFT: 'LEFT', RIGHT: 'RIGHT' } as const;
export type TCtaImageSide = TValueOf<typeof CTA_IMAGE_SIDE>;

export const CTA_MOBILE_MEDIA_ORDER = { LAST: 'LAST', FIRST: 'FIRST' } as const;
export type TCtaMobileMediaOrder = TValueOf<typeof CTA_MOBILE_MEDIA_ORDER>;
```

Plus the action-group constant in §5. `TValueOf` is imported from `@blog/config/utils`.

### 4.3 `module_cta` fields

Reusing the existing `requiredHeadingSectionHeader` object (heading + supporting text + align) plus the new fields:

| Field              | Type                                                               | Req                         | Applies to                                   | Notes                                                                           |
| ------------------ | ------------------------------------------------------------------ | --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `title`            | `titleField()`                                                     | ✓                           | all                                          | internal, unchanged                                                             |
| `variant`          | string `CTA_VARIANT`                                               | ✓                           | all                                          | default `CALLOUT`                                                               |
| `brandVariant`     | `brandVariantField({ list: [BRAND_PRIMARY, PRIMARY, SECONDARY] })` | ✓                           | all                                          | the **card tone** (§3.2); description must state the divergence                 |
| `eyebrow`          | string (max 40)                                                    | –                           | all                                          | optional kicker label                                                           |
| `sectionHeader`    | `sectionHeaderField({ requireHeading: true })`                     | ✓                           | all                                          | existing object → **heading** (required), **supportingText** (plain), **align** |
| `content`          | `basicText`                                                        | –                           | all                                          | **separate** optional rich block — §6                                           |
| `image`            | `imageWithAlt`                                                     | ✓ Banner & Split; – Callout | Banner (bg) · Split (side) · Callout (above) | `hidden` + custom-required per `variant`                                        |
| `imageSide`        | string `CTA_IMAGE_SIDE`                                            | –                           | Split                                        | default `RIGHT`; hidden unless `variant === SPLIT`                              |
| `mobileMediaOrder` | string `CTA_MOBILE_MEDIA_ORDER`                                    | –                           | Split                                        | default `LAST`; hidden unless `variant === SPLIT`                               |
| `actions`          | `actionGroupField()` → `actionGroup`                               | –                           | all                                          | §5                                                                              |
| `footnote`         | string (max 120)                                                   | –                           | all                                          | optional text below the actions                                                 |
| `layout`           | `layoutField`                                                      | –                           | all                                          | unchanged                                                                       |

**Content alignment (D3 ✔).** There is no separate `contentAlign` field — the existing `sectionHeader.align` (`HEADING_ALIGN`) _is_ the content alignment. The component applies a per-variant default when unset: **Banner → LEFT, Callout → CENTER**; **Split ignores alignment** (content sits in its grid cell).

**Supporting text vs. content (D5 ✔).** `sectionHeader.supportingText` stays the short **plain** subtitle. The rich block is the **separate** `content` field (§6). _The mock's intro caption calls the supporting text "rich" — that caption predates D5 and is stale; the mock's own markup already renders `content` as the rich region._

Field visibility uses Sanity `hidden: ({ parent }) => …` keyed on `variant`. `image` requiredness is enforced with a custom validation that only fires for Banner/Split — Sanity cannot make `.required()` conditional on a sibling field.

---

## 5. `actionGroup` — the reusable actions object

**Decision (D8 ✔, reverted 2026-08-29 — see D14).** Actions are a **standalone reusable object** placed under `objects/blocks/` so Hero, Newsletter, and future modules adopt the same one — that half of D8 stands. The **shape inside it is an array, not named slots** — see D14 below for why, and for what actually shipped in #2309/PR #2312 before this correction (named `primary`/`secondary` fields, `secondaryAppearance` hidden for primary). That version is being reverted.

**Decision (D14 ✔).** Each action is its own array item with its own `variant` (`PRIMARY`/`SECONDARY`) and its own `appearance` — **appearance is available on both variants**, not hidden for `PRIMARY`. Max 2 items; a `PRIMARY` item is required and must be first; `SECONDARY` is optional. This is the shape the epic's original spec draft proposed (`ctaAction`/`ctaActions`) — D8's "named slots avoid a validator" reasoning was mine, not confirmed, and the array shape is what's actually wanted. The one residual validator (max 2 / unique variants / Primary-first) is accepted as the cost of this shape, not avoided.

### 5.1 Shape (`objects/blocks/action-group.ts`)

Two object types: `ctaAction` (one item) and `actionGroup` (the validated array wrapper).

```ts
// objects/blocks/action-group.ts
import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { linkSchema } from '@blog/studio/schema-types/objects/link';
import { MousePointerClick } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const ctaActionSchema = defineType({
  name: 'ctaAction',
  title: 'Action',
  type: 'object',
  icon: MousePointerClick,
  initialValue: {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  },
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description:
        'Primary is the main action. Secondary is the supporting action.',
      options: {
        layout: 'radio',
        list: Object.values(CTA_ACTION_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'appearance',
      title: 'Appearance',
      type: 'string',
      description:
        'How this action looks: Contained (filled/bordered button) or Inline (text link). Available on both Primary and Secondary.',
      options: {
        layout: 'radio',
        list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: linkSchema.name,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      label: 'link.label',
      variant: 'variant',
      appearance: 'appearance',
    },
    prepare({ label, variant, appearance }) {
      return {
        title: String(label ?? 'Action'),
        subtitle: `${toTitleCase(String(variant ?? ''))} · ${toTitleCase(String(appearance ?? ''))}`,
      };
    },
  },
});

type TActionItem = { _key?: string; variant?: string };

export const actionGroupSchema = defineType({
  name: 'actionGroup',
  title: 'Actions',
  type: 'object',
  fields: [
    defineField({
      name: 'actions',
      title: 'Actions',
      type: 'array',
      description:
        'Up to two actions. Primary is required and comes first; Secondary is optional.',
      of: [defineArrayMember({ type: ctaActionSchema.name })],
      validation: (rule) =>
        rule.max(2).custom((value) => {
          const items = (value ?? []) as TActionItem[];
          if (items.length === 0) return true;

          const variants = items.map((i) => i?.variant);

          if (new Set(variants).size !== variants.length) {
            return 'Each action variant (Primary, Secondary) can be used only once.';
          }
          if (variants[0] !== CTA_ACTION_VARIANT.PRIMARY) {
            return 'A Primary action is required and must be first.';
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: { a0: 'actions.0.link.label', a1: 'actions.1.link.label' },
    prepare({ a0, a1 }) {
      const labels = [a0, a1].filter(Boolean).map(String);
      return {
        title: labels.length ? labels.join('  ·  ') : 'No actions',
        subtitle: `${labels.length} action${labels.length === 1 ? '' : 's'}`,
      };
    },
  },
});
```

**New constant needed, not yet shipped.** `#2301` (config layer, merged) shipped `CTA_ACTION_APPEARANCE` but not `CTA_ACTION_VARIANT` — the named-slots version didn't need a variant enum (the field name itself said which slot), the array version does:

```ts
export const CTA_ACTION_VARIANT = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
} as const;
export type TCtaActionVariant = TValueOf<typeof CTA_ACTION_VARIANT>;
```

A follow-up config-layer change, dispatched to the `config` agent before the studio rework — same layer-routing rule as everything else, a one-constant addition doesn't earn a hand-edit.

The `helpers/action-group-field.ts` field helper (already shipped in #2309) is unaffected — it still returns a field named `actions` typed as `actionGroupSchema.name`; only what's _inside_ `actionGroupSchema` changes.

**Link-library readiness.** `ctaAction.link` is typed as the inline `link` object today. When the link library lands, that one field's type changes from `link` to `linkRef` — `ctaAction`, `actionGroup`, and every consumer are otherwise untouched.

### 5.2 Appearance → button variant mapping

The web layer maps each action onto the existing `@blog/ui` `Button` variants — no new button styles. Applies per-item now, not just to the secondary slot:

| Action variant | Appearance  | Renders as `Button variant`                |
| -------------- | ----------- | ------------------------------------------ |
| `PRIMARY`      | `CONTAINED` | `primary` — filled `--brand-primary-solid` |
| `PRIMARY`      | `INLINE`    | `link` — underlined `--brand-primary`      |
| `SECONDARY`    | `CONTAINED` | `ghost` — `--border-strong`, hover brand   |
| `SECONDARY`    | `INLINE`    | `link` — underlined `--brand-primary`      |

---

## 6. Optional `content` — basic rich text (D5)

Per D5 the rich text is a **separate** field from the title's supporting text:

- **`sectionHeader.supportingText`** — short **plain** subtitle. Unchanged (`type: 'text'`, max 300).
- **`content`** — a **separate, optional** basic rich-text block: bullet / numbered lists, **bold**, _italic_, and inline links.

The repo has two block objects: `richText` (full — H2–H4, quote, `bodyImage`, `code`, `aside`) and `blockText` (`array of block`, Sanity defaults). Neither is "basic prose", so add a third. **It is named `basicText`, not `ctaContent`** — the gap it fills is generic, and Hero/Newsletter should be able to adopt it without importing a CTA-branded type.

```ts
// objects/blocks/basic-text.ts
import { linkSchema } from '@blog/studio/schema-types/objects/link';
import { defineArrayMember, defineType } from 'sanity';

export const basicTextSchema = defineType({
  name: 'basicText',
  title: 'Basic Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }], // no headings
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        // D4 ✔ — reuse the EXISTING link object as the inline annotation
        annotations: [{ type: linkSchema.name }],
      },
    }),
  ],
  validation: (rule) => rule.max(6), // CTAs stay short
});
```

Rendered on web with `@portabletext/react`: `strong` / `em`, `ul` / `ol` (bullet markers in `--brand-primary`), and `link` annotations resolved through the **same** `SmartLink` (`apps/web/src/components/shared/smart-link/`) the actions use — one link object, one renderer, everywhere. In a centered **Callout**, lists left-align inside the centered block (D5a ✔ resolved — the mock's own CSS already implements this, and #2304's ui-layer build matched it during visual verification against the mock).

---

## 7. Component layer (`packages/ui`)

### 7.1 `CtaModule` props

```ts
type TCtaModuleProps = {
  variant: TCtaVariant;
  tone: TBrandVariant; // card fill (Split/Callout, §3.2) or overlay tint (Banner, §3.2a/§3.3)
  eyebrow?: string;
  heading: string;
  headingId?: string;
  supportingText?: string; // plain subtitle (sectionHeader.supportingText)
  content?: ReactNode; // pre-rendered basic Portable Text
  image?: ReactNode; // pre-rendered <img>/next Image, or null
  actions?: ReactNode; // pre-rendered <ActionGroup/>, built by web — §7.2
  footnote?: string;
  align?: THeadingAlign; // Banner + Callout; named to match sectionHeader.align (D3)
  imageSide?: TCtaImageSide;
  mobileMediaOrder?: TCtaMobileMediaOrder;
  isWrapped?: boolean; // as today — drops own outer spacing under Section
};
```

Consistent with today's pattern: **the web layer builds the anchors/images** and passes rendered nodes; `CtaModule` never constructs a link, never imports `next/link`, and has no molecule of its own for this. `cta-module-variants.ts` grows the card `root` (border, radius, shadow, max-width — §3.2), a `tone` variant for the fill, and `variant` / `align` / `imageSide` / `mobileMediaOrder` slots. `actions` is a plain `ReactNode` slot, styled by the card's own `cta__actions`-equivalent layout row — no different in kind from how `Hero` takes its `Hero.Cta` children today.

Reading order is fixed **content → media** in the DOM for every variant; visual side is CSS `order` only, so keyboard and screen-reader order always hits heading → text → actions before a decorative image. `mobileMediaOrder: FIRST` is the sole opt-in that moves the image ahead on mobile.

### 7.2 `ActionGroup` — a web-layer shared component (D8 revised — see below)

**Not a `packages/ui` molecule.** Investigated 2026-08-29 by reading how `Hero` — CTA's closest sibling in the module registry — actually builds its own actions today (`apps/web/src/modules/hero/hero-module-view.tsx`):

```tsx
<LinkButton
  as={SmartLink}
  href={primaryAction.href}
  target={primaryAction.target}
>
  {primaryAction.label}
</LinkButton>
```

`LinkButton` (`packages/ui/src/molecules/link-button/`) already exists and is exactly the primitive needed: polymorphic via `as`, applies `buttonVariants` to whatever element it's given. `Hero.Cta` (`HeroCta`) is a plain styled `<div>` slot — it never constructs a link itself. Building a new `packages/ui` molecule that duplicates this would be more machinery than the codebase's own established pattern uses, and `packages/ui` cannot import `next/link` at all (`CLAUDE.md`) — `LinkButton` is deliberately how it avoids ever needing to.

So `ActionGroup` is a **web-layer shared component**, `apps/web/src/components/shared/action-group/`, alongside `smart-link/` and `section/`. It is the one place the §5.2 appearance-mapping table lives, so it isn't duplicated at every call site. It takes the **array** the service layer projects (§8) — already validated primary-first by the schema, so `ActionGroup` just renders in order, it doesn't re-derive ordering:

```tsx
// apps/web/src/components/shared/action-group/action-group.tsx (sketch)
const toButtonVariant = (
  variant: TCtaActionVariant,
  appearance: TCtaActionAppearance,
): TButtonVariant => {
  if (appearance === CTA_ACTION_APPEARANCE.INLINE) return 'link';
  return variant === CTA_ACTION_VARIANT.PRIMARY ? 'primary' : 'ghost';
};

export const ActionGroup = ({ actions, onDark }: TActionGroupProps) => (
  <>
    {actions.map((action) => (
      <LinkButton
        key={action.link.href}
        as={SmartLink}
        href={action.link.href}
        target={action.link.target}
        aria-label={action.link.ariaLabel}
        variant={toButtonVariant(action.variant, action.appearance)}
        className={
          onDark ? 'border-white/55 text-white hover:border-white' : undefined
        }
      >
        {action.link.label}
      </LinkButton>
    ))}
  </>
);
```

`cta-module-view.tsx` imports it, passes `actions` (the projected array) straight through, and passes the result as `CtaModule`'s `actions` prop — the same shape `HeroModuleView` already passes into `Hero.Cta`, just factored into a named, reusable component instead of repeated inline JSX, since CTA's mapping (variant + appearance → button variant) is one step more than Hero's.

**`onDark` (D15 ✔, added 2026-08-29).** Discovered during #2304's own visual verification against the mock: Banner reverses its `ghost`/`link`-appearance button colors to white (mock's `.cta--banner .btn--ghost` override), but `CtaModule`'s `actions` prop is an opaque pre-rendered `ReactNode` — it structurally cannot reach in and recolor what web already built, and per D1/D8 it must not gain that ability (that would mean `CtaModule` constructing or mutating links, which is explicitly rejected). So the fix lives entirely on the web side: `cta-module-view.tsx` passes `onDark={variant === CTA_VARIANT.BANNER}` into `ActionGroup`, which applies the reversed border/text color only to its `ghost`/`link`-variant buttons (the `primary` variant is already a solid fill and needs no override — confirmed against the mock, its filled button is identical on Banner). `primary` action's own color is unaffected either way.

**Scope note:** this ticket does not migrate `HeroModuleView` onto `ActionGroup` — that inline JSX keeps working as-is. Adopting it there is a natural follow-up, not part of this epic; call it out separately if wanted rather than expanding this PR's diff.

---

## 8. Web & service wiring

- **Service (`packages/service/src/features/modules/cta/`)** — the CTA feature slice is `adaptor/{query,loader,transformer,types}.ts` + `application/service.ts` (plus tests), not a single projection file. Extend the query to select `variant`, `eyebrow`, `sectionHeader { heading, supportingText, align }`, `content` (Portable Text), `image` (+ alt), `imageSide`, `mobileMediaOrder`, `actions[] { variant, appearance, link }`, `footnote`, `brandVariant`, `layout`. Each array item's `link` field is projected with the existing `linkFragment` — it already projects `accessibleLabel`, which is what §8.1 depends on. Add a shared `actionGroupFragment` (projecting the whole `actions[]` array) next to `linkFragment` so Hero/Newsletter reuse it if they later adopt the Studio `actionGroup` object.
- **Web (`apps/web/src/modules/cta/`)** — `cta-module-view.tsx` renders the `Section` landmark pinned to `brandVariant={PRIMARY}` (§3.2), builds the image node, renders optional `content` via Portable Text, builds `<ActionGroup>` (§7.2), and passes everything to `CtaModule` including `tone={brandVariant}`.

### 8.1 #1861 — the dropped `ariaLabel` (closed by this work)

`CtaModuleView` currently builds `<SmartLink href={action.href} target={action.target}>{action.label}</SmartLink>` and silently drops `action.ariaLabel`, so an editor's authored accessible label has no effect. The rewrite in §7.2/§8 replaces exactly this code path, so the fix lands by construction:

- Every action rendered through the new `ActionGroup` (§7.2) forwards the authored value to its `LinkButton`/`SmartLink` via the **native `aria-label` prop**, exactly as `HeroModuleView`'s secondary action already does (`aria-label={secondaryAction.ariaLabel}`) — `LinkButton`'s polymorphic props (`TPolymorphicProps`) inherit the underlying element's native props rather than declaring its own custom `ariaLabel` prop, so `aria-label` (not camelCase `ariaLabel`) is the correct call-site prop name here — confirmed against `packages/config/src/react/polymorphic.ts` and Hero's own working usage. The repo's a11y convention ("never hardcode an `aria-label` string, pass the value through a prop") is satisfied because the _value_ comes from `action.link.ariaLabel`, not a literal string — the convention is about the value's source, not the JSX prop's spelling. Confirm `SmartLink`'s prop contract exposes the pass-through; if it does not, that wiring is part of this work.
- Co-located test coverage must assert the authored `ariaLabel` reaches the rendered link's accessible name, and **must fail without the fix** — verified against a stubbed implementation, not assumed.

**Out of scope here, tracked separately:** #1861 also asks whether sibling `*ModuleView` components under `apps/web/src/modules/` drop the same prop. That sweep is broader than the CTA module and gets its own follow-up issue rather than inflating this diff.

---

## 9. Migration — none required (verified)

**There are no `module_cta` documents in any dataset, so no data migration is needed.** Verified 2026-08-29 by querying both content lakes directly:

| Dataset                    | Total docs | `module_cta` | Module types actually present                                                                     |
| -------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `50l5r0vs` / `development` | 122        | **0**        | `module_hero`, `module_newsletter`, `module_postLatest`, `module_postList`, `module_taxonomyList` |
| `7fuqzuyl` / `production`  | 69         | **0**        | `module_content`, `module_hero`, `module_postList`                                                |

Both queries returned real content (so the zero is a genuine absence, not an access failure). `module_cta` is a schema type that has never been authored against.

**Consequences:**

- The required `action` field can be **removed outright** in the same change that adds `actions`. Nothing orphans.
- No `sanity/migrate` transform, no dry-run, no backup, no human-gated production run.
- The "deprecate-then-delete across two releases" caution that would otherwise apply is moot.

**The one caveat:** this holds only while the count stays zero. If a CTA is authored between now and the schema landing, re-check before removing `action` — a single `count(*[_type == "module_cta"])` against both datasets is enough. Ship the schema promptly rather than leaving it staged for weeks.

_(This section previously specified a full migration. That was written before the datasets were checked; the check found nothing to migrate.)_

## 10. Validation summary

| Rule                            | Where                                                       | Message                                                           |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| ≤ 2 actions                     | `actionGroup.actions` `rule.max(2)`                         | (built-in)                                                        |
| Each variant once               | `actionGroup.actions` custom                                | "Each action variant (Primary, Secondary) can be used only once." |
| Primary present & first         | `actionGroup.actions` custom                                | "A Primary action is required and must be first."                 |
| `variant` required per action   | `ctaAction.variant`                                         | (required)                                                        |
| `link` required per action      | `ctaAction.link`                                            | (required)                                                        |
| `label` ≤ 40 per action         | inherited from `link`                                       | (existing)                                                        |
| Image required for Banner/Split | `module_cta.image` custom                                   | "Banner and Split need an image."                                 |
| `heading` required, ≤ 80        | `sectionHeader.heading` (in `requiredHeadingSectionHeader`) | (existing)                                                        |
| `eyebrow` ≤ 40                  | `module_cta.eyebrow`                                        | (max)                                                             |
| `footnote` ≤ 120                | `module_cta.footnote`                                       | (max)                                                             |
| `content` ≤ 6 blocks            | `basicText`                                                 | (max)                                                             |

Three of these (max-2, variant-uniqueness, Primary-first) are the cost of the array shape (D14) — the earlier named-slots version avoided them, but that version is what's being reverted.

---

## 11. Accessibility

- One `<h2>` per module (`heading`), wired to `Section`'s `aria-labelledby` as today.
- DOM order content-before-media (§7.1); decorative images get empty `alt` unless authored otherwise via `imageWithAlt`.
- Banner text sits on an overlay scrim tuned to clear WCAG 1.4.3 (4.5:1) over the image; the overlay guarantees contrast independent of the uploaded image.
- Button focus rings inherit the global `--ring` / `focus-visible` treatment already in `buttonVariants`.
- `INLINE`-appearance secondary actions remain real anchors (underlined), not ambiguous buttons.
- Authored `ariaLabel` reaches the rendered accessible name — §8.1 / #1861.

---

## 12. Decisions

**Resolved:**

- **D1 ✔** — Containment: for Split/Callout, `CtaModule` paints its own contained card; `Section` is unchanged (full-bleed landmark), pinned to `PRIMARY` for the CTA so no band competes. §3.2. Known cost: `brandVariant` is overloaded on this module, accepted and documented rather than renamed. Banner is the exception — see D13.
- **D2 ✔** — Banner brand tone drives the **overlay tint** (Primary / Secondary → neutral-dark scrim; Brand Primary → azure scrim), not a surface fill. §3.3, shown in the mock.
- **D3 ✔** — Content alignment is `sectionHeader.align`; component defaults **Banner LEFT, Callout CENTER**; Split ignores it. The `CtaModule` prop is named `align` to match. §4.3, §7.1.
- **D4 ✔** — Reuse the existing `linkSchema` everywhere: Hero `secondaryAction` (already), both `actionGroup` slots, and the inline `content` annotation. One link object, one `SmartLink` renderer. §5–§6.
- **D5 ✔** — Rich text is a **separate** `content` field, distinct from the plain `sectionHeader.supportingText`. §4.3, §6.
- **D6 ✔** — Centered variant named **Callout** (over Stack / Centered). §2.
- **D7 ✔** — Optional text under the actions named **`footnote`**.
- **D8 ✔ (reuse half stands; shape half reverted — see D14)** — Actions live in a **reusable `actionGroup` object**, under `objects/blocks/`, adopted by CTA first and by Hero / Newsletter / future modules after — not module-inlined fields. §5.
- **D9 ✔** — The basic rich-text block is named **`basicText`**, not `ctaContent`, because the gap it fills is generic. §6.
- **D10 ✔** — **`--shadow-card` is a new token** added to `configs/tailwind/theme.css` in both themes, as a config-layer prerequisite. §4.1.
- **D11 ✔** — #1861's `ariaLabel` fix is absorbed into this work's web layer; its sibling-module sweep becomes a separate follow-up issue. §8.1.
- **D12 ✔** — **No data migration.** Both datasets hold zero `module_cta` documents, so `action` is removed outright rather than migrated. §9 carries the evidence and the one caveat.
- **D13 ✔, revised 2026-08-29** — **Banner is full-bleed, not a contained card.** It breaks out of `Section`'s always-constrained `inner` div itself (`left-1/2 w-screen -translate-x-1/2`, plus dropping the card's border/radius/shadow), rather than modifying `Section` to support an image background — same "the module owns its presentation" principle D1 already applies to Split/Callout, extended consistently to a full-bleed case instead of only a contained one. `Section` itself needs zero changes. Split and Callout are unaffected — still contained cards. §2, §3.2a.
- **D14 ✔, 2026-08-29** — **`actionGroup` holds an array of `ctaAction` items, not named `primary`/`secondary` slots.** Reverts D8's shape half. Each item carries its own `variant` (`PRIMARY`/`SECONDARY`) and its own `appearance` — **appearance is available on both**, not hidden for `PRIMARY`. Max 2 items; a `PRIMARY` item is required and must be first; `SECONDARY` is optional; a validator enforces this (max-2 / unique variants / Primary-first) — this is the confirmed shape, and the earlier "named slots avoid a validator" reasoning (D8) was never actually confirmed against an unresolved `AskUserQuestion` answer. Requires a new config-layer constant, `CTA_ACTION_VARIANT`, not shipped in #2301. §5. **#2309/PR #2312 shipped the named-slots version before this correction — that work is being reverted and rebuilt.**
- **D5a ✔, resolved 2026-08-29** — Centered Callout lists left-align inside the centered block. The mock already implements this (its `.cta--stack .cta__text ul` rule), and #2304's ui-layer build matched it during visual verification against the mock rather than leaving the recommended-but-technically-open option unimplemented. §6.
- **D15 ✔, 2026-08-29** — **`ActionGroup` gains an `onDark` prop**, discovered during #2304's own visual verification against the mock: Banner reverses its `ghost`/`link`-appearance button colors to white, but `CtaModule`'s `actions` prop is an opaque `ReactNode` and structurally cannot recolor what web already built (and must not gain that ability — D1/D8 keep link/button construction out of `packages/ui`). `cta-module-view.tsx` passes `onDark={variant === CTA_VARIANT.BANNER}`; `ActionGroup` applies the reversed treatment only to non-`primary` buttons. §7.2.

**Still open:** none currently.

---

## 13. Rollout & testing

Dependency order, one PR per layer where each merges green on its own:

`config` (tokens + constants) → `studio` (schema + migration) → `service` (projection) → `ui` (`CtaModule` + `ActionGroup`) → `web` (view, closes #1861).

- **Config:** `--shadow-card` renders in both themes; new constants exported.
- **Schema:** unit-test the `actionGroup` validator (empty, primary-only, primary+secondary, secondary-only → reject) and the Banner/Split image requirement.
- **Component:** Storybook stories per variant × tone × action shape; visual check of the contained card (Split/Callout) and the full-bleed breakout (Banner) in light and dark against the mock.
- **Migration:** none — re-confirm `count(*[_type == "module_cta"])` is still 0 in both datasets immediately before the schema PR merges (§9).
- **A11y:** axe pass on each variant; manual keyboard/reading-order check that actions precede a decorative image; the #1861 `ariaLabel` regression test must fail without the fix.

_Reference mock: `docs/design-reference/cta-module-system.html`._

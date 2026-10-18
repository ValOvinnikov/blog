---
title: Design tokens and surfaces
status: built
layers: [config, ui, web, platform]
code:
  - configs/tailwind/theme.css
  - configs/tailwind/preset.ts
  - packages/config/src/theme/theme-declarations*.ts
  - packages/config/src/theme/accent-hue-guard*.ts
  - packages/utils/src/color/**
  - packages/ui/src/lib/styling/item-card.ts
  - packages/ui/src/lib/styling/header-control.ts
  - packages/ui/src/lib/design-tokens/**
  - packages/ui/index.css
  - apps/web/index.css
epics: [4987, 4990, 4991, 4994, 4996, 4997, 4858, 5459]
---

# Design tokens and surfaces

## What it does

The public site and `@blog/ui` draw every colour, size, radius, spacing step, shadow and duration from one token layer, `configs/tailwind/theme.css`, through Tailwind utilities. A tenant's Look overrides a fixed subset of those tokens at runtime; everything else is the same on every site. Coloured bands and cards set a few inherited properties, so focus-ring offsets, dividers and item-card frames match the surface they sit on without any component prop.

## Surfaces and routes

- No route. Every public page and every `@blog/ui` component consumes the tokens.
- `packages/ui`'s Storybook has a design-tokens story that parses `theme.css` (`token-registry.ts`, the `@role` comments) and renders colour, type, radius, spacing, layout and motion tables.
- Editors reach surfaces only through a module's `brandVariant` field in Studio (`PRIMARY`, `SECONDARY`, `BRAND_PRIMARY`), which picks the band `Section` paints.
- `apps/platform` keeps its own `--admin-*` token layer (`apps/platform/src/styles/admin-theme.css`). It imports `theme.css` for the Tailwind base and for the site preview components.

## Data

Nothing is stored; these are static CSS and TypeScript tables.

- **`@theme inline`** — semantic colour utilities (`bg-surface`, `text-text-muted`, `border-divider`, `ring-offset-ambient`, `bg-brand-primary-solid`, status `success`/`warn`/`error`/`info` and their `-muted` tints, `on-image`), `shadow-card`, `shadow-float`, and the font stacks. Each emits `var(--…)` rather than a literal.
- **`@theme`** — radius steps plus role radii (`--radius-card` → `--radius-md`, `--radius-media` → `--radius-lg`, `--radius-item` → `--item-radius`); containers; layout spacing (`gutter`, `section`, `page-y`, `site-x/y`, `card-x/y`, `card-gap`, and the `band` step with its `sm`–`xl` ladder); the type scale (`title-*`, `prose-*`, `card-*`, `meta`, `label`, `code`, …); tracking; easing.
- **`:root`, with `.dark` overrides** — page neutrals (`primary`, `primary-subtle`, `secondary`, `surface`, `surface-2`), borders (`border`, `border-strong`, `border-emphasis`), ink (`text`, `text-muted`), the brand ramp, `ring`, status colours, logo steps, shadows, durations, the on-image and scrim tokens, the five `--item-*` card properties, the two header-control properties (`--header-control-border` → `--border-strong`, `--header-control-fill` → `--surface`, with no `.dark` copy), and `--ambient`/`--divider`/`--field-boundary`.
- **`@blog/config` theme tables** (`theme-declarations.ts`) — `ACCENT_RAMP_LIGHT/DARK`, `LOGO_RAMP_LIGHT/DARK` and `IMAGE_SCRIM_RAMP` as OKLCH stops with fixed lightness and chroma, plus `RADIUS_DECLARATIONS`, `DENSITY_DECLARATIONS` and `CARD_STYLE_DECLARATIONS`. `formatOklchRamp` fills in the tenant's hue.
- **Colour maths** — `@blog/utils/color`: `renderedContrastRatio` (culori, OKLCH in, the worse of gamut mapping and clipping into sRGB), `oklchToHex`, `WCAG_AA_CONTRAST_MIN` (4.5).

## Configuration

- **Tenant (Look)** — the accent hue drives five of the six `--brand-primary*` tokens (`-contrast` is fixed) and the brand scrims. The logo hue drives `--logo-1..3`. The radius scale sets the five radius steps, density the nine layout spacing tokens, and card style the five `--item-*` properties. Neutrals, ink, status colours, the type scale, shadows and motion are fixed for every tenant. See [look](./look.md).
- **Dark mode** — a `.dark` class on `<html>`, set before hydration by an inline script from `localStorage.theme` or `prefers-color-scheme`. `@custom-variant dark` matches `.dark` or any descendant, so a story can scope it to a wrapper.
- No plan gating and no Voice reach.

## Constraints and invariants

- **Surfaces set, components read.** `--ambient` (default `var(--primary)`, read by `ring-offset-ambient`), `--divider` (default `var(--border)`, read by `border-divider`) and `--field-boundary` (default `var(--border-emphasis)`, read by `border-field-boundary`/`bg-field-boundary`) are inherited. Four utilities retarget them:
  - `surface-secondary`: ambient → `secondary`, divider → `border-strong`, field boundary → `field-boundary-tinted`.
  - `surface-brand-primary`: ambient → `brand-primary-muted`, divider → `border-strong`, field boundary → `field-boundary-tinted`.
  - `surface-card`: ambient → `surface`, divider → `border`.
  - `surface-nested`: ambient → `surface-2`, divider → `border-strong`.
- **Brand tint follows the surface.** `bg-tint` reads `--tint`, falling back to `brand-primary-muted`. `surface-brand-primary` sets `--tint` to a 10% mix toward `brand-primary`, so a hovered or focused card, a `MediaCard` icon tile and a linked `LogoTile` never take a Brand primary band's own colour; Primary and Secondary bands are unchanged. `surface-tint` points `--ambient` at that tint, with the band's divider and field boundary, for a card whose focus fill it is (`TaxonomyCard`).
- **Who applies them.** `apps/web`'s `Section` per `brandVariant`; `CtaModule`, `Footer` and the banner styling; every `bg-surface` card root (`Panel`, `PricingCard`, `Toast`, the `PopoverMenu` panel, item cards); and the `bg-surface-2` roots that hold focusable content (`MediaFrame`, `Aside`, `Panel.Header`, the compact `NewsletterSignup`). Image and scrim surfaces set neither.
- **`inline` is load-bearing.** A non-inline `@theme` would bake the `:root` value into the utility, and an ancestor's override would do nothing.
- **No `tone` prop, no context.** Everything stays server-renderable, and dark mode follows because the defaults are references.
- **Radius by role, never by step.** Bounded cards use `rounded-card`, media frames `rounded-media`, and item cards the `item-card` utility's `--radius-item`. Controls and pills keep plain steps (`rounded-sm`, `rounded-full`).
- **Item cards.** `item-card` draws a solid border from `--item-border-width`, a left accent from `--item-accent-width/color`, a `--surface` fill and `--item-shadow`. `ACCENT_BAR` (the static default) is square with a 2px brand bar; `OUTLINED` is a 1px hairline at `--radius-md`. Both have no shadow. `INTERACTIVE_ITEM_CARD` adds the `bg-tint` fill on hover and focus-within.
- **Link underline.** Prose links, the `link` `Button` and a linked `QuoteCard.Name` draw one native `text-decoration` underline from `LINK_UNDERLINE` (`packages/ui/src/lib/styling/link-underline.ts`): a `0.2em` offset that clears descenders, 1px at rest and 2px on hover, with `text-decoration-skip-ink: auto`. `LINK_UNDERLINE_EMPHASIS` is the 2px weight on its own, for a current-page link. Callers set only the colour. Never a border or background image: those break on a wrapped link and vanish under forced colours.
- **Elevation.** `shadow-card` is for raised cards (`Panel`, the highlighted `PricingCard`, the `CtaModule` card); `shadow-float` is for chrome above the page (`Toast`, `PopoverMenu`, `Dialog`).
- **Header controls.** `HEADER_CONTROL_FRAME` (`packages/ui/src/lib/styling/header-control.ts`) is a round 1px frame whose resting border and fill are `border-header-control` and `bg-header-control-fill`. `HEADER_CONTROL` adds ink text, a brand border and content on hover and while `aria-expanded`, a focus ring that leaves the fill unchanged, and a `Highlight` outline on hover and open in forced colours. IconButton's `circle` is built on it. Restyling every header control means setting the two properties, never changing a class.
- **Dividers.** Dividers on secondary and brand bands use `border-strong`, which is decorative and below 3:1 on purpose. `--border-emphasis` (3.29:1 light, 3.73:1 dark against `primary-subtle`) is the token for a border that is the only indicator.
- **Control boundaries.** An enabled `TextInput`'s border and an off `Switch`'s track use `field-boundary`, which reaches 3:1 (WCAG 1.4.11) against the `surface` field fill and against the band behind it on every brand variant, in both modes and at every accent hue: `border-emphasis` on page and card surfaces, and the darker (light) or lighter (dark) `--field-boundary-tinted` on secondary and brand bands, where `border-emphasis` falls short. A disabled `TextInput` drops to `border-strong`, since inactive controls are exempt.
- **The accent and logo hues are the only tenant colour inputs.** Ramp lightness and chroma never vary, so a token pair's contrast depends on the hue alone. `isAccentHueAccessible` checks one pair (`--text` on `--brand-primary-muted`, both modes) and accepts every hue. Every other checked pair, the field boundary included, is registered in `CONTRAST_PAIRS` (`packages/config/src/theme/contrast-pairs.ts`) with its role minimum; `contrast-check.test.ts` measures each one on every surface it lists, in both modes and at every hue, and fails `pnpm verify` on any shortfall not recorded in `contrast-known-failures.ts`.
- **Focus under forced colours.** Components draw focus as a `ring` and drop the outline with `focus-visible:outline-none`; Windows High Contrast discards the ring's box-shadow. An unlayered `@media (forced-colors: active)` rule in `theme.css` restores a 2px `Highlight` outline on every `:focus-visible`, on the site and in the admin. It must stay outside `@layer`, since any layered rule loses to `@layer utilities`. Outside forced colours it does nothing.
- **`text-subtle` is `text-muted`.** The `text-subtle` and `subtle` utilities resolve to `--text-muted`; there is no separate dimmer ink, because no lighter grey reaches 4.5:1 on every surface. Size and font carry the lower step in the hierarchy.
- **Static defaults equal Console.** `theme.css`'s static values equal `buildThemeStyleBlock`'s Console output (`MD`, `DEFAULT`, `ACCENT_BAR`, hue 250), and a test reads `theme.css` for the radius, spacing, item-card and scrim tokens and checks the brand and logo ramps against fixed literals. Changing a static token means changing its declaration table too.
- The platform preview re-derives `--radius-card`, `--radius-media` and `--radius-item`, because `@theme` derives them on `:root`.
- Email cannot read CSS variables, so `resolveTenantEmailBrand` converts the light-mode ramps (`NEUTRAL_RAMP_LIGHT`, `ACCENT_RAMP_LIGHT`, `LOGO_RAMP_LIGHT`) to hex literals; a ramp change reaches tenant emails with no other edit.
- A consuming app adds its own tokens only for a dependency no other workspace uses (`apps/web/index.css`'s `--code-*` syntax colours). Shared tokens belong in `theme.css`.

## Dependencies

- Layers: `config` (theme tables, guard; `utils` colour maths), `ui` (every component), `web` (`Section`, `ThemeScope`), `platform` (preview).
- Features: [look](./look.md), [module-system](./module-system.md) (`brandVariant` bands), [heroes](./heroes.md) and [cta-module](./cta-module.md) (scrim and banner surfaces), [email](./email.md), [platform-shell](./platform-shell.md) (admin tokens).
- Env: none.

## Entry points

- `configs/tailwind/theme.css`
- `packages/config/src/theme/theme-declarations.ts`
- `packages/config/src/theme/accent-hue-guard.ts`
- `packages/utils/src/color/oklch.ts`
- `packages/ui/src/lib/styling/item-card.ts`
- `packages/ui/src/lib/styling/header-control.ts`
- `packages/ui/src/lib/styling/link-underline.ts`
- `apps/web/src/components/shared/section/section-variants.ts`
- `apps/web/src/utils/build-theme-style-block/build-theme-style-block.ts`
- `apps/web/src/config/theme-script.ts`
- `packages/ui/src/lib/design-tokens/token-registry.ts`

## Tests and stories

- `packages/config/src/theme/theme-declarations.test.ts`, `accent-hue-guard.test.ts`
- `packages/utils/src/color/oklch.test.ts`
- `apps/web/src/utils/build-theme-style-block/build-theme-style-block.test.ts` (Console parity with `theme.css`)
- `packages/ui/src/lib/design-tokens/parse-theme-tokens.test.ts`, `token-registry.test.ts`
- Stories: `packages/ui/src/lib/design-tokens/design-tokens.stories.tsx`, `apps/web/src/components/shared/section/section.stories.tsx`, `apps/web/src/components/shared/theme-scope/theme-scope.stories.tsx`, the `OnBands` stories of `TextInput` and `Switch`, the descenders-and-wrapping stories of `TextLink`, `Button` and `QuoteCard` (`packages/ui/src/testing/surface-bands.tsx`), and every `@blog/ui` component's stories across the bands.

## Related

- #4987 — epic: accessible, correctly rendered text and colour on the public site.
- #4990 — a contrast-pair registry checked over every hue, mode and card style.
- #4991 — brand and metadata colours reach AA at every accent hue (ramp retune, `text-subtle`).
- #4994 — text-field and switch boundaries reach 3:1 on every band (a field-boundary role token).
- #4996 — label-size text at the owner's chosen readable floor.
- #4997 — CI renders every module per band, theme and mode and fails on a contrast regression.
- #4858 — card hover stays visible on a Brand primary band.

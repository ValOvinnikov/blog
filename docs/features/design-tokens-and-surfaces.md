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
  - packages/ui/src/lib/design-tokens/**
  - packages/ui/index.css
  - apps/web/index.css
epics: [4987, 4990, 4991, 4994, 4996, 4997, 4858]
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
- **`:root`, with `.dark` overrides** — page neutrals (`primary`, `primary-subtle`, `secondary`, `surface`, `surface-2`), borders (`border`, `border-strong`, `border-emphasis`), ink (`text`, `text-muted`, `text-subtle`), the brand ramp, `ring`, status colours, logo steps, shadows, durations, the on-image and scrim tokens, the five `--item-*` card properties, and `--ambient`/`--divider`.
- **`@blog/config` theme tables** (`theme-declarations.ts`) — `ACCENT_RAMP_LIGHT/DARK`, `LOGO_RAMP_LIGHT/DARK` and `IMAGE_SCRIM_RAMP` as OKLCH stops with fixed lightness and chroma, plus `RADIUS_DECLARATIONS`, `DENSITY_DECLARATIONS` and `CARD_STYLE_DECLARATIONS`. `formatOklchRamp` fills in the tenant's hue.
- **Colour maths** — `@blog/utils/color`: `wcagContrastRatio` (culori, OKLCH in, no gamut mapping), `oklchToHex`, `WCAG_AA_CONTRAST_MIN` (4.5).

## Configuration

- **Tenant (Look)** — the accent hue drives five of the six `--brand-primary*` tokens (`-contrast` is fixed) and the brand scrims. The logo hue drives `--logo-1..3`. The radius scale sets the five radius steps, density the nine layout spacing tokens, and card style the five `--item-*` properties. Neutrals, ink, status colours, the type scale, shadows and motion are fixed for every tenant. See [look](./look.md).
- **Dark mode** — a `.dark` class on `<html>`, set before hydration by an inline script from `localStorage.theme` or `prefers-color-scheme`. `@custom-variant dark` matches `.dark` or any descendant, so a story can scope it to a wrapper.
- No plan gating and no Voice reach.

## Constraints and invariants

- **Surfaces set, components read.** `--ambient` (default `var(--primary)`, read by `ring-offset-ambient`) and `--divider` (default `var(--border)`, read by `border-divider`) are inherited. Four utilities retarget them:
  - `surface-secondary`: ambient → `secondary`, divider → `border-strong`.
  - `surface-brand-primary`: ambient → `brand-primary-muted`, divider → `border-strong`.
  - `surface-card`: ambient → `surface`, divider → `border`.
  - `surface-nested`: ambient → `surface-2`, divider → `border-strong`.
- **Who applies them.** `apps/web`'s `Section` per `brandVariant`; `CtaModule`, `Footer` and the banner styling; every `bg-surface` card root (`Panel`, `PricingCard`, `Toast`, the `PopoverMenu` panel, item cards); and the `bg-surface-2` roots that hold focusable content (`MediaFrame`, `Aside`, `Panel.Header`, the compact `NewsletterSignup`). Image and scrim surfaces set neither.
- **`inline` is load-bearing.** A non-inline `@theme` would bake the `:root` value into the utility, and an ancestor's override would do nothing.
- **No `tone` prop, no context.** Everything stays server-renderable, and dark mode follows because the defaults are references.
- **Radius by role, never by step.** Bounded cards use `rounded-card`, media frames `rounded-media`, and item cards the `item-card` utility's `--radius-item`. Controls and pills keep plain steps (`rounded-sm`, `rounded-full`).
- **Item cards.** `item-card` draws a solid border from `--item-border-width`, a left accent from `--item-accent-width/color`, a `--surface` fill and `--item-shadow`. `ACCENT_BAR` (the static default) is square with a 2px brand bar; `OUTLINED` is a 1px hairline at `--radius-md`. Both have no shadow. `INTERACTIVE_ITEM_CARD` adds a `brand-primary-muted` tint on hover and focus-within.
- **Elevation.** `shadow-card` is for raised cards (`Panel`, the highlighted `PricingCard`, the `CtaModule` card); `shadow-float` is for chrome above the page (`Toast`, `PopoverMenu`, `Dialog`).
- **Dividers.** Dividers on secondary and brand bands use `border-strong`, which is decorative and below 3:1 on purpose. `--border-emphasis` (3.29:1 light, 3.73:1 dark against `primary-subtle`) is the token for a border that is the only indicator.
- **The accent and logo hues are the only tenant colour inputs.** Ramp lightness and chroma never vary, so a token pair's contrast depends on the hue alone. `isAccentHueAccessible` checks one pair (`--text` on `--brand-primary-muted`, both modes) and accepts every hue. No other token pair is checked automatically; the measured ratios live as comments in `theme.css`.
- `--text-subtle` measures under 4.5:1 on most surfaces. `theme.css` records it as accepted for low-emphasis metadata.
- **Static defaults equal Console.** `theme.css`'s static values equal `buildThemeStyleBlock`'s Console output (`MD`, `DEFAULT`, `ACCENT_BAR`, hue 250), and a test reads `theme.css` for the radius, spacing, item-card and scrim tokens and checks the brand and logo ramps against fixed literals. Changing a static token means changing its declaration table too.
- The platform preview re-derives `--radius-card`, `--radius-media` and `--radius-item`, because `@theme` derives them on `:root`.
- Email cannot read CSS variables, so `resolveTenantEmailBrand` writes hex literals from its own copy of the light-mode recipes.
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
- `apps/web/src/components/shared/section/section-variants.ts`
- `apps/web/src/utils/build-theme-style-block/build-theme-style-block.ts`
- `apps/web/src/config/theme-script.ts`
- `packages/ui/src/lib/design-tokens/token-registry.ts`

## Tests and stories

- `packages/config/src/theme/theme-declarations.test.ts`, `accent-hue-guard.test.ts`
- `packages/utils/src/color/oklch.test.ts`
- `apps/web/src/utils/build-theme-style-block/build-theme-style-block.test.ts` (Console parity with `theme.css`)
- `packages/ui/src/lib/design-tokens/parse-theme-tokens.test.ts`, `token-registry.test.ts`
- Stories: `packages/ui/src/lib/design-tokens/design-tokens.stories.tsx`, `apps/web/src/components/shared/section/section.stories.tsx`, `apps/web/src/components/shared/theme-scope/theme-scope.stories.tsx`, and every `@blog/ui` component's stories across the bands.

## Related

- #4987 — epic: accessible, correctly rendered text and colour on the public site.
- #4990 — a contrast-pair registry checked over every hue, mode and card style.
- #4991 — brand and metadata colours reach AA at every accent hue (ramp retune, `text-subtle`).
- #4994 — text-field and switch boundaries reach 3:1 on every band (a field-boundary role token).
- #4996 — label-size text at the owner's chosen readable floor.
- #4997 — CI renders every module per band, theme and mode and fails on a contrast regression.
- #4858 — card hover stays visible on a Brand primary band.

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
  - packages/ui/src/lib/styling/nav-link.ts
  - packages/ui/src/lib/design-tokens/**
  - packages/ui/index.css
  - apps/web/index.css
  - apps/platform/src/styles/admin-theme.css
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
- Admin tokens for the onboarding surfaces, in that file:
  - `--text-admin-28` (28px, `text-admin-28`): the wizard's step heading.
  - `--radius-admin-bar` (2px, `rounded-admin-bar`): progress segments and preset mini bars; the one 2px radius in the admin.
  - Six dark `rail` colours, as `admin-rail*` utilities: `--admin-rail` #0f1115 (the rail, the phone header and the Choose a workspace rail), `--admin-rail-line` #1c1f26 (rail borders and rules), `--admin-rail-text` #c9cfda (body text on the rail), `--admin-rail-muted` #7d8696 (upcoming steps, summaries), `--admin-rail-raised` #20242e (the current row, upcoming segments, hovers), `--admin-rail-accent` #a5b4fc (done circles and segments, the current ring).
  - The `rail` colours are the same in Light and Dark and never follow the admin theme, unlike the sidebar's `side` tokens they were copied from. `tv()` lists `admin-28` and `admin-bar` so a later `text-admin-28` or `rounded-admin-bar` replaces an earlier admin size or radius.

## Data

Nothing is stored; these are static CSS and TypeScript tables.

- **`@theme inline`** — semantic colour utilities (`bg-surface`, `text-text-muted`, `border-divider`, `ring-offset-ambient`, `bg-brand-primary-solid`, status `success`/`warn`/`error`/`info` and their `-muted` tints, `on-image`), `shadow-card`, `shadow-float`, and the font stacks. Each emits `var(--…)` rather than a literal.
- **`@theme`** — radius steps plus role radii (`--radius-card` → `--radius-md`, `--radius-media` → `--radius-lg`, `--radius-item` → `--item-radius`); containers; layout spacing (`gutter`, `section`, `page-y`, `site-x/y`, `card-x/y`, `card-gap`, and the `band` step with its `sm`–`xl` ladder); the type scale (`title-*`, `prose-*`, `card-*`, `meta`, `label`, `code`, …); tracking; easing.
- **`:root`, with `.dark` overrides** — page neutrals (`primary`, `primary-subtle`, `secondary`, `surface`, `surface-2`), borders (`border`, `border-strong`, `border-emphasis`), ink (`text`, `text-muted`), the brand ramp, `ring`, status colours, logo steps, shadows, durations, the on-image and scrim tokens, the seven `--item-*` card-style properties, the two header-control properties (`--header-control-border` → `--border-strong`, `--header-control-fill` → `--surface`, with no `.dark` copy), the navigation-link properties at their Plain values (`--nav-link-fill` and `--nav-link-outline: transparent`, `--nav-link-decoration: none`, `--nav-link-padding-x`/`-y: 0px`; `--nav-link-radius` is left unset so `rounded-nav-link` falls back to the nearest `--radius-sm`), and `--ambient`/`--divider`/`--field-boundary`.
- **`@blog/config` theme tables** (`theme-declarations.ts`) — `ACCENT_RAMP_LIGHT/DARK`, `LOGO_RAMP_LIGHT/DARK` and `IMAGE_SCRIM_RAMP` as OKLCH stops with fixed lightness and chroma, plus `RADIUS_DECLARATIONS`, `DENSITY_DECLARATIONS` and `CARD_STYLE_DECLARATIONS`. `formatOklchRamp` fills in the tenant's hue.
- **Colour maths** — `@blog/utils/color`: `renderedContrastRatio` (culori, OKLCH in, the worse of gamut mapping and clipping into sRGB), `oklchToHex`, `WCAG_AA_CONTRAST_MIN` (4.5).

## Configuration

- **Tenant (Look)** — the accent hue drives five of the six `--brand-primary*` tokens (`-contrast` is fixed) and the brand scrims. The logo hue drives `--logo-1..3`. The radius scale sets the five radius steps on a 4px base step — `--radius`/`--radius-md` 4, 8, 12 or 16px for Small to Extra Large, with `--radius-sm` at half, `--radius-lg` at 1.5× and `--radius-xl` at 2× the base (Medium is the static default), density the nine layout spacing tokens, and card style the seven `--item-*` properties. Neutrals, ink, status colours, the type scale, shadows and motion are fixed for every tenant. See [look](./look.md).
- **Dark mode** — a `.dark` class on `<html>`, set before hydration by an inline script from `localStorage.theme` or `prefers-color-scheme`. `@custom-variant dark` matches `.dark` or any descendant, so a story can scope it to a wrapper.
- No plan gating and no Voice reach.

## Constraints and invariants

- **Surfaces set, components read.** `--ambient` (default `var(--primary)`, read by `ring-offset-ambient`), `--divider` (default `var(--border)`, read by `border-divider`) and `--field-boundary` (default `var(--border-emphasis)`, read by `border-field-boundary`/`bg-field-boundary`) are inherited. Four utilities retarget them:
  - `surface-secondary`: ambient → `secondary`, divider → `border-strong`, field boundary → `field-boundary-tinted`, item fill → `brand-primary-muted`.
  - `surface-brand-primary`: ambient → `brand-primary-muted`, divider → `border-strong`, field boundary → `field-boundary-tinted`, item fill → `--tint`.
  - `surface-card`: ambient → `surface`, divider → `border`.
  - `surface-nested`: ambient → `surface-2`, divider → `border-strong`.
- **Brand tint follows the surface.** `bg-tint` reads `--tint`, falling back to `brand-primary-muted`. `surface-brand-primary` sets `--tint` to a 10% mix toward `brand-primary`, so a hovered or focused card, a `MediaCard` icon tile and a linked `LogoTile` never take a Brand primary band's own colour; Primary and Secondary bands are unchanged. `surface-tint` points `--ambient` at that tint, with the band's divider and field boundary, for a card whose focus fill it is (`TaxonomyCard`).
- **Who applies them.** `apps/web`'s `Section` per `brandVariant`; `CtaModule`, `Footer` and the banner styling; every `bg-surface` card root (`Panel`, `PricingCard`, `Toast`, the `PopoverMenu` panel, item cards, `Accordion` items); and the `bg-surface-2` roots that hold focusable content (`MediaFrame`, `Aside`, `Panel.Header`, the compact `NewsletterSignup`). Image and scrim surfaces set neither.
- **`inline` is load-bearing.** A non-inline `@theme` would bake the `:root` value into the utility, and an ancestor's override would do nothing.
- **No `tone` prop, no context.** Everything stays server-renderable, and dark mode follows because the defaults are references.
- **Radius by role, never by step.** Bounded cards and tables use `rounded-card`, media frames `rounded-media`, and item cards the `item-card` utility's `--radius-item`. Button-like controls use `rounded-button`; other controls and pills keep plain steps (`rounded-sm`, `rounded-full`).
- **Button shape.** `rounded-button` reads `--radius-button`, which `BUTTON_SHAPE_DECLARATIONS` sets to `0` (Square), `var(--radius-sm)` (Rounded) or `9999px` (Pill); every preset defaults to Rounded. The public site declares the stored `site_config.button_shape` under `:root`, beside the radius scale (a `FREE` site renders its preset's Rounded). It is a `theme.css` `@utility`, not an `@theme` token, and falls back to `var(--radius-sm)` at the element, so with no declaration it follows the nearest radius scale, the platform preview's frame included. Its readers: Button and LinkButton (a busy button's progress edge inherits the corners), `FIELD_CONTROL` (TextInput, Textarea), Tag, StatusBadge, BookmarkToggle, the sign-in provider button, IconButton's default and `bordered` corners, SegmentedControl's root and options, PopoverMenu's `bordered` and `outlined` items, and Toast's action button. Header controls, IconButton's `circle`/`avatar`/`control`, avatars, text links, plain menu rows and the focus ring do not read it.
- **Navigation links.** `NAV_LINK` (`packages/ui/src/lib/styling/nav-link.ts`) styles first-level header links and the sub-menu trigger beside them, and nothing else: footer links, language codes, sub-menu items and phone-menu rows never read it. It applies `rounded-nav-link` (`--nav-link-radius`) and `--nav-link-padding-x`/`-y`; the `nav-link-marked` utility (`--nav-link-fill` background and a 1px `--nav-link-outline`) on hover, on the current page and on an open sub-menu trigger; and `nav-link-current` (`--nav-link-decoration`) on the current page only. `NAV_LINK_CURRENT` marks an active sub-menu trigger, which carries no `aria-current`. In forced colours `nav-link-marked` draws a `CanvasText` outline, since the fill and a transparent outline drop. The dropdown panel's anchor offsets subtract the link's padding, so it sits where it does for an unpadded trigger. `NAV_LINK_STYLE_DECLARATIONS` sets Plain (nothing — today's look, every preset's default), Underline (a 2px line under the current link; hover only changes colour), Soft (a `--brand-primary-muted` fill at `--radius-md`) and Pill (a `--brand-primary` outline at `RADIUS_PILL`, shared with Pill buttons, and no fill). The public site declares the stored `site_config.nav_link_style` under `:root`, beside the radius scale (a `FREE` site renders its preset's Plain). The current link keeps its brand colour and weight under every style. The contrast guard checks `--text`, `--brand-primary` and `--brand-primary-hover` on `--nav-link-fill` under each style; `NAV_LINK_OUTLINE` holds Pill's outline to 3:1 against `--primary`, and a style whose outline is transparent is skipped.
- **Item cards.** `item-card` draws a solid border from `--item-border-width`, a left accent bar from `--item-accent-width/color`, a fill and `--item-shadow`. The fill mixes `--surface` toward `--item-fill` by `--item-fill-mix`. A band owns `--item-fill`, the tint a filled card takes on it: `surface-secondary` sets `brand-primary-muted`, `surface-brand-primary` its `--tint`, the page ground falls back to `brand-primary-muted`, and `surface-popover` unsets it. Card style sets only the `--item-fill-mix` switch, because a `var()` inside a custom property resolves where it is declared, so a colour declared on `:root` would ignore the band. The result is mixed toward `transparent` by `--item-clear-mix`, so `PLAIN` paints no background. An item card nested in another takes a fill one step deeper (the band's tint mixed 10% toward `--brand-primary`), so a filled card never matches its filled parent. `--item-divider-width` draws a top border on every accordion item and a bottom border on the last, at the wider of it and `--item-border-width`, so a style with no frame still draws lines above, between and below its items; `--item-stack-gap` and `--item-stack-radius` set the accordion's item gap and corners, both `0px` under `PLAIN` so its dividers stay straight. The bar is an `::after` over the left border's straight run, between the corners, so it stays straight on a rounded card. It is drawn as that `::after`'s left border rather than a fill, so forced colours keep it as a system-colour line, and a focused stretched link raises its ring above it. `ACCENT_BAR` (the static default) is borderless with a 2px brand bar; `OUTLINED` is a 1px hairline whose bar matches the border; `FILLED` has no outline and takes the band's tint (`--item-fill-mix: 100%`); `RAISED` is the hairline plus `--shadow-card`; `PLAIN` has no outline, fill or shadow and draws a 1px accordion divider. All round at `--radius-md`. `Accordion` items are item cards too, with the trigger and answer inside the `card-x`/`card-y` padding. `INTERACTIVE_ITEM_CARD` adds `bg-item-hover` on hover and focus-within: the band's tint, or under `FILLED`, which rests on that tint, `--surface` mixed halfway toward it (`--item-hover-mix: 50%`). A card's quiet title link hovers to `brand-primary-hover`, which holds 4.5:1 on that tint in both schemes; `brand-primary` does not in dark.
- **Link underline.** Prose links, the `link` `Button` and a linked `QuoteCard.Name` draw one native `text-decoration` underline from `LINK_UNDERLINE` (`packages/ui/src/lib/styling/link-underline.ts`): a `0.2em` offset that clears descenders, 1px at rest and 2px on hover, with `text-decoration-skip-ink: auto`. `LINK_UNDERLINE_EMPHASIS` is the 2px weight on its own, for a current-page link. Callers set only the colour. Never a border or background image: those break on a wrapped link and vanish under forced colours.
- **Elevation.** `shadow-card` is for raised cards (`Panel`, the highlighted `PricingCard`); `shadow-float` is for chrome above the page (`Toast`, `PopoverMenu`, `Dialog`).
- **Header controls.** `HEADER_CONTROL_FRAME` (`packages/ui/src/lib/styling/header-control.ts`) is a round 1px frame whose resting border and fill are `border-header-control` and `bg-header-control-fill`. `HEADER_CONTROL` adds ink text, a brand border and content on hover and while `aria-expanded`, a focus ring that leaves the fill unchanged, and a `Highlight` outline on hover and open in forced colours. IconButton's `circle` is built on it. Restyling every header control means setting the two properties, never changing a class.
- **Dividers.** Dividers on secondary and brand bands use `border-strong`, which is decorative and below 3:1 on purpose. `--border-emphasis` (3.29:1 light, 3.73:1 dark against `primary-subtle`) is the token for a border that is the only indicator.
- **Control boundaries.** An enabled `TextInput`'s border and an off `Switch`'s track use `field-boundary`, which reaches 3:1 (WCAG 1.4.11) against the `surface` field fill and against the band behind it on every brand variant, in both modes and at every accent hue: `border-emphasis` on page and card surfaces, and the darker (light) or lighter (dark) `--field-boundary-tinted` on secondary and brand bands, where `border-emphasis` falls short. A disabled `TextInput` drops to `border-strong`, since inactive controls are exempt.
- **The accent and logo hues are the only tenant colour inputs.** Ramp lightness and chroma never vary, so a token pair's contrast depends on the hue alone. `isAccentHueAccessible` checks one pair (`--text` on `--brand-primary-muted`, both modes) and accepts every hue. Every other checked pair, the field boundary included, is registered in `CONTRAST_PAIRS` (`packages/config/src/theme/contrast-pairs.ts`) with its role minimum; `contrast-check.test.ts` measures each one on every surface it lists, in both modes and at every hue, and fails `pnpm verify` on any shortfall not recorded in `contrast-known-failures.ts`.
- **Focus under forced colours.** Components draw focus as a `ring` and drop the outline with `focus-visible:outline-none`; Windows High Contrast discards the ring's box-shadow. An unlayered `@media (forced-colors: active)` rule in `theme.css` restores a 2px `Highlight` outline on every `:focus-visible`, on the site and in the admin. It must stay outside `@layer`, since any layered rule loses to `@layer utilities`. Outside forced colours it does nothing.
- **Type scale in even pixels.** At a 16px root every fixed text size, and every fluid size's smallest and largest value, is an even number of pixels, and body and reading text (`text-base`, `text-prose`) is 16px. Fixed: `label`, `xs` and `meta` 12; `sm`, `copy`, `caption`, `code` and `card-copy` 14; `lead`, `card-title`, `base` and `prose` 16; `lg` 20. Fluid, smallest–largest: `prose-h4` 18–20, `prose-h3` 20–24, `xl` 22–26, `prose-h2` 24–30, `title-section` 26–32, `2xl`/`title-2xl` 28–36, `post-title` 30–40, `hero` 32–48, `3xl` 34–48, `4xl` 38–54, `display`/`wordmark` 42–74. A size change re-solves the clamp's middle term so it still spans the same viewport range. The admin's `text-admin-*` scale is separate.
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
- `packages/ui/src/lib/styling/nav-link.ts`
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

---
title: Pricing module
status: built
layers: [config, studio, service, ui, web]
code:
  - packages/config/src/constants/price-period.ts
  - packages/studio/src/schema-types/modules/pricing/**
  - packages/studio/src/schema-types/objects/pricing-*/**
  - packages/studio/src/schema-types/validation/validate-pricing-*/**
  - packages/service/src/features/modules/pricing/**
  - packages/ui/src/components/molecules/pricing-card/**
  - packages/ui/src/components/organisms/pricing-card-grid/**
  - apps/web/src/modules/pricing/**
  - apps/web/src/utils/to-pricing-panels/**
  - apps/web/src/utils/format-price-amount/**
  - apps/web/src/testing/modules/pricing/**
epics: [5047, 5028]
---

# Pricing module

## What it does

An editor sells an offer with a table of up to four plans. Each tier has a name, a line on who it is for, one or more prices (or a label such as "Contact us"), a feature list, its own actions, an optional recommendation badge and a footnote. When the tiers carry both monthly and yearly prices, readers get a Monthly/Yearly switch. Every tier, price and feature is written by the editor in Studio; nothing is read from the platform's plans.

## Surfaces and routes

- **Studio** — `module_pricing` ("Pricing") under Modules → **Conversion**, beside CTA and Newsletter. The currency is set once in **Site Settings** (`settings_site.currency`).
- **Public site** — on the home page (`/`) and landing pages (`/[...slug]`) (`template_home`, `template_landing`).
- No platform surface.

## Data

- **`module_pricing`** — `title`, `brandVariant`, `headingBlock`, `tiers[]` (`pricingTier`), `footnote` (per language), `ctaButtons`, `contentAlignment` (Left or Center), `layout` (`wideLayout`).
- **`pricingTier`** — `name`, `description`, `priceLabel`, `highlightLabel` and `footnote` (each per-language one line), `prices[]` (`pricingPrice`), `features[]` (`pricingFeature`: one per-language `text`; the list itself is shared by every language), `ctaButtons`.
- **`pricingPrice`** — `period` (`PRICE_PERIOD`: `ONE_TIME`, `HOUR`, `SESSION`, `MONTH`, `YEAR`), `amount` (number, ≥ 0, two decimals), `compareAtAmount` (optional, struck through), `isStartingAt` (shows "From").
- **Service** — `getPricingModule` returns `TPricingModule`. The transformer reads feature `text` through `getLocalizedField` (request language, falling back to the default language) and drops a feature with text in neither, trims `highlightLabel` (blank means not highlighted) and reads `isStartingAt` as false when unset.
- **Web** — `PricingModule` also reads Site Settings for the currency and the `pricingModule.*` catalogue for "Free", "From", "Regular price", the period suffixes and the tab labels. `toPricingPanels` turns tiers into one panel, or a Monthly and a Yearly panel, of formatted cards.
- **Caching** — the module query is tagged `modules:pricing`, `module:<id>`, `link`, `homePage` and `page_landing`; Site Settings carries its own tags ([rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors (Studio) author tiers and prices; the currency is a required Site Settings field.
- The `pricingModule.*` strings are fixed (`VOICE_FIXED_KEYS`), translated per site language, not tenant-editable ([voice](./voice.md)).
- Not plan-gated or capability-gated today ([plans-and-entitlements](./plans-and-entitlements.md)).
- Look reach: the accent hue colours the highlighted tier and the badge; radius, card style and fonts apply through tokens ([look](./look.md), [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)).

## Constraints and invariants

- 1–4 tiers; at most one tier highlighted (counted on the default-language `highlightLabel`).
- Per tier: at most three prices, each period at most once; at most 12 features; a `priceLabel` is required when the tier has no prices. A compare-at amount must exceed the amount.
- Length limits are errors: name 40, description 160, price and highlight labels 24, tier footnote 120, module footnote 160, feature 80.
- Amounts are formatted with `Intl.NumberFormat` for the request locale and the site currency, dropping `.00`. An amount of 0 reads "Free" with no period.
- The switch appears only when at least one tier has a `MONTH` price and at least one has a `YEAR` price; it opens on Monthly. On each tab a tier headlines that period's price and lists its non-recurring prices (one-time, hour, session) as extras; a tier with no price for the tab headlines its first price. Without the switch, each tier headlines its first price and lists the rest as extras.
- Both panels are server-rendered; the client `PricingPeriodSwitch` (a `SegmentedControl`) only toggles `hidden`.
- Grid columns come from the tier count: one tier is a centred narrow card, two sit side by side from `md`, three from `lg`, and four go two-up from `md` and four-up from `lg`; the cards are `PricingCard`s laid out by the module's own grid. `PricingCardGrid` exists in `@blog/ui` but the web module does not use it.
- A failed module or Site Settings fetch logs (`pricing_module.fetch_failed` / `pricing_module.site_settings_failed`) and renders nothing.

## Dependencies

- Layers: `config` (`PRICE_PERIOD`, the message catalogue), `studio`, `service`, `ui` (`PricingCard`, `SegmentedControl`), `web`.
- Features: [module-system](./module-system.md), [voice](./voice.md) (fixed catalogue keys), [languages](./languages.md), [links](./links.md) (tier and module actions), [page-types](./page-types.md), [rendering-and-caching](./rendering-and-caching.md). Unrelated to the platform's own plans ([plans-and-entitlements](./plans-and-entitlements.md)) and the front door's pricing page ([public-front-door](./public-front-door.md)).
- No env vars of its own.

## Entry points

- `packages/studio/src/schema-types/modules/pricing/pricing.ts`
- `packages/studio/src/schema-types/objects/pricing-tier/pricing-tier.ts`, `pricing-price/pricing-price.ts`, `pricing-feature/pricing-feature.ts`
- `packages/studio/src/schema-types/documents/settings/site-settings/site-settings.ts` (`currency`)
- `packages/service/src/features/modules/pricing/adaptor/query.ts`, `loader.ts`, `transformer.ts`, `types.ts`
- `packages/ui/src/components/molecules/pricing-card/pricing-card.tsx`
- `apps/web/src/modules/pricing/pricing-module.tsx`, `pricing-module-view.tsx`
- `apps/web/src/modules/pricing/components/pricing-tier-card/pricing-tier-card.tsx`, `components/pricing-period-switch/pricing-period-switch.tsx`
- `apps/web/src/utils/to-pricing-panels/to-pricing-panels.ts`, `apps/web/src/utils/format-price-amount/format-price-amount.ts`

## Tests and stories

- Studio: `validate-pricing-{compare-at-above-amount,price-periods-unique,single-highlighted-tier,tier-price-label-required}.test.ts`.
- Service: `features/modules/pricing/adaptor/{loader,query,transformer}.test.ts`.
- UI: `pricing-card.test.tsx`, `pricing-card.stories.tsx`, `pricing-card-grid.stories.tsx`.
- Web: `pricing-module.test.tsx`, `pricing-module-view.test.tsx`, `pricing-period-switch.test.tsx`, `to-pricing-panels.test.ts`, `format-price-amount.test.ts`; fixtures in `apps/web/src/testing/modules/pricing/fixtures.ts`; story `pricing-module-view.stories.tsx`.

## Related

- #5047 — epic: plans and entitlements. Proposes Pricing as a Growth module.
- #4840 — epic: platform front door (cross-reference, not an epic of this module). Its pricing page renders from `PLAN_REGISTRY` plus a price source, not from CMS-authored tiers.
- #5028 — epic: text roles. #5036 gives pricing amounts and footnotes one shared style; #5039 moves the module footnote onto the footnote role.
- #4022 — feature ticket: an editor-chosen, per-language price period suffix in Site Settings, replacing the `pricingModule.period.*` catalogue strings.

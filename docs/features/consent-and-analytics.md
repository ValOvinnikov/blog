---
title: Consent and analytics
status: partial
layers: [config, ui, web]
code:
  - packages/config/src/constants/consent-category.ts
  - packages/ui/src/components/molecules/consent-banner/**
  - packages/ui/src/components/molecules/consent-preferences/**
  - packages/ui/src/components/molecules/consent-placeholder/**
  - apps/web/src/constants/consent.ts
  - apps/web/src/utils/consent-cookie/**
  - apps/web/src/hooks/use-consent/**
  - apps/web/src/hooks/use-consent-store/**
  - apps/web/src/context/consent-preferences-provider/**
  - apps/web/src/components/shared/consent-banner-slot/**
  - apps/web/src/components/shared/consent-preferences-dialog/**
  - apps/web/src/components/shared/cookie-settings-button/**
  - apps/web/src/components/shared/site-analytics/**
  - apps/web/src/utils/is-web-analytics-enabled/**
epics: [3774, 3726, 5037, 5029]
---

# Consent and analytics

## What it does

A site can show a cookie consent banner that lets the reader accept all, reject all or open settings, and a "Cookie settings" link in the footer reopens the preferences dialog at any time. The reader's choice is a first-party cookie read on the client. Separately, a site can load Vercel Web Analytics and Speed Insights. The consent machinery has one optional category, external media, and nothing on the site consumes it yet; analytics is not gated on consent.

## Surfaces and routes

- **Banner** — `ConsentBannerSlot`, mounted once in `SiteProviders`, shows when the `CONSENT_BANNER` capability is on and the reader has no valid consent cookie.
- **Preferences dialog** — `ConsentPreferencesDialog`: Necessary (locked on) and External media switches, Save and Close. Opened from the banner's settings button and from the footer's `CookieSettingsButton`, which renders on every site whatever the capability; focus returns to that button on close.
- **Analytics** — `SiteAnalytics`, rendered in the tenant layout, mounts `<Analytics />` and `<SpeedInsights />`.
- No platform page of its own: both are rows on the Features page (see [plans-and-entitlements](./plans-and-entitlements.md)). No Studio surface.

## Data

- `CONSENT_CATEGORY` (`@blog/config`): `NECESSARY`, `EXTERNAL_MEDIA`. Optional categories are every category but `NECESSARY`.
- Cookie `consent`, value `1.<granted categories, comma-separated>` (version `1`; an empty list means rejected), 180 days, `Path=/`, `SameSite=Lax`, `Secure`. Written from the browser; no server reads it.
- `useConsentStore` turns the cookie into `UNKNOWN` (server and first render), `UNANSWERED` (missing or invalid cookie) or `ANSWERED`; `useConsent(category)` answers `GRANTED` or `DENIED` per category and exposes `grant()`.
- No Neon or Sanity data. The capability flags come from `settings_features`, cached per tenant like every other capability.

## Configuration

- **Owner or operator (platform Features)** — `CONSENT_BANNER` (in `FREE` and `GROWTH`) and `ANALYTICS` (`GROWTH` only). Both preset defaults are off.
- **Operator (env)** — `WEB_ANALYTICS_ENABLED=true` is required as well; analytics loads only when the env flag and the capability both allow it.
- **Voice** — none; banner, dialog and footer-link copy are fixed keys (`consent.*`).
- **Look** — the banner, dialog and placeholder are `@blog/ui` molecules and follow the site's Look.

## Constraints and invariants

- A cookie with an unknown version, an extra segment or an unknown category decodes as unanswered, so the banner shows again rather than trusting a malformed value.
- `NECESSARY` is always granted and is never written to the cookie; `grant()` on it is a no-op.
- The server snapshot is `UNKNOWN`, so the banner never renders during SSR and never flashes for a reader who already answered.
- Every store instance re-reads the cookie on save through one listener set, so the banner, the dialog and any consent-gated component update together.
- `ConsentPlaceholder` (ui) and `useConsent` exist for content behind the external-media category; no web component uses them yet.
- Vercel Analytics and Speed Insights load regardless of the reader's consent choice.
- A capability switched off hides the banner; the footer's Cookie settings link stays.

## Dependencies

- Layers: `config` (categories, `CAPABILITY`), `ui` (`ConsentBanner`, `ConsentPreferences`, `ConsentPlaceholder`, `Dialog`), `web`.
- Features: [plans-and-entitlements](./plans-and-entitlements.md), [footer-and-legal-pages](./footer-and-legal-pages.md), [embed-module](./embed-module.md) (the intended external-media consumer), [rendering-and-caching](./rendering-and-caching.md).
- Packages: `@vercel/analytics`, `@vercel/speed-insights`.
- Env: `WEB_ANALYTICS_ENABLED`.

## Entry points

- `apps/web/src/utils/consent-cookie/consent-cookie.ts` — `encodeConsent`, `decodeConsent`
- `apps/web/src/hooks/use-consent-store/use-consent-store.ts`
- `apps/web/src/hooks/use-consent/use-consent.ts`
- `apps/web/src/components/shared/consent-banner-slot/consent-banner-slot.tsx`
- `apps/web/src/components/shared/consent-preferences-dialog/consent-preferences-dialog.tsx`
- `apps/web/src/components/shared/site-providers/site-providers.tsx`
- `apps/web/src/components/shared/site-analytics/site-analytics.tsx`
- `apps/web/src/app/[tenant]/[locale]/layout.tsx`

## Tests and stories

- `apps/web/src/utils/consent-cookie/consent-cookie.test.ts`, `use-consent.test.tsx`, `use-consent-store.test.tsx`, `consent-preferences-provider.test.tsx`, `consent-banner-slot.test.tsx`, `consent-preferences-dialog.test.tsx`, `cookie-settings-button.test.tsx`, `site-analytics.test.tsx`, `is-web-analytics-enabled.test.ts`.
- `packages/ui/src/components/molecules/consent-*/**/*.test.tsx`.
- Stories: `consent-banner.stories.tsx`, `consent-preferences.stories.tsx`, `consent-placeholder.stories.tsx` (ui).

## Related

- #3774 — render `module_embed` behind the consent gate (the first external-media consumer).
- #3726 — the footer shows the privacy-policy link and the footer links.
- #5037 — the banner, dialog and setting-row headings take text roles.
- #5029 — the cookie-settings dialog title is dialog-size again (#5046 manual test).

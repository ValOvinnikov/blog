---
title: Consent and analytics
status: partial
layers: [config, studio, service, ui, web]
code:
  - packages/config/src/constants/consent-category.ts
  - packages/ui/src/components/molecules/consent-banner/**
  - packages/ui/src/components/molecules/consent-preferences/**
  - packages/ui/src/components/molecules/consent-placeholder/**
  - apps/web/src/constants/consent.ts
  - apps/web/src/utils/consent-cookie/**
  - apps/web/src/hooks/use-consent/**
  - apps/web/src/hooks/use-consent-store/**
  - apps/web/src/hooks/use-consent-preferences-form/**
  - apps/web/src/context/consent-preferences-provider/**
  - apps/web/src/components/features/layout/site-providers/components/consent-banner-slot/**
  - apps/web/src/components/shared/consent-preferences-dialog/**
  - apps/web/src/components/shared/cookie-settings-button/**
  - apps/web/src/modules/cookie-settings/**
  - apps/web/src/components/shared/site-analytics/**
  - apps/web/src/utils/is-web-analytics-enabled/**
epics: [3774, 3726, 5037, 5029]
---

# Consent and analytics

## What it does

A site can show a cookie consent banner that lets the reader accept all, reject all or open settings, and a "Cookie settings" footer link, a floating button or both — the owner's choice on Look — reopen the preferences dialog at any time. An editor can also place a Cookie settings module on the home or a landing page (a privacy page, say), where the reader changes the choice inline. The banner links to the site's cookie statement, which lists every cookie the site sets and can reopen the preferences from its text. The reader's choice is a first-party cookie read on the client. Separately, a site can load Vercel Web Analytics and Speed Insights. The consent machinery has one optional category, external media, and nothing on the site consumes it yet; analytics is not gated on consent.

## Surfaces and routes

- **Banner** — `ConsentBannerSlot`, mounted once in `SiteProviders`, shows when the `CONSENT_BANNER` capability is on and the reader has no valid consent cookie. Its policy link goes to `/legal/cookie-statement` (`routes.cookieStatement()`), labelled by the fixed `consent.banner.policyLinkLabel` (./footer-and-legal-pages.md).
- **Cookie list** — a rich-text block on the cookie statement (or any article text) rendered from `COOKIE_LIST` in `apps/web/src/constants/cookie-list.ts`: name, purpose and duration, three columns from `sm` up and stacked entries on phones. Purposes and durations are fixed catalog keys (`cookieList.*`). A cookie the site starts setting joins that list in the same change.
- **Cookie-preferences link** — a rich-text annotation that turns the editor's text into a button opening the preferences dialog (./rich-text.md).
- **Preferences dialog** — `ConsentPreferencesDialog`: Necessary (locked on) and External media switches, Save and Close. Opened from the banner's settings button, from the footer's `CookieSettingsButton` and from the floating button. On close focus returns to the control that opened it; when that control has gone (the banner, after Save), it falls back to the floating button, else the footer link.
- **Floating button** — `FloatingCookieSettingsButton`, a 44px round icon button fixed bottom left and named "Cookie settings". `SiteFooter` mounts it when Look's Cookie settings choice is Floating button or Both and the `CONSENT_BANNER` capability is on. It renders only once the reader has answered the banner, never during SSR, sits below toasts and the banner (`z-20`), and hides while a header overlay is open.
- **Cookie settings module** — `module_cookieSettings` on the home and landing pages. Renders the same switches and Save inline, under the editor's heading or, without one, `consent.preferences.heading`. The switches appear only once the reader's saved choice is known, and a `role="status"` line confirms each save (`consent.preferences.savedStatus`), re-announced on a repeat Save and cleared when a switch changes or another surface saves.
- **Analytics** — `SiteAnalytics`, rendered in the tenant layout, mounts `<Analytics />` and `<SpeedInsights />`.
- No platform page of its own: both are rows on the Features page (see [plans-and-entitlements](./plans-and-entitlements.md)). The only Studio surface is the Cookie settings module document.

## Data

- `CONSENT_CATEGORY` (`@blog/config`): `NECESSARY`, `EXTERNAL_MEDIA`. Optional categories are every category but `NECESSARY`.
- Cookie `consent`, value `1.<granted categories, comma-separated>` (version `1`; an empty list means rejected), 180 days, `Path=/`, `SameSite=Lax`, `Secure`. Written from the browser; no server reads it.
- `useConsentStore` also reports a `saveRevision` that every `save` advances, even one that rewrites the same choice; `save` returns the new revision.
- `useConsentStore` turns the cookie into `UNKNOWN` (server and first render), `UNANSWERED` (missing or invalid cookie) or `ANSWERED`; `useConsent(category)` answers `GRANTED` or `DENIED` per category and exposes `grant()`.
- Sanity `module_cookieSettings`: `brandVariant`, optional `headingBlock`, `layout`. No Neon data. The capability flags come from `settings_features`, cached per tenant like every other capability.

## Configuration

- **Owner or operator (platform Features)** — `CONSENT_BANNER` (in every plan) and `ANALYTICS` (`GROWTH` only). Both preset defaults are off.
- **Operator (env)** — `WEB_ANALYTICS_ENABLED=true` is required as well; analytics loads only when the env flag and the capability both allow it.
- **Voice** — none; banner, dialog, module and footer-link copy are fixed keys (`consent.*`).
- **Look** — the banner, dialog and placeholder are `@blog/ui` molecules and follow the site's Look. Look › Footer › Cookie settings (Footer link default · Floating button · Both, every plan; stored as `COOKIE_SETTINGS_BUTTON` `HIDDEN` · `ONLY` · `SHOWN`) picks which controls reopen the dialog, read through `getFooterStyle`; `resolveCookieSettingsControls` turns the choice and the capability into the footer link and the floating button.

## Constraints and invariants

- A cookie with an unknown version, an extra segment or an unknown category decodes as unanswered, so the banner shows again rather than trusting a malformed value.
- `NECESSARY` is always granted and is never written to the cookie; `grant()` on it is a no-op.
- The server snapshot is `UNKNOWN`, so the banner never renders during SSR and never flashes for a reader who already answered.
- Every store instance re-reads the cookie on save through one listener set, so the banner, the dialog, the module and any consent-gated component update together.
- The dialog and the module share `useConsentPreferencesForm`: one category list, and switches that start from the saved choice and re-derive on every save from any surface (keyed on `saveRevision`, not the cookie value), discarding unsaved changes.
- The module renders no switches while the store is `UNKNOWN`, so Save can never write an empty choice over a granted one before the cookie is read.
- `ConsentGate` (`apps/web/src/components/shared/consent-gate/`) gates content on one category: it renders its `pending` node while the store is `UNKNOWN` (so the server render never holds the gated content), its `fallback` while the category is unanswered or denied, and its children once granted. The embed module is its first consumer, with `ConsentPlaceholder` as the fallback.
- Vercel Analytics and Speed Insights load regardless of the reader's consent choice.
- A capability switched off hides the banner, the footer link and the floating button, whatever Look's choice; a Cookie settings module on a page still renders. With it on, at least one of the link and the button shows.

## Dependencies

- Layers: `config` (categories, `CAPABILITY`), `ui` (`ConsentBanner`, `ConsentPreferences`, `ConsentPlaceholder`, `Dialog`), `web`.
- Features: [plans-and-entitlements](./plans-and-entitlements.md), [footer-and-legal-pages](./footer-and-legal-pages.md), [rich-text](./rich-text.md), [embed-module](./embed-module.md) (the first external-media consumer), [rendering-and-caching](./rendering-and-caching.md).
- Packages: `@vercel/analytics`, `@vercel/speed-insights`.
- Env: `WEB_ANALYTICS_ENABLED`.

## Entry points

- `apps/web/src/utils/consent-cookie/consent-cookie.ts` — `encodeConsent`, `decodeConsent`
- `apps/web/src/hooks/use-consent-store/use-consent-store.ts`
- `apps/web/src/hooks/use-consent/use-consent.ts`
- `apps/web/src/components/shared/consent-gate/consent-gate.tsx`
- `apps/web/src/components/features/layout/site-providers/components/consent-banner-slot/consent-banner-slot.tsx`
- `apps/web/src/components/shared/consent-preferences-dialog/consent-preferences-dialog.tsx`
- `apps/web/src/hooks/use-consent-preferences-form/use-consent-preferences-form.ts`
- `apps/web/src/modules/cookie-settings/cookie-settings-module.tsx`
- `apps/web/src/components/shared/floating-cookie-settings-button/floating-cookie-settings-button.tsx`
- `apps/web/src/context/consent-preferences-provider/consent-preferences-provider.tsx` — the footer and floating control refs and the focus-return fallback
- `apps/web/src/components/features/layout/site-providers/site-providers.tsx`
- `apps/web/src/components/shared/site-analytics/site-analytics.tsx`
- `apps/web/src/constants/cookie-list.ts`, `apps/web/src/components/shared/portable-text/config/cookie-list.tsx`, `cookie-preferences-link.tsx`
- `apps/web/src/app/[tenant]/[locale]/layout.tsx`

## Tests and stories

- `apps/web/src/utils/consent-cookie/consent-cookie.test.ts`, `use-consent.test.tsx`, `use-consent-store.test.tsx`, `consent-gate.test.tsx`, `consent-preferences-provider.test.tsx`, `consent-banner-slot.test.tsx`, `consent-preferences-dialog.test.tsx`, `cookie-settings-form.test.tsx`, `cookie-settings-module.test.tsx`, `cookie-settings-button.test.tsx`, `floating-cookie-settings-button.test.tsx`, `site-analytics.test.tsx`, `is-web-analytics-enabled.test.ts`.
- `packages/ui/src/components/molecules/consent-*/**/*.test.tsx`.
- Stories: `consent-banner.stories.tsx`, `consent-preferences.stories.tsx`, `consent-placeholder.stories.tsx` (ui); `cookie-settings-module-view.stories.tsx` (web).

## Related

- #3774 — render `module_embed` behind the consent gate; adds `ConsentGate`.
- #3726 — the footer shows the privacy-policy link and the footer links.
- #5037 — the banner, dialog and setting-row headings take text roles.
- #6088 — the Cookie settings module (epic #6082).
- #5029 — the cookie-settings dialog title is dialog-size again (#5046 manual test).
- #6505 — the banner's cookie-statement link, the cookie list and the cookie-preferences link.
- #6743 — owners choose the footer link, the floating button or both; with the banner off neither shows.

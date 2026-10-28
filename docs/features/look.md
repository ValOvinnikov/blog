---
title: Look
status: built
layers: [config, db, web, platform]
code:
  - packages/config/src/constants/preset.ts
  - packages/config/src/constants/card-style.ts
  - packages/config/src/theme/spinner-variant.ts
  - packages/db/src/schema/site-config.ts
  - packages/db/src/queries/site-config/**
  - packages/db/src/constants/look.ts
  - packages/db/src/utils/effective-look/**
  - apps/platform/src/app/*/dashboard/*/look/**
  - apps/platform/src/app/*/tenants/*/*/look/**
  - apps/platform/src/components/features/look/**
  - apps/platform/src/components/features/site-preview/look-sample/**
  - apps/platform/src/components/features/site-preview/site-theme-frame/**
  - apps/platform/src/components/shared/preset-picker/**
  - apps/platform/src/components/shared/hue-slider/**
  - apps/platform/src/components/shared/font-picker/**
  - apps/platform/src/config/**
  - apps/platform/src/server/site-config/update-look-action*.ts
  - apps/platform/src/server/site-config/*brand-asset*.ts
  - apps/platform/src/server/site-config/sanitize-svg-markup*.ts
  - apps/platform/src/server/site-config/site-config-or-defaults*.ts
  - apps/platform/src/utils/default-look-values/**
  - apps/platform/src/utils/look-form-values/**
  - apps/platform/src/utils/theme-preview-tokens/**
  - apps/platform/src/utils/brand-asset-limits/**
  - apps/web/src/server/site-config/get-site-config/**
  - apps/web/src/server/site-config/get-language-switcher-style/**
  - apps/web/src/server/site-config/get-busy-style/**
  - apps/web/src/context/busy-style-provider/**
  - apps/web/src/utils/to-theme-tokens/**
  - apps/web/src/utils/get-theme-tokens/**
  - apps/web/src/utils/build-theme-style-block/**
  - apps/web/src/components/shared/theme-scope/**
  - apps/web/src/config/fonts.ts
  - apps/web/src/config/font-loaders/**
epics: [4987, 4991, 4992, 4993, 4999, 4960]
---

# Look

## What it does

The Look page is where a tenant owner styles their public site without touching code. They pick a preset (Console or Editorial), then adjust the accent hue, the logo-mark hue, the heading and body fonts, corner radius, density, card style, the header buttons style, the header's wide-screen layout, sub-menu style and bar, the account button, account panel and where the account sits on phones, the busy-button style and spinner style, and the language-switcher style, and upload a logo and favicon. A live preview shows the result in light or dark, at desktop or phone width, and with the reader signed out or signed in before saving. One save restyles every page of the site, and the accent and logo hues also colour the tenant's emails.

## Surfaces and routes

- **Platform** — `/dashboard/look` (owner) and `/tenants/{id}/look` (operator). An Edit/Preview tab pair; the edit panel holds the Preset, Colour, Type, Shape (radius, density, card style, header buttons), Header (layout, sub-menus, bar, Account button, Account panel, On phones, the account sits), Buttons (While busy, Spinner), Brand and Language switcher cards. On `FREE` every field but the preset, accent hue, logo and favicon is locked (see Configuration).
- **Public site** — no route of its own. `[tenant]/[locale]/layout.tsx` and the standalone not-found page wrap the page in `ThemeScope`, which hoists one `<style>` into `<head>` and sets the font variable classes. The header and footer read the language-switcher style. Every busy button and spinner on the site reads the busy-button style and spinner style. The header brand shows the Look logo and `app/icon.tsx` serves the Look favicon.
- **Email** — `resolveTenantEmailBrand` turns the preset, accent hue and logo hue into hex colours for the magic-link, newsletter and test emails.
- No Studio surface: the theme is not Sanity content.

## Data

- `site_config` (Neon) — one row per tenant (unique `tenant_id`, cascade delete). Look columns: `preset` (`preset_id` pgEnum), `accent_hue` (int), `logo_hue` (int, nullable = follow the accent), `heading_font` and `body_font` (`font_choice`), `radius_scale` (`SM`/`MD`/`LG`/`XL`), `density` (`DEFAULT`/`COMPACT`), `card_style` (`ACCENT_BAR` default, `OUTLINED`), `header_control_style` (`OUTLINED` default, `SOFT`, `PLAIN`; a new row takes the preset's, `OUTLINED` for both; `HEADER_CONTROL_STYLE_DECLARATIONS` maps each to `--header-control-border` / `--header-control-fill`), `language_switcher_style` (`MENU_CODE` default, `MENU_GLOBE`, `CODES`), `account_button_style` (`PILL` default, `CIRCLE`), `account_panel_style` (`CARD` default, `PROFILE`, `HUB`), `account_phone_placement` (`BAR` default, `MENU`), `busy_button_style` (`LABEL` default, `KEPT`, `EDGE`), `spinner_style` (`PRESET` default — follow the preset — `BRAILLE`, `RING`, `DOTS`, `PULSE`), `header_layout` (`CLASSIC` default, `LINKS_BESIDE_BRAND`, `CENTRED_LINKS`, `TWO_ROWS`, `CENTRED_BRAND`, `MENU_BUTTON`), `header_submenu_style` (`DROPDOWN` default, `WIDE_PANEL`), `header_bar_style` (`FULL_WIDTH` default, `FLOATING`) — a new row takes the preset's, the defaults for both, and a preset change leaves them as they are; `logo_asset_url`, `favicon_asset_url`. The same row holds Voice's `voice_overrides`.
- `PRESET_REGISTRY` (`@blog/config`) — `CONSOLE`: hue 250, Space Grotesk / Newsreader, `MD`, `DEFAULT`, `ACCENT_BAR`. `EDITORIAL`: hue 28, Fraunces / Inter, `SM`, `COMPACT`, `OUTLINED`. Each preset also carries the capability `featureDefaults`.
- Provisioning writes no row. With no row, the site renders the Console preset and the form opens on Console defaults.
- Brand images live in Vercel Blob at `tenants/<id>/<logo|favicon>-<random suffix>.<ext>`, public. Every upload gets a unique name, so a same-type replacement never collides with the old file or its cached copy. A replaced or cleared image's old blob is deleted best-effort.
- **Caching (web)** — `getSiteConfig` is `unstable_cache` per tenant, tag `site-config:<id>`, 3600s fallback (`TENANT_CONFIG_REVALIDATE_SECONDS`). `updateLookAction`, `uploadBrandAssetAction` and `clearBrandAssetAction` each POST `/api/revalidate-site-config` after their write, which expires the tenant's tags and purges the whole layout.

## Configuration

- Any tenant member, and any operator (as a virtual owner), can save. An archived tenant's form is read-only.
- **Plan** — `PLAN_ENTITLEMENTS[plan].lookFields` lists the fields a plan may set. On `FREE` that is the preset, accent hue, logo and favicon; the fonts, radius, density, card style, header buttons style, header layout, sub-menu style, bar, account button, account panel, phone placement, busy-button style, spinner style, logo hue and language-switcher style show disabled with the Features page's "Growth plan" badge, at the preset's value, in the form and the preview. The form opens on `toEffectiveLook` of the stored row, and a restored draft goes through it too. `updateLookAction` writes only the fields the plan includes, so the stored Growth choices stay and come back on an upgrade. The public site renders the same effective Look: `getSiteConfig` passes the row and the tenant's plan (`getTenantPlan`) through `toEffectiveLook`, so every reader of the row — theme tokens, the switcher, header, account and busy styles — gets the preset's values on `FREE`, and an upgrade shows the stored choices with no Look save. Voice and the email identity, which read the same row, are untouched. When the plan can't be read, `FREE`'s fields apply and `site_config.plan_fetch_failed` is logged; the read is memoised per request with React `cache()`, so it logs once per page.
- Picking a preset re-seeds the accent hue, fonts, radius, density, card style and header buttons style from `PRESET_REGISTRY` and clears the logo hue. The header layout, sub-menu style and bar, the account button, panel and phone placement, the busy-button and spinner styles, the language-switcher style and brand images are kept. "Reset" appears once any value diverges from the preset.
- The five fonts are allowed in either role; each has a heading and a body loader in `apps/web`.
- The language-switcher control appears only when the tenant has more than one live language.
- Unsaved edits persist as a draft in `localStorage`, keyed by tenant and page under `platform.settings-draft.v1`. Staged image files cannot survive a reload, so a restored draft asks for them again. A draft missing a field the form now has is dropped, not offered.
- The preview's sample header opens signed out and at rest. At desktop width it shows the nav links, the language switcher in the tenant's style, the 36px theme circle and, when the site has a reader account (`READER_ACCOUNT_CAPABILITIES`, after plan clamping), `@blog/ui`'s `AccountTrigger` in the chosen Account button style. At Mobile width it shows the brand, the account circle (reader accounts only, and only when the account sits in the bar) and the menu circle. With reader accounts the toolbar offers Signed out / Signed in: Signed in swaps the trigger to the sample reader's avatar and hangs `AccountPanel`, in the chosen Account panel style, open below it. With the account in the menu, the Mobile preview shows no account control, as the sample does not draw the phone menu. The sample follows the header settings: at desktop width it arranges the brand, links and controls by the chosen layout (Menu button shows the menu circle instead of links) and opens one link's sub-menu, as a dropdown or a wide panel, while the Sub-menus field is hovered or focused and once its value changes, closing it when the pointer and focus have both left the field (the preview stays `inert`); at both widths Floating insets the bar as a card. Mobile width shows every layout as the bar with the menu button. Every control is drawn from `@blog/ui`'s `HEADER_CONTROL` recipe, so the header buttons style restyles them all at once. Beside the sample buttons sits a busy `@blog/ui` `Button` that follows While busy (Busy label, Label kept, Progress edge) and the Spinner choice, with Follow the preset resolved through `toSpinnerVariant` against the form's current preset, so it changes as the preset does.
- Reach: every page of the tenant's site, its emails, and the platform's own Voice specimens (through `theme-preview-tokens`). Plans gate the Look fields above.

## Constraints and invariants

- The resolved theme is never partial. `toThemeTokens` fills every gap from the row's preset, and a missing row or failed fetch falls back to `CONSOLE`.
- Accent and logo ramps are declared in both `:root` and `.dark`. Radius, density, card style, header control style and the image-scrim ramp go in `:root` only (see [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)).
- The public site reads the busy-button style and spinner style through `getBusyStyle` (`getSiteConfig`, falling back to the preset's, and to Console with no row). Follow the preset resolves to Braille for Console and Ring for Editorial through `toSpinnerVariant` (`@blog/config`), so the platform can resolve it the same way. `SiteProviders` hands the pair to `BusyStyleProvider`, and every busy `Button` and every `Spinner` on the site reads it through `useBusyStyle`: the sign-in panel, the newsletter signup ("Subscribing…"), the contact form, the account page's Save, Unlink, Unsubscribe, Resend and Delete buttons, and the toast's loading spinner. A busy button only draws the style when it has a busy label, so each of these has a short fixed one. Linking a provider and the public unsubscribe page's plain form post have none and stay unstyled.
- A header buttons style changes only the resting border and fill. Outlined frames each control with `--border-strong` on `--surface`; Soft fills it with `--border` and no outline; Plain shows neither until hovered, so a Plain codes pill is carried by its brand-filled current chip. Geometry, hover, open, focus and forced colours are the same in every style, and every style combines with every language-switcher style. No style's resting cue reaches 3:1; each control is identified by its glyph or label, which WCAG 1.4.11 accepts.
- The public site resolves the stored header control style through `toThemeTokens` (falling back to the preset's) and `buildThemeStyleBlock` spreads `HEADER_CONTROL_STYLE_DECLARATIONS` into `:root`, so every header control follows it on the next render after a save (the existing `site-config:<id>` tag). Hover and open draw a brand outline in every style.
- `theme.css`'s static values equal what `buildThemeStyleBlock` emits for the Console preset; `build-theme-style-block.test.ts` reads `theme.css` for the radius, spacing, item-card, header-control and scrim tokens, and checks the brand and logo ramps against fixed literals.
- Accent-hue guard: the form blocks saving and `updateLookAction` refuses a hue that `isAccentHueAccessible` rejects. The site and emails replace such a stored hue with the preset's. The guard checks one pair, `--text` on `--brand-primary-muted` in both modes at 4.5:1, which every hue from 0 to 360 passes. So the refusal never fires today, and the other accent-dependent pairs (button labels, links on grey bands) are not checked.
- The logo hue is unguarded; it colours only the generated three-layer brand mark.
- `ACCENT_BAR` item cards stay square whatever the radius; only `OUTLINED` follows the radius scale.
- Density rescales layout spacing only. Tailwind's base `--spacing` is untouched, so controls keep their size.
- Fonts are self-hosted woff2 files in both apps, with no Google Fonts fetch. Only the Console pair and the mono font preload on the site.
- Brand images: PNG, JPEG, WebP or SVG. The logo may be up to 4 MB and 32–4000px; the favicon up to 1 MB, 16–512px and square. The server sniffs the real bytes and sanitises SVG; the client check is a convenience only.
- Images upload before the Look save. Each successful upload or clear revalidates the site itself, so an image already stored still reaches the public site when a later step of the save fails; a failed one does not revalidate.
- A failed image upload or clear stops the save: its message shows under that picker, which is marked invalid and takes focus, and the save bar reads "Not saved" with a link to it. Any other save failure is announced beside Save.
- The public site's header logo is `logo_asset_url` and its favicon is `favicon_asset_url`, each falling back to the platform's default three-layer mark when unset. The Studio's Site Settings brand logo is not a source for either. A logo that fails to load in the browser, or a favicon the icon route cannot fetch within 5s, also falls back to the default mark, so a broken upload never breaks the page. The public site's CSP allows `https://*.blob.vercel-storage.com` in `img-src` so the uploaded logo loads; the favicon is served from the site's own origin. Both follow a save on the next render after `site-config:<id>` expires, subject to browser favicon caching.
- Every save writes an audit event (`SETTINGS_UPDATED` on `SITE_CONFIG`) whose details are the fields it wrote.
- `upsertSiteConfig` requires only the preset; any Look column a save omits is left as stored, or takes the preset's value on a new row.

## Dependencies

- Layers: `config` (presets, theme declaration tables, the hue guard), `db` (`site_config`), `web`, `platform`.
- Features: [design-tokens-and-surfaces](./design-tokens-and-surfaces.md), [voice](./voice.md) (shares the row, preview tokens and revalidation), [languages](./languages.md), [email](./email.md), [platform-shell](./platform-shell.md), [tenant-access](./tenant-access.md), [audit-and-findings](./audit-and-findings.md), [rendering-and-caching](./rendering-and-caching.md), [plans-and-entitlements](./plans-and-entitlements.md) (preset feature defaults).
- Env: `SITE_CONFIG_REVALIDATE_SECRET` (both apps), `WEB_APP_URL` and `BLOB_READ_WRITE_TOKEN` (platform).

## Entry points

- `packages/config/src/constants/preset.ts` — `PRESET_REGISTRY`, `FONT_CHOICE`, `RADIUS_SCALE`, `DENSITY`, `LANGUAGE_SWITCHER_STYLE`
- `packages/db/src/schema/site-config.ts`
- `apps/platform/src/components/features/look/look-page-content/look-page-content.tsx`
- `apps/platform/src/components/features/look/look-form/look-form.tsx`, `use-look-form-state.ts`, `use-look-save.ts`
- `apps/platform/src/utils/look-form-values/look-form-values.ts` — `applyPresetDefaults`
- `apps/platform/src/server/site-config/update-look-action.ts`, `upload-brand-asset-action.ts`, `clear-brand-asset-action.ts`, `validate-brand-asset.ts`
- `apps/platform/src/utils/theme-preview-tokens/theme-preview-tokens.ts`
- `apps/web/src/utils/to-theme-tokens/to-theme-tokens.ts`
- `apps/web/src/utils/build-theme-style-block/build-theme-style-block.ts`
- `apps/web/src/components/shared/theme-scope/theme-scope.tsx`
- `apps/web/src/app/icon.tsx` — the favicon
- `apps/web/src/server/site-config/get-brand-logo-url/get-brand-logo-url.ts`, `apps/web/src/components/shared/brand-lockup-link/` — the header logo
- `apps/web/src/config/fonts.ts`

## Tests and stories

- Platform: tests beside every Look component, both `look/page.test.tsx` routes, `apps/platform/src/server/site-config/*.test.ts`, `default-look-values.test.ts`, `look-form-values.test.ts`, `theme-preview-tokens.test.ts`, `brand-asset-limits.test.ts`, `apps/platform/src/config/fonts.test.ts`, `look-sample.test.tsx`.
- Web: `to-theme-tokens.test.ts`, `get-theme-tokens.test.ts`, `build-theme-style-block.test.ts`, `theme-scope.test.tsx`, `get-site-config.test.ts`, `get-language-switcher-style.test.ts`, `get-busy-style.test.ts`, `get-brand-logo-url.test.ts`, `icon.test.tsx`, `brand-lockup-link.test.tsx`, `site-header.test.tsx`, `apps/web/src/config/fonts.test.ts`.
- db: `packages/db/src/queries/site-config/**/*.test.ts`.
- Stories: `apps/web/src/components/shared/theme-scope/theme-scope.stories.tsx`. The platform has no stories.

## Related

- #5459 — epic: header controls are one round family, and the Look page sets how they're framed.
- #4987 — epic: accessible text and colour on the public site. It retunes the ramps and rebuilds the hue guard.
- #4991 — brand and metadata colours reach AA at every accent hue.
- #4992 — the accent-hue guard checks every accent pair and names the ones that fail.
- #4993 — the Look page explains which parts a refused hue would make unreadable.
- #4999 — the hue guard and the tenant email brand read the theme ramps instead of copies.
- #4960 — the onboarding wizard's preset and accent quick-pick writes the first `site_config` row.

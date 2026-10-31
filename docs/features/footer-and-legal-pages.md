---
title: Footer and legal pages
status: partial
layers: [studio, service, ui, web]
code:
  - packages/studio/src/schema-types/documents/settings/footer/**
  - packages/service/src/features/global/footer/**
  - packages/ui/src/components/organisms/footer/**
  - apps/web/src/components/shared/site-footer/**
epics: [3726, 4995]
---

# Footer and legal pages

## What it does

The site footer closes every page with a copyright line, the site's social profiles as icon links, an optional language switcher, the cookie settings button and a link to the RSS feed. The footer half is built. Footer settings hold link groups, an about line, an address and fine-print links in Studio, and the footer loader returns them, but the public site does not render them yet. No privacy, terms or imprint page type exists, and the consent banner has no policy page to point to; a legal text is published as an ordinary landing page and linked through a `link` document.

## Surfaces and routes

- **Public site:** every page rendered inside `app/[tenant]/[locale]/layout.tsx`, which mounts `SiteFooter`. The standalone 404 boundaries above that layout have no footer.
- **Studio:** Settings → Footer, the `settings_footer` singleton — Social Links, Groups, About, Address, Fine Print, Show language switcher, Show RSS feed. The copyright name is the brand name in Settings → Site Settings.
- **Platform:** Look › Footer sets Footer layout (Columns default · Centred · Compact · Big wordmark), Background (Plain · Shaded · Brand tint default) and Surface (Full width default · Card), all Growth-only, plus the Cookie settings button (./consent-and-analytics.md). Look also picks the switcher style and the theme tokens.

## Data

- **`settings_footer`:** `title`, `social[]` (`socialProfile` objects), `groups[]` (`footerLinkGroup` objects), `about` (localized one-line text), `address` (localized multi-line text), `finePrint[]` (`linkRef` items and at most one `cookieSettingsItem`), `showLanguageSwitcher` (boolean, initial `false`), `showRssFeed` (boolean, initial `true`). Every field after `social` is optional. Provisioning seeds it empty, and seed verification requires the singleton.
- **`footerLinkGroup`:** a localized `heading`, required in the default language, and `links[]`, one or more `linkRef`s in order. No fixed categories.
- **`cookieSettingsItem`:** marks where the Cookie settings link sits in the fine print; it has no editable field. The link shows on every site whether or not the item is present.
- **`socialProfile`:** a required `link` reference to a `link` document plus a `platform` from `SOCIAL_PLATFORMS` (X, GitHub, LinkedIn, YouTube, Instagram, Mastodon, Bluesky, Facebook, Threads, RSS). The same object backs `person.socialLinks` (./people.md), through one shared fragment and transformer.
- **Service:** `service.global.footer.v1.getFooter(sanityContext)` returns `{ social: TSocialProfile[], groups: TFooterLinkGroup[], about?, address?, finePrint: TFooterFinePrintItem[], showLanguageSwitcher?, showRssFeed }`, with `showRssFeed` defaulting to `true` when unset. The heading, about and address resolve in the visitor's language, falling back to the default. Each fine-print item is a `FOOTER_FINE_PRINT_KIND.LINK` with its link or the one `COOKIE_SETTINGS` marker, in Studio order. A link whose document is missing, unpublished, unlabelled or without a resolvable href is dropped, from a profile, a group or the fine print alike; a group left with no links is dropped, and none of it fails the footer query.
- **Cache:** the query is tagged `footer`, `link` and every page type, tenant-scoped; the publish webhook maps `settings_footer` → `footer` and `link` → `link`.
- **Look:** `site_config.footer_layout`, `footer_background`, `footer_surface` and `cookie_settings_button`, read by `getFooterStyle` through `getSiteConfig`, so a plan without the field gets the preset's value. A failed read logs `footer.site_config_fetch_failed` and falls back to the preset (Columns, Brand tint, Full width, button Hidden).
- **Copyright:** `© {year} {brand name}`, the year computed at render time; the format is fixed in `@blog/ui`'s `Footer.Copyright` and no editor or owner can reword it.
- **Legal pages:** no page type, table or route exists for them; the footer links them as ordinary links, in `groups` or `finePrint`.

## Configuration

- **Editors** manage social profiles, link groups, the about line, the address, the fine-print links, the switcher toggle and the RSS toggle in Studio; a profile's destination is edited on its `link` document (./links.md).
- The switcher shows only with two or more live languages, and Studio hides its toggle otherwise (./languages.md). Its style comes from Look (./look.md).
- The cookie settings button reopens the consent preferences dialog (./consent-and-analytics.md). The RSS link goes to the current language's feed (./seo-and-feeds.md).
- Layout, Background and Surface are Growth-only; a Free site renders the preset's. The content is not plan-gated.
- Big wordmark sets the brand name large and `aria-hidden`, since the copyright line already names the site. Compact shows no groups, about text or address.

## Constraints and invariants

- A social link renders as an icon only. Its accessible name is derived from the platform through the catalog's `socialLinks.linkAriaLabel`, never stored per link, so it stays translated; the list is named by `socialLinks.listAriaLabel`.
- A social profile holds no destination of its own — always a `link` document reference.
- Footer order is fixed in code: social links, language switcher, cookie settings, RSS.
- A failed site-settings read renders no footer. A failed footer read is logged (`footer.layout_fetch_failed`) and the footer renders with no social links and no switcher, and with the RSS link shown.
- The footer's links (`TextLink` `appearance="nav"`), including the footer language codes, mark the current item with `aria-current="page"` and the active colour and underline.
- `@blog/ui`'s `Footer` is a compound shell (`Footer.Nav`, `Footer.Copyright`) and stays prop-driven; `apps/web` composes the content.
- The `Footer` lays out by its own width (container queries on `@container/footer`), never the window's, so it renders the same in any frame; on the public site it spans the window. The Big wordmark's `text-wordmark` size scales with the footer's width (`cqi`) for the same reason.

## Dependencies

- Layers: `studio` (schema), `service` (loader), `ui` (footer shell), `web` (composition).
- Features: ./links.md, ./languages.md, ./look.md, ./people.md, ./consent-and-analytics.md, ./seo-and-feeds.md, ./navigation.md, ./rendering-and-caching.md, ./tenant-provisioning.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/documents/settings/footer/footer.ts`
- `packages/studio/src/schema-types/objects/social-profile/social-profile.ts`
- `packages/studio/src/schema-types/objects/footer-link-group/footer-link-group.ts`, `cookie-settings-item/cookie-settings-item.ts`
- `packages/service/src/features/global/footer/adaptor/query.ts`, `transformer.ts`, `types.ts`
- `apps/web/src/components/shared/site-footer/site-footer.tsx`
- `apps/web/src/server/site-config/get-footer-style/get-footer-style.ts`
- `apps/web/src/components/shared/social-links/social-link.tsx`
- `packages/ui/src/components/organisms/footer/footer.tsx`

## Tests and stories

- `packages/studio/src/schema-types/validation/validate-array-type-at-most-once/validate-array-type-at-most-once.test.ts`
- `packages/service/src/features/global/footer/adaptor/loader.test.ts`, `query.test.ts`, `packages/service/src/shared/transformers/social-profile/to-social-profiles.test.ts`
- `apps/web/src/components/shared/site-footer/site-footer.test.tsx`, `apps/web/src/server/site-config/get-footer-style/get-footer-style.test.ts`, `social-links/social-links.test.tsx`, `social-links/social-link.test.tsx`
- `packages/ui/src/components/organisms/footer/footer.test.tsx`
- Stories: `packages/ui/src/components/organisms/footer/footer.stories.tsx`, `apps/web/src/components/shared/social-links/social-links.stories.tsx`.

## Related

- #3726 — a tenant-owned privacy-policy page, linked from the consent banner and the footer.
- #4995 — the current page in navigation, footer links included, is marked by more than colour.

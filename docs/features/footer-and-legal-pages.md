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

The site footer closes every page with a brand column (the Look logo, an about line, an address and the site's social profiles as icon links), the editor's link groups under their headings, and a fine-print row: the copyright line, the editor's fine-print links and, when the owner's choice includes it, the Cookie settings link. An optional language switcher and a link to the RSS feed sit beside the fine print. On a Free site, a "Powered by {product name}" text link to the marketing site closes the bottom row. No privacy, terms or imprint page type exists, and the consent banner has no policy page to point to; a legal text is published as an ordinary landing page and linked through a `link` document.

## Surfaces and routes

- **Public site:** every page rendered inside `app/[tenant]/[locale]/layout.tsx`, which mounts `SiteFooter`. The standalone 404 boundaries above that layout have no footer.
- **Studio:** Settings → Footer, the `settings_footer` singleton — Social Links, Groups, About, Address, Copyright name, Fine Print, Show language switcher, Show RSS feed. The copyright line still shows the brand name from Settings → Site Settings; the site does not read Copyright name yet.
- **Platform:** Look › Footer sets Footer layout (Columns default · Centred · Compact · Big wordmark), Background (Plain · Shaded · Brand tint default) and Surface (Full width default · Card), all Growth-only, plus the Cookie settings button (./consent-and-analytics.md). Look also picks the switcher style and the theme tokens.

## Data

- **`settings_footer`:** `title`, `social[]` (`socialProfile` objects), `groups[]` (`footerLinkGroup` objects), `about` (localized one-line text), `address` (localized multi-line text), `copyrightName` (localized one-line text, empty by default), `finePrint[]` (`linkRef` items and at most one `cookieSettingsItem`), `showLanguageSwitcher` (boolean, initial `false`), `showRssFeed` (boolean, initial `true`). Every field after `social` is optional. Provisioning seeds it empty, and seed verification requires the singleton.
- **`footerLinkGroup`:** a localized `heading`, required in the default language, and `links[]`, one or more `linkRef`s in order. No fixed categories.
- **`cookieSettingsItem`:** marks where the Cookie settings link sits in the fine print; it has no editable field. Whether the link shows is decided by Look › Footer and the cookie banner, never by the item.
- **`socialProfile`:** a required `link` reference to a `link` document plus a `platform` from `SOCIAL_PLATFORMS` (X, GitHub, LinkedIn, YouTube, Instagram, Mastodon, Bluesky, Facebook, Threads, RSS). The same object backs `person.socialLinks` (./people.md), through one shared fragment and transformer.
- **Service:** `service.global.footer.v1.getFooter(sanityContext)` returns `{ social: TSocialProfile[], groups: TFooterLinkGroup[], about?, address?, finePrint: TFooterFinePrintItem[], showLanguageSwitcher?, showRssFeed }`, with `showRssFeed` defaulting to `true` when unset. The heading, about and address resolve in the visitor's language, falling back to the default. Each fine-print item is a `FOOTER_FINE_PRINT_KIND.LINK` with its link or the one `COOKIE_SETTINGS` marker, in Studio order. A link whose document is missing, unpublished, unlabelled or without a resolvable href is dropped, from a profile, a group or the fine print alike; a group left with no links is dropped, and none of it fails the footer query.
- **Cache:** the query is tagged `footer`, `link` and every page type, tenant-scoped; the publish webhook maps `settings_footer` → `footer` and `link` → `link`.
- **Look:** `site_config.footer_layout`, `footer_background`, `footer_surface` and `cookie_settings_button`, read by `getFooterStyle` through `getSiteConfig`, so a plan without the field gets the preset's value. A failed read logs `footer.site_config_fetch_failed` and falls back to the preset (Columns, Brand tint, Full width, Cookie settings as the footer link).
- **Copyright:** `© {year} {brand name}`, the year computed at render time; the format is fixed in `@blog/ui`'s `Footer.Copyright` and no editor or owner can reword it.
- **Powered-by mark:** `getPoweredByMark(tenant)` returns the product name and link from `PRODUCT_NAME` and `MARKETING_SITE_URL` when the tenant's plan carries `PLAN_ENTITLEMENTS[plan].hasPoweredByMark` (`FREE` yes, `GROWTH` no), reading the plan through `getEffectivePlan`, as the Look does. When the plan cannot be read, Free's rules apply. Its label is the fixed catalog key `siteFooter.poweredByLabel`, translated in every site language.
- **Legal pages:** no page type, table or route exists for them; the footer links them as ordinary links, in `groups` or `finePrint`.

## Configuration

- **Editors** manage social profiles, link groups, the about line, the address, the copyright name, the fine-print links, the switcher toggle and the RSS toggle in Studio; a profile's destination is edited on its `link` document (./links.md).
- The switcher shows only with two or more live languages, and Studio hides its toggle otherwise (./languages.md). Its style comes from Look (./look.md).
- The cookie settings button reopens the consent preferences dialog (./consent-and-analytics.md). The RSS link goes to the current language's feed (./seo-and-feeds.md).
- Layout, Background and Surface are Growth-only; a Free site renders the preset's. The content is not plan-gated.
- The powered-by mark follows the plan alone: Free cannot hide it and Growth cannot show it. A plan change shows or hides it on the next page load.
- Big wordmark sets the brand name large and `aria-hidden`, since the copyright line already names the site. Compact shows no groups, about text or address.

## Constraints and invariants

- A social link renders as an icon only. Its accessible name is derived from the platform through the catalog's `socialLinks.linkAriaLabel`, never stored per link, so it stays translated; the list is named by `socialLinks.listAriaLabel`.
- A social profile holds no destination of its own — always a `link` document reference.
- Footer order is fixed in code: the brand column (logo, about, address, social links), the groups, then the bottom row — copyright, fine print, language switcher, RSS, then the powered-by mark. Each part renders only when it has content.
- The Cookie settings link renders in the fine print only with the `CONSENT_BANNER` capability on and Look's choice Footer link or Both (`resolveCookieSettingsControls`): at the `cookieSettingsItem`'s position when set, at the end otherwise, and once even if the item repeats. With the choice Floating button, or the banner off, it is left out even where the item sits.
- A group or fine-print link whose href an earlier one already carries is skipped, groups before fine print; a group left with no links, or with no heading, is dropped. A link opens in a new tab only when its `link` document says so.
- The powered-by mark (`Footer.PoweredBy`) is always the last item of the bottom row and sits after the fine-print `nav`, never inside it. It opens in the same tab and its accessible name is its visible text. With `PRODUCT_NAME` or `MARKETING_SITE_URL` unset it is not drawn, and `footer.powered_by_unconfigured` is logged.
- The groups and the fine print are two `nav` landmarks named by the fixed catalog keys `siteFooter.groupsAriaLabel` and `siteFooter.finePrintAriaLabel`.
- A failed site-settings read renders no footer. A failed footer read is logged (`footer.layout_fetch_failed`) and the footer renders with no editor content and no switcher, and with the copyright, RSS link and, when the choice includes it, Cookie settings shown.
- The footer's links (`TextLink` `appearance="nav"`), including the footer language codes, mark the current item with `aria-current="page"` and the active colour and underline.
- `@blog/ui`'s `Footer` is a compound shell (`Footer.Logo`, `About`, `Address`, `Social`, `Groups`/`Group`/`GroupItem`, `Wordmark`, `Copyright`, `FinePrint`, `Nav`, `PoweredBy`) and stays prop-driven; `apps/web` composes the content. On a phone the groups sit two per row.
- The `Footer` lays out by its own width (container queries on `@container/footer`), never the window's, so it renders the same in any frame; on the public site it spans the window. The Big wordmark's `text-wordmark` size scales with the footer's width (`cqi`) for the same reason.

## Dependencies

- Layers: `studio` (schema), `service` (loader), `ui` (footer shell), `web` (composition).
- Features: ./links.md, ./languages.md, ./look.md, ./people.md, ./consent-and-analytics.md, ./seo-and-feeds.md, ./navigation.md, ./rendering-and-caching.md, ./tenant-provisioning.md.
- Env: `PRODUCT_NAME` (web and platform) and `MARKETING_SITE_URL` (web), for the powered-by mark.
- Plans: [plans-and-entitlements](./plans-and-entitlements.md) decides which sites carry the mark.

## Entry points

- `packages/studio/src/schema-types/documents/settings/footer/footer.ts`
- `packages/studio/src/schema-types/objects/social-profile/social-profile.ts`
- `packages/studio/src/schema-types/objects/footer-link-group/footer-link-group.ts`, `cookie-settings-item/cookie-settings-item.ts`
- `packages/service/src/features/global/footer/adaptor/query.ts`, `transformer.ts`, `types.ts`
- `apps/web/src/components/shared/site-footer/site-footer.tsx`
- `apps/web/src/utils/arrange-footer-links/arrange-footer-links.ts`
- `apps/web/src/utils/resolve-cookie-settings-controls/resolve-cookie-settings-controls.ts`
- `apps/web/src/server/site-config/get-footer-style/get-footer-style.ts`
- `apps/web/src/server/site-config/get-powered-by-mark/get-powered-by-mark.ts`
- `apps/web/src/server/site-config/get-effective-plan/get-effective-plan.ts`
- `apps/web/src/components/shared/social-links/social-link.tsx`
- `packages/ui/src/components/organisms/footer/footer.tsx`

## Tests and stories

- `packages/studio/src/schema-types/validation/validate-array-type-at-most-once/validate-array-type-at-most-once.test.ts`
- `packages/service/src/features/global/footer/adaptor/loader.test.ts`, `query.test.ts`, `packages/service/src/shared/transformers/social-profile/to-social-profiles.test.ts`
- `apps/web/src/components/shared/site-footer/site-footer.test.tsx`, `apps/web/src/server/site-config/get-footer-style/get-footer-style.test.ts`, `get-powered-by-mark/get-powered-by-mark.test.ts`, `get-effective-plan/get-effective-plan.test.ts`, `social-links/social-links.test.tsx`, `social-links/social-link.test.tsx`
- `packages/ui/src/components/organisms/footer/footer.test.tsx`
- Stories: `packages/ui/src/components/organisms/footer/footer.stories.tsx`, `apps/web/src/components/shared/social-links/social-links.stories.tsx`.

## Related

- #3726 — the footer renders the editor's footer content.
- #4995 — the current page in navigation, footer links included, is marked by more than colour.
- #6743 — the Cookie settings link follows Look's choice and the cookie banner.

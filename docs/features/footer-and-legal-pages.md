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

The site footer closes every page with a copyright line, the site's social profiles as icon links, an optional language switcher, the cookie settings button and a link to the RSS feed. The footer half is built. Legal pages are not: the footer has no field for legal links, no privacy, terms or imprint page type exists, and the consent banner has no policy page to point to. A legal text can be published as an ordinary landing page and linked from the header navigation, but the footer has nowhere to link it.

## Surfaces and routes

- **Public site:** every page rendered inside `app/[tenant]/[locale]/layout.tsx`, which mounts `SiteFooter`. The standalone 404 boundaries above that layout have no footer.
- **Studio:** Settings → Footer, the `settings_footer` singleton — Social Links, Show language switcher, Show RSS feed. The copyright name is the brand name in Settings → Site Settings.
- **Platform:** no footer editor. Look styles it through the theme tokens and picks the switcher style.

## Data

- **`settings_footer`:** `title`, `social[]` (`socialProfile` objects), `showLanguageSwitcher` (boolean, initial `false`), `showRssFeed` (boolean, initial `true`). Provisioning seeds it empty, and seed verification requires the singleton.
- **`socialProfile`:** a required `link` reference to a `link` document plus a `platform` from `SOCIAL_PLATFORMS` (X, GitHub, LinkedIn, YouTube, Instagram, Mastodon, Bluesky, Facebook, Threads, RSS). The same object backs `person.socialLinks` (./people.md), through one shared fragment and transformer.
- **Service:** `service.global.footer.v1.getFooter(sanityContext)` returns `{ social: TSocialProfile[], showLanguageSwitcher?, showRssFeed }`, with `showRssFeed` defaulting to `true` when unset. A profile whose link has no label or no resolvable href is dropped.
- **Cache:** the query is tagged `footer`, `link` and every page type, tenant-scoped; the publish webhook maps `settings_footer` → `footer` and `link` → `link`.
- **Copyright:** `© {year} {brand name}`, the year computed at render time; the format is fixed in `@blog/ui`'s `Footer.Copyright` and no editor or owner can reword it.
- **Legal pages:** no schema, table or route exists for them.

## Configuration

- **Editors** manage social profiles, the switcher toggle and the RSS toggle in Studio; a profile's destination is edited on its `link` document (./links.md).
- The switcher shows only with two or more live languages, and Studio hides its toggle otherwise (./languages.md). Its style comes from Look (./look.md).
- The cookie settings button reopens the consent preferences dialog (./consent-and-analytics.md). The RSS link goes to the current language's feed (./seo-and-feeds.md).
- Nothing in the footer is plan-gated.

## Constraints and invariants

- A social link renders as an icon only. Its accessible name is derived from the platform through the catalog's `socialLinks.linkAriaLabel`, never stored per link, so it stays translated; the list is named by `socialLinks.listAriaLabel`.
- A social profile holds no destination of its own — always a `link` document reference.
- Footer order is fixed in code: social links, language switcher, cookie settings, RSS.
- A failed site-settings read renders no footer. A failed footer read is logged (`footer.layout_fetch_failed`) and the footer renders with no social links and no switcher, and with the RSS link shown.
- The footer's links (`TextLink` `appearance="nav"`), including the footer language codes, mark the current item with `aria-current="page"` and the active colour and underline.
- `@blog/ui`'s `Footer` is a compound shell (`Footer.Nav`, `Footer.Copyright`) and stays prop-driven; `apps/web` composes the content.

## Dependencies

- Layers: `studio` (schema), `service` (loader), `ui` (footer shell), `web` (composition).
- Features: ./links.md, ./languages.md, ./look.md, ./people.md, ./consent-and-analytics.md, ./seo-and-feeds.md, ./navigation.md, ./rendering-and-caching.md, ./tenant-provisioning.md.
- Env: none of its own.

## Entry points

- `packages/studio/src/schema-types/documents/settings/footer/footer.ts`
- `packages/studio/src/schema-types/objects/social-profile/social-profile.ts`
- `packages/service/src/features/global/footer/adaptor/query.ts`, `transformer.ts`
- `apps/web/src/components/shared/site-footer/site-footer.tsx`
- `apps/web/src/components/shared/social-links/social-link.tsx`
- `packages/ui/src/components/organisms/footer/footer.tsx`

## Tests and stories

- `packages/service/src/features/global/footer/adaptor/loader.test.ts`, `packages/service/src/shared/transformers/social-profile/to-social-profiles.test.ts`
- `apps/web/src/components/shared/site-footer/site-footer.test.tsx`, `social-links/social-links.test.tsx`, `social-links/social-link.test.tsx`
- `packages/ui/src/components/organisms/footer/footer.test.tsx`
- Stories: `packages/ui/src/components/organisms/footer/footer.stories.tsx`, `apps/web/src/components/shared/social-links/social-links.stories.tsx`.

## Related

- #3726 — a tenant-owned privacy-policy page, linked from the consent banner and the footer.
- #4995 — the current page in navigation, footer links included, is marked by more than colour.

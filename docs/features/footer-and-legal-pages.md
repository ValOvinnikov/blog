---
title: Footer and legal pages
status: built
layers: [config, studio, service, ui, web, worker, platform]
code:
  - packages/studio/src/schema-types/documents/settings/footer/**
  - packages/studio/src/schema-types/documents/pages/privacy-index/**
  - packages/studio/src/schema-types/documents/pages/legal-index/**
  - packages/studio/src/schema-types/documents/pages/section-document/**
  - packages/studio/src/schema-types/documents/pages/privacy-document/**
  - packages/studio/src/schema-types/documents/pages/legal-document/**
  - packages/studio/src/schema-types/documents/pages/cookie-statement/**
  - packages/config/src/constants/legal-page-kind.ts
  - packages/config/src/starter-content/legal-pages.ts
  - packages/config/src/starter-content/cookie-statement-document.ts
  - packages/service/src/features/global/footer/**
  - packages/service/src/features/pages/section-index/**
  - packages/service/src/features/pages/section-document/**
  - packages/service/src/features/pages/cookie-statement/**
  - packages/ui/src/components/organisms/footer/**
  - apps/web/src/components/shared/site-footer/**
  - apps/web/src/components/page-templates/document-article/**
  - apps/web/src/components/pages/section-index-page/**
  - apps/web/src/components/pages/section-document-page/**
  - apps/web/src/components/pages/cookie-statement-page/**
  - apps/web/src/app/api/legal-page/**
  - apps/worker/src/app/api/cookie-statement/**
  - apps/platform/src/server/cookie-statement/**
epics: [3726, 4995, 6505]
---

# Footer and legal pages

## What it does

The site footer closes every page with a brand column (the Look logo, an about line, an address and the site's social profiles as icon links), the editor's link groups under their headings, and a fine-print row: the copyright line, the editor's fine-print links and, when the owner's choice includes it, the Cookie settings link. An optional language switcher and a link to the RSS feed sit beside the fine print. On a Free site, a "Powered by" link to the marketing site closes the bottom row: the label followed by the one-colour Shinefold logo, drawn in the fine print's text colour on any theme. Every site also has a privacy section, a legal section and a cookie statement. `/privacy` and `/legal` are hubs built from a heading and landing modules; their documents live at `/privacy/[slug]` and `/legal/[slug]`, each with a kind (privacy policy, terms, imprint or other). The cookie statement is one page per language at `/legal/cookie-statement`, which the consent banner links to. The footer links any of them as ordinary links; the platform's signup and onboarding reach the terms and privacy policy by kind, through a public redirect.

## Surfaces and routes

- **Public site:** every page rendered inside `app/[tenant]/[locale]/layout.tsx`, which mounts `SiteFooter`. The standalone 404 boundaries above that layout have no footer.
- **Public site, legal pages:** `/privacy` and `/legal` (hubs), `/privacy/[slug]` and `/legal/[slug]` (documents), `/legal/cookie-statement` (the cookie statement), and `/api/legal-page/[kind]`, which redirects to the published document of that kind in the tenant's default language. All five page routes are in the sitemap and follow the language switch.
- **Studio:** Privacy Index Page and Legal Index Page (one per language, with their templates), Privacy Page and Legal Page (`page_privacyDocument`, `page_legalDocument`) and Cookie Statement (`page_cookieStatement`).
- **Studio, footer:** Settings → Footer, the `settings_footer` singleton — Social Links, Groups, About, Address, Copyright name, Fine Print, Show language switcher, Show RSS feed. The copyright line shows Copyright name, or the brand name when it is blank; the Big wordmark always shows the brand name. The brand name is set on Look's Brand card, or is the tenant name when that is blank (./look.md).
- **Platform:** Look › Footer sets Footer layout (Columns default · Centred · Compact · Big wordmark), Background (Plain · Shaded · Brand tint default) and Surface (Full width default · Card), all Growth-only, plus the Cookie settings button (./consent-and-analytics.md). Look also picks the switcher style and the theme tokens.

## Data

- **`settings_footer`:** `title`, `social[]` (`socialProfile` objects), `groups[]` (`footerLinkGroup` objects), `about` (localized one-line text), `address` (localized multi-line text), `copyrightName` (localized one-line text, empty by default), `finePrint[]` (`linkRef` items and at most one `cookieSettingsItem`), `showLanguageSwitcher` (boolean, initial `false`), `showRssFeed` (boolean, initial `true`). Every field after `social` is optional. Provisioning seeds it empty, and seed verification requires the singleton.
- **`footerLinkGroup`:** a localized `heading`, required in the default language, and `links[]`, one or more `linkRef`s in order. No fixed categories.
- **`cookieSettingsItem`:** marks where the Cookie settings link sits in the fine print; it has no editable field. Whether the link shows is decided by Look › Footer and the cookie banner, never by the item.
- **`socialProfile`:** a required `link` reference to a `link` document plus a `platform` from `SOCIAL_PLATFORMS` (X, GitHub, LinkedIn, YouTube, Instagram, Mastodon, Bluesky, Facebook, Threads, RSS). The same object backs `person.socialLinks` (./people.md), through one shared fragment and transformer.
- **Service:** `service.global.footer.v1.getFooter(sanityContext)` returns `{ social: TSocialProfile[], groups: TFooterLinkGroup[], about?, address?, finePrint: TFooterFinePrintItem[], showLanguageSwitcher?, showRssFeed }`, with `showRssFeed` defaulting to `true` when unset. The heading, about and address resolve in the visitor's language, falling back to the default. Each fine-print item is a `FOOTER_FINE_PRINT_KIND.LINK` with its link or the one `COOKIE_SETTINGS` marker, in Studio order. A link whose document is missing, unpublished, unlabelled or without a resolvable href is dropped, from a profile, a group or the fine print alike; a group left with no links is dropped, and none of it fails the footer query.
- **Cache:** the query is tagged `footer`, `link` and every page type, tenant-scoped; the publish webhook maps `settings_footer` → `footer` and `link` → `link`.
- **Look:** `site_config.footer_layout`, `footer_background`, `footer_surface` and `cookie_settings_button`, read by `getFooterStyle` through `getSiteConfig`, so a plan without the field gets the preset's value. A failed read logs `footer.site_config_fetch_failed` and falls back to the preset (Columns, Brand tint, Full width, Cookie settings as the footer link).
- **Copyright:** `© {year} {copyright name or brand name}`, the year computed at render time; the format is fixed in `@blog/ui`'s `Footer.Copyright` and no editor or owner can reword it.
- **Powered-by mark:** `getPoweredByMark(tenant)` returns the link from `MARKETING_SITE_URL` when the tenant's plan carries `PLAN_ENTITLEMENTS[plan].hasPoweredByMark` (`FREE` yes, `STARTER` and `GROWTH` no), reading the plan through `getEffectivePlan`, as the Look does. When the plan cannot be read, Free's rules apply. Its label is the fixed catalog key `siteFooter.poweredByLabel`, translated in every site language.
- **Hubs:** `page_privacyIndex` and `page_legalIndex`, index pages (heading block plus their template's hero and modules), one per language, read by `service.pages.sectionIndex`.
- **Documents:** `page_privacyDocument` and `page_legalDocument` share one schema (`sectionDocumentSchema`): `language`, `title` (internal to the Studio, never shown on the site), the page heading block (`headingBlock`, `contentAlignment`), `slug`, `kind` and `content` (`articleText`; each document is one language), plus `seo`. Kinds come from `LEGAL_PAGE_KIND`: `PRIVACY_POLICY` and `OTHER` under privacy (`PRIVACY_DOCUMENT_KINDS`), `TERMS`, `IMPRINT` and `OTHER` under legal (`LEGAL_DOCUMENT_KINDS`).
- **Cookie statement:** `page_cookieStatement` with `language`, `title`, the heading block, `content` and `seo`; its kind is always `COOKIE_STATEMENT`. Its fixed id comes from `cookieStatementDocumentId(locale)`.
- **Service:** `service.pages.sectionDocument.v1` loads a document by type and slug, lists params for the sitemap and resolves `getSectionDocumentByKind(kind, context)` (a cookie statement for `COOKIE_STATEMENT`); `service.pages.cookieStatement.v1.getCookieStatementPage` loads the statement. Both detail loaders return `headingBlock` (undefined when unset) and `headingAlignment` (left when unset).
- **Seeding:** provisioning seeds both hubs and the cookie statement from `packages/config/src/starter-content/legal-pages.ts`. Adding a language seeds only the cookie statement: the platform's language action enqueues a signed `POST /api/cookie-statement/seed` on the worker (`enqueueCookieStatementSeed`) with the default and every added language, and the worker's `seedCookieStatements` run writes `buildStarterCookieStatement(locale)` with `createIfNotExists`. The starter text is a placeholder until the final text lands (#5090).

## Configuration

- **Editors** manage social profiles, link groups, the about line, the address, the copyright name, the fine-print links, the switcher toggle and the RSS toggle in Studio; a profile's destination is edited on its `link` document (./links.md).
- The switcher shows only with two or more live languages, and Studio hides its toggle otherwise (./languages.md). Its style comes from Look (./look.md).
- The cookie settings button reopens the consent preferences dialog (./consent-and-analytics.md). The RSS link goes to the current language's feed (./seo-and-feeds.md).
- Layout, Background and Surface are Growth-only; a Free site renders the preset's. The content is not plan-gated.
- The powered-by mark follows the plan alone: Free cannot hide it, and Starter and Growth cannot show it. A plan change shows or hides it on the next page load.
- Big wordmark sets the brand name large and `aria-hidden`, since the copyright line already names the site. Compact shows no groups, about text or address.

## Constraints and invariants

- A document page and the cookie statement render the heading block as their only H1, in its alignment, above the text column and the contents rail; the `title` never appears on the site. A document without a heading block renders no page heading — a dev-only state, since the Studio requires the heading.
- At most one published page per kind and language; `OTHER` is unlimited and is reached by links only, so `/api/legal-page/OTHER` and an unknown kind return 404, as does a kind with no published page.
- A legal page can't take the slug `cookie-statement`. The cookie statement can't be created, deleted, duplicated or unpublished in the Studio; one per language exists from seeding.
- A language goes live at once and its cookie statement follows within seconds; until the seed lands, its `/legal/cookie-statement` returns 404. A failed seed retries and never undoes the language change. Stored-but-not-live languages are seeded too.
- Footer links stay ordinary `linkRef`s; the footer has no kind field. Only the platform links by kind (`toLegalPageUrls`).

- A social link renders as an icon only. Its accessible name is derived from the platform through the catalog's `socialLinks.linkAriaLabel`, never stored per link, so it stays translated; the list is named by `socialLinks.listAriaLabel`.
- A social profile holds no destination of its own — always a `link` document reference.
- Footer order is fixed in code: the brand column (logo, about, address, social links), the groups, then the bottom row — copyright, fine print, language switcher, RSS, then the powered-by mark. Each part renders only when it has content.
- The Cookie settings link renders in the fine print only with the `CONSENT_BANNER` capability on and Look's choice Footer link or Both (`resolveCookieSettingsControls`): at the `cookieSettingsItem`'s position when set, at the end otherwise, and once even if the item repeats. With the choice Floating button, or the banner off, it is left out even where the item sits.
- A group or fine-print link whose href an earlier one already carries is skipped, groups before fine print; a group left with no links, or with no heading, is dropped. A link opens in a new tab only when its `link` document says so.
- The powered-by mark (`Footer.PoweredBy`) is always the last item of the bottom row and sits after the fine-print `nav`, never inside it. It opens in the same tab. It is one link: the label, then the `MONO` logo from `@blog/utils/shinefold-logo` filled with `currentColor`, 1.25em tall with its lettering on the text baseline; the logo is an `img` named `SHINEFOLD_LOGO_NAME` ("Shinefold") from the same module, whatever any environment setting says, so the link's accessible name is the label followed by "Shinefold". With `MARKETING_SITE_URL` unset it is not drawn, and `footer.powered_by_unconfigured` is logged.
- The groups and the fine print are two `nav` landmarks named by the fixed catalog keys `siteFooter.groupsAriaLabel` and `siteFooter.finePrintAriaLabel`.
- The footer reads no Site Settings. A failed Look read names the site with the tenant name; with no tenant at all the copyright line is left out. A failed footer read is logged (`footer.layout_fetch_failed`) and the footer renders with no editor content and no switcher, and with the copyright, RSS link and, when the choice includes it, Cookie settings shown.
- The footer's links (`TextLink` `appearance="nav"`), including the footer language codes, mark the current item with `aria-current="page"` and the active colour and underline.
- `@blog/ui`'s `Footer` is a compound shell (`Footer.Logo`, `About`, `Address`, `Social`, `Groups`/`Group`/`GroupItem`, `Wordmark`, `Copyright`, `FinePrint`, `Nav`, `PoweredBy`) and stays prop-driven; `apps/web` composes the content. On a phone the groups sit two per row.
- The `Footer` lays out by its own width (container queries on `@container/footer`), never the window's, so it renders the same in any frame; on the public site it spans the window. The Big wordmark's `text-wordmark` size scales with the footer's width (`cqi`) for the same reason.

## Dependencies

- Layers: `config` (kinds, routes, starter content), `studio` (schemas), `service` (loaders), `ui` (footer shell), `web` (composition and pages), `worker` (cookie-statement seed), `platform` (seed enqueue and by-kind links).
- Features: ./rich-text.md (the document text and its legal blocks), ./reading-experience.md (the contents rail), ./links.md, ./languages.md, ./look.md, ./people.md, ./consent-and-analytics.md, ./seo-and-feeds.md, ./navigation.md, ./rendering-and-caching.md, ./tenant-provisioning.md.
- Env: `MARKETING_SITE_URL` (web), for the powered-by mark.
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
- `packages/studio/src/schema-types/documents/pages/section-document/section-document.ts`, `cookie-statement/cookie-statement.ts`, `privacy-index/privacy-index.ts`, `legal-index/legal-index.ts`
- `packages/studio/src/document-actions/document-options/document-options.ts` (the cookie statement's locked actions)
- `apps/web/src/app/[tenant]/[locale]/privacy/**`, `legal/**`, `apps/web/src/app/api/legal-page/[kind]/route.ts`
- `apps/web/src/components/page-templates/document-article/document-article.tsx`
- `apps/worker/src/app/api/cookie-statement/seed/route.ts`, `apps/worker/src/units/ensure-cookie-statements-seeded.ts`
- `apps/platform/src/server/cookie-statement/enqueue-cookie-statement-seed.ts`, `apps/platform/src/utils/legal-page-urls/legal-page-urls.ts`

## Tests and stories

- `packages/studio/src/schema-types/validation/validate-array-type-at-most-once/validate-array-type-at-most-once.test.ts`
- `packages/service/src/features/global/footer/adaptor/loader.test.ts`, `query.test.ts`, `packages/service/src/shared/transformers/social-profile/to-social-profiles.test.ts`
- `apps/web/src/components/shared/site-footer/site-footer.test.tsx`, `apps/web/src/server/site-config/get-footer-style/get-footer-style.test.ts`, `get-powered-by-mark/get-powered-by-mark.test.ts`, `get-effective-plan/get-effective-plan.test.ts`, `social-links/social-links.test.tsx`, `social-links/social-link.test.tsx`
- `packages/ui/src/components/organisms/footer/footer.test.tsx`
- `apps/web/src/components/page-templates/document-article/document-article.test.tsx`, `section-document-page.test.tsx`, `cookie-statement-page.test.tsx`, `apps/web/src/app/api/legal-page/[kind]/route.test.ts` and the route tests under `app/[tenant]/[locale]/privacy` and `legal`.
- `packages/service/src/features/pages/section-document/**/*.test.ts`, `cookie-statement/**/*.test.ts`, `section-index/**/*.test.ts`.
- `apps/worker/src/app/api/cookie-statement/seed/route.test.ts` and `ensure-cookie-statements-seeded.test.ts`.
- Stories: `packages/ui/src/components/organisms/footer/footer.stories.tsx`, `apps/web/src/components/shared/social-links/social-links.stories.tsx`, `apps/web/src/components/page-templates/document-article/document-article.stories.tsx`.

## Related

- #3726 — the footer renders the editor's footer content.
- #4995 — the current page in navigation, footer links included, is marked by more than colour.
- #6743 — the Cookie settings link follows Look's choice and the cookie banner.
- #6505 epic — the privacy and legal sections and the cookie statement; manual test #5101.
- #5090 — the final cookie-statement starter text.

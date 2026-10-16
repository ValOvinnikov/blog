---
title: Languages
status: built
layers: [config, db, studio, service, web, platform]
code:
  - packages/config/src/constants/language.ts
  - packages/db/src/queries/tenants/get-tenant-locales/**
  - packages/db/src/queries/tenants/get-tenant-live-locales/**
  - packages/db/src/queries/tenants/set-tenant-additional-locales/**
  - packages/studio/src/structure/locales/**
  - packages/studio/src/schema-types/fields/language-field/**
  - packages/studio/src/schema-types/fields/language-switcher-field/**
  - packages/studio/src/schema-types/inputs/language-switcher-field/**
  - packages/studio/src/schema-types/inputs/localization-notice-input/**
  - packages/studio/src/schema-types/inputs/single-language-input/**
  - packages/studio/src/schema-types/inputs/translation-link-input/**
  - packages/studio/src/schema-types/validation/*language*/**
  - packages/service/src/shared/localization/**
  - packages/service/src/features/global/translation-map/**
  - apps/web/src/i18n/**
  - apps/web/src/app/api/switch-language/**
  - apps/web/src/components/shared/language-switcher/**
  - apps/web/src/server/translation-map/**
  - apps/web/src/utils/*language*/**
  - apps/web/src/utils/find-translated-path/**
  - apps/web/src/utils/match-accept-language/**
  - apps/platform/src/components/features/languages/**
  - apps/platform/src/server/tenants/update-tenant-languages-action*.ts
  - apps/platform/src/app/*/dashboard/*/languages/**
  - apps/platform/src/app/*/tenants/*/*/languages/**
epics: [4979, 4981, 4998]
---

# Languages

## What it does

A tenant's site is published in one or more languages from a curated list — English, Dutch, French, German and Spanish. The default language serves unprefixed URLs and every other live language serves under its own prefix (`/nl/…`). Pages are translated as separate documents linked to one another; everything without a URL of its own (links, navigation, footer, settings, modules, blocks, people, topic and tag titles) holds a value per language and falls back to the default language. The plan caps how many languages are live; a language switched off by a downgrade stays stored and comes back on upgrade.

## Surfaces and routes

- **Platform:** `/dashboard/languages` — shown and served only when the plan allows more than one language, otherwise hidden from the sidebar and a 404 — and `/tenants/<tenantId>/languages`, the operator view, which ignores the plan. Both list the default language, the stored additional languages, which of them are live, and the plan's limit. An operator sets the default language in the tenant details form.
- **Public site:** every route under `app/[tenant]/[locale]/`; `/api/switch-language?to=&from=`, which redirects to the current page's translation and remembers the choice; one RSS feed per language (`/rss.xml`, `/<lang>/rss.xml`, likewise per tag).
- **Language switcher:** in the header and footer when `settings_navigation.showLanguageSwitcher` / `settings_footer.showLanguageSwitcher` is on, and only with two or more live languages. Style comes from Look: `MENU_CODE` (default), `MENU_GLOBE` or `CODES`, with `CODES` falling back to `MENU_CODE` past four languages. In `CODES`, the current language's code is marked text, not a link: no pointer, no hover, skipped by Tab, and announced as current in its own language.
- **Studio:** the language filter and one create template per language on translated page types, translation links on the one-per-language types, per-document and per-field notices naming missing languages, and a notice on a `link` whose internal target is untranslated.

## Data

- **Neon:** `tenants.locale` (the default, `locale_code` enum), `tenants.additional_locales` (enum array, default `[]`), `tenants.plan`. `PLAN_LOCALE_LIMIT` (`@blog/db`) counts the default: `FREE` 1, `GROWTH` 3. `selectLiveLocales` returns the default plus the first `limit − 1` stored additional languages, in stored order.
- **Config:** `LOCALE_ISO_CODES` (`EN`, `NL`, `FR`, `DE`, `ES` — the stored and internal codes), `LOCALE_BCP47_TAGS` (URL prefixes and `<html lang>`), `LOCALE_OPEN_GRAPH_TAGS`, `LOCALE_NATIVE_LABEL`.
- **Sanity, document level** (`@sanity/document-internationalization`): a `language` field plus `translation.metadata` documents on `page_home`, `page_postIndex`, `page_topicIndex`, `page_tagIndex` (at most one per language) and `page_landing`, `page_post`, `page_topic`, `page_tag`. Each translation has its own slug, SEO and publish state; pages share their `template_*` across languages.
- **Sanity, field level** (`sanity-plugin-internationalized-array`): `internationalizedArray*` values for strings, text and the three Portable Text types.
- **Service:** `runQuery` sends `$locale` and `$defaultLocale`; `getLocalizedField` coalesces the request language then the default; `translatedReference` follows a page reference to its translation; post lists and counts return only the request language. `service.global.translationMap` (ISR tags `translation.metadata` and every page type) drives redirects and the switcher.
- **Caching:** the proxy reads the tenant row on every request, uncached, so routing follows a Languages save at once. The save triggers no revalidation, so a page already cached keeps the switcher and `hreflang` alternates it was rendered with until it revalidates.

## Configuration

- **Owner or member:** chooses additional languages on the Languages page, within the plan limit. **Operator:** sets the default language in the tenant details form, and opens the Languages page for any tenant whatever its plan; additional languages stay capped by the plan for operators too.
- **Editors:** translate in the embedded Studio, which receives the default and live languages from the platform mount.
- **Look:** the switcher style control appears only with more than one live language; with one, its card shows a note instead. **Voice:** overrides are kept per live language (./voice.md).

## Constraints and invariants

- The default language is never also an additional one (`DB_DEFAULT_LOCALE_REPEATED`; the tenant details form refuses `localeIsAdditional`). Changing the default rewrites the column only; it moves no content.
- Past the plan limit a save may reorder or drop stored languages but not add one that is not stored (`DB_LOCALE_LIMIT_EXCEEDED`), so a downgraded tenant picks which stay live without losing the others. Each save writes a `SETTINGS_UPDATED` audit event on the tenant.
- A request for a supported language the tenant does not serve redirects to the same path in the default language; its content stays published.
- An unprefixed request redirects to a translation only when the tenant has two or more live languages, the method is `GET`/`HEAD`, the client is not a crawler, the preferred language (the `NEXT_LOCALE` cookie, else `Accept-Language`) is not the default, and the translation map has that page in it. Crawlers always get the default language.
- `localeDetection` is off and `localePrefix` is `as-needed`. Fixed path segments (`/blog`, `/topics`, `/tags`) are not translated.
- `NEXT_LOCALE` is written by `/api/switch-language` and, because `buildTenantRouting` leaves next-intl's own locale cookie on, by next-intl's middleware on page requests.
- A page with no document in the requested language is a 404; a missing Home, blog, topics or tags list page in a non-default language redirects to the default language's home page instead. The switch goes to the current page's translation, else that language's list page for a post, topic or tag page, else that language's Home.
- A missing field-level value falls back to the default language, field by field; a missing translation never blocks publishing. With fewer than two live languages Studio hides the language machinery entirely, including the switcher toggles.
- All in-app links go through `SmartLink`, which prefixes the current language. A language outside `LOCALE_ISO_CODES` (another script, right-to-left) is a project, not a list entry.
- Every page carries `hreflang` alternates for its live translations plus `x-default`, a per-language canonical, `og:locale` and `og:locale:alternate`; a page with no live translation carries only its canonical.

## Dependencies

- Features: ./multi-tenancy.md (host → tenant in `proxy.ts`), ./plans-and-entitlements.md, ./embedded-studio.md, ./page-types.md, ./links.md, ./navigation.md, ./footer-and-legal-pages.md, ./look.md, ./voice.md, ./seo-and-feeds.md, ./rendering-and-caching.md, ./bookmarks.md (a bookmark belongs to one language version).
- Env: none of its own.

## Entry points

- `apps/web/src/proxy.ts`, `apps/web/src/i18n/routing.ts`, `apps/web/src/server/request-context/request-context.ts`
- `apps/web/src/app/api/switch-language/route.ts`, `apps/web/src/components/shared/language-switcher/language-switcher.tsx`
- `apps/web/src/utils/with-language-alternates/with-language-alternates.ts`, `apps/web/src/utils/redirect-missing-language-page/redirect-missing-language-page.ts`
- `packages/db/src/queries/tenants/get-tenant-live-locales/get-tenant-live-locales.ts`, `set-tenant-additional-locales/set-tenant-additional-locales.ts`, `packages/db/src/constants/tenant.ts`
- `packages/studio/src/studio-config.ts` (plugin wiring, translated type lists)
- `packages/service/src/shared/localization/get-localized-field/get-localized-field.ts`
- `apps/platform/src/server/tenants/update-tenant-languages-action.ts`, `apps/platform/src/utils/plan-page-access/plan-page-access.ts`

## Tests and stories

- `apps/web`: `src/proxy.test.ts`, `src/i18n/request.test.ts`, `app/api/switch-language/route.test.ts`, `components/shared/language-switcher/language-switcher.test.tsx`, and tests beside the `find-translated-path`, `language-cookie`, `match-accept-language` and `to-switch-language-target` utils.
- `packages/service/src/shared/localization/**/*.test.ts`; `packages/db/src/queries/tenants/{get-tenant-live-locales,set-tenant-additional-locales}/*.test.ts`; `packages/studio/src/schema-types/inputs/localization-notice-input/*.test.ts`, `packages/studio/src/structure/locales/order-locales.test.ts`.
- `apps/platform`: `components/features/languages/languages-settings/languages-settings.test.tsx`, `server/tenants/update-tenant-languages-action.test.ts`.
- Story: `apps/web/src/components/shared/language-switcher/language-switcher.stories.tsx`.

## Related

- #4979 — epic: the public sites and the admin share no browser state, language included.
- #4981 — only the language switcher writes the remembered language.
- #4998 — the header language pill cancels the nav link's current-page cue.

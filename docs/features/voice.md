---
title: Voice
status: built
layers: [config, db, web, platform]
code:
  - packages/config/src/voice/**
  - apps/platform/src/components/features/voice/**
  - apps/platform/src/components/features/site-preview/voice-*/**
  - apps/platform/src/server/site-config/save-voice-overrides-action*.ts
  - apps/platform/src/utils/voice-draft/**
  - apps/platform/src/app/*/dashboard/*/voice/**
  - apps/platform/src/app/*/tenants/*/*/voice/**
  - apps/web/src/utils/resolve-tenant-messages/**
  - apps/web/src/utils/resolve-voice-rich-fields/**
  - apps/web/src/utils/wrap-voice-text/**
  - apps/web/src/utils/fill-voice-placeholders/**
  - apps/web/src/utils/voice-portable-text-to-inline-text/**
  - apps/web/src/server/site-config/get-voice-rich/**
  - apps/web/src/context/voice-rich-provider/**
  - apps/web/src/components/shared/voice-rich-text/**
epics: [4022]
---

# Voice

## What it does

Voice lets a site owner reword the page-level prose the public site writes in its own voice — the empty states of the post list, topic, tag and bookmarks pages and the taxonomy lists, and the 404 and error pages — separately for each live language. Everything else the site's chrome says (buttons, labels, statuses, accessibility names, toasts) comes from a fixed catalog the platform translates and no tenant can edit. An override replaces the catalog default for one language; clearing it restores the default.

## Surfaces and routes

- **Platform:** `/dashboard/voice` (a member's own site) and `/tenants/<tenantId>/voice` (operator view), both rendering `VoicePageContent`. One language at a time through a switcher over the live languages, each showing its customised count; one card per surface in page order (404, error, archive, bookmarks), each field with a control for its kind, the catalog default as placeholder, a Default/Customised badge, Reset and a "Keep `{name}`" note, beside a specimen of that surface. Empty-state lists show as compact rows, one open at a time. Saving goes through the shared settings save bar.
- **Public site:** `module_postList` empty state (blog, topic and tag archives), `module_taxonomyList` empty state, `/bookmarks`, the in-layout 404 (`LocaleNotFoundPage`), `app/[tenant]/not-found.tsx`, and the locale error boundary (`[tenant]/[locale]/error.tsx`). `app/global-not-found.tsx` resolves no tenant and renders the English catalog.
- **Studio:** none. Curated UI copy has no Studio home.

## Data

- **Registry:** `VOICE_FIELDS` (`packages/config/src/voice/voice-fields.ts`) — 11 fields, each with a storage `id`, catalog `path`, `kind` (`TEXT`, `MULTILINE`, `RICH`), `surface` (`ARCHIVE`, `NOT_FOUND`, `ERROR`, `BOOKMARKS`), required `placeholders` and a `max` length. Eight are `RICH`, three `TEXT` (`notFoundEyebrow`, `notFoundHeading`, `localeErrorTitle`); `topicEmpty` and `tagEmpty` require `{name}`.
- **Catalog:** `site-messages.{en,nl,fr,de,es}.json`, exposed as `SITE_MESSAGES_BY_LOCALE`; every language `satisfies` the English shape, so a missing key fails type-check. `VOICE_FIXED_KEYS` lists every catalog key that stays fixed.
- **Rich text shape:** `TVoicePortableText` — `normal` blocks of spans with `strong`/`em` decorators and `link` annotations (`VOICE_PORTABLE_TEXT_SCHEMA`).
- **Neon:** `site_config.voice_overrides` (jsonb, not null, default `{}`), typed `voiceOverridesByLocale`: `{ [locale]: { [fieldId]: string | TVoicePortableText } }`. One row per tenant, shared with Look.
- **Cache:** `apps/web` reads the row through `getSiteConfig` — `unstable_cache` under the tenant's site-config tag with a `TENANT_CONFIG_REVALIDATE_SECONDS` (3600s) fallback — the same read that feeds theme tokens. A save POSTs to `apps/web`'s `/api/revalidate-site-config`, which expires that tenant's site-config, features and plan tags and purges `revalidatePath('/', 'layout')`.

## Configuration

- Any member of the tenant, whatever their role, or any platform admin (a virtual owner membership) can edit Voice — `requireTenantMembership`. The page is not plan-gated and sits in every tenant's sidebar.
- The page edits only the tenant's live languages (./languages.md). Overrides stored for a language a downgrade switched off stay in the row and apply again once it is live.
- The form is read-only for a deprovisioned tenant.
- Specimens render in the tenant's Look (accent and logo hue, fonts, radius, density, card style) with the Look preview's light/dark toggle; Voice never changes Look.

## Constraints and invariants

- Every key in `site-messages.en.json` is either a `VOICE_FIELDS` path or on `VOICE_FIXED_KEYS`, never both, and no fixed key is stale (`voice-fields.test.ts`). A new catalog string cannot ship unclassified; page-level prose is a Voice candidate, everything else is fixed, and the classification is decided per string.
- Validation is generated from the registry inside `upsertSiteConfig` (`@blog/db`): values are trimmed and a blank value removes the override; `TEXT` rejects line breaks; length is capped at `max` (a `RICH` value measured as plain text); placeholders must match exactly — none missing, none unknown; a `RICH` value must fit the rich text shape and every link `href` must pass `sanitizeHref`; a plain string sent for a `RICH` field is wrapped as one paragraph. Failures come back per language as `fieldErrorsByLocale`; an unknown field id or locale throws as a malformed request.
- A save sends every live language in one call and stores all of them or none. On update it merges per language (jsonb `||`): each language it carries is replaced whole, every other language is left as stored; the six required Look columns (`preset`, `accentHue`, `headingFont`, `bodyFont`, `radiusScale`, `density`) are rewritten with the values just read (defaults if no row yet), and the other Look columns are left as stored.
- Each save records a `SETTINGS_UPDATED` audit event on the `SITE_CONFIG` target with the submitted overrides.
- On the site, a request's messages are its language's catalog with that language's overrides set at their registry paths. A `RICH` override is projected to plain text for the `next-intl` message leaf (metadata derives from it); components render the Portable Text through `VoiceRichProvider`/`useVoiceRich` on the client or `getVoiceRich` on the server, and a field with no override renders its catalog string as one paragraph. `{name}` is filled by `fillVoicePlaceholders`.
- A failed `site_config` read serves the base catalog and logs `site_config.fetch_failed`; a tenant with no row serves the base catalog silently. Neither is an error page.
- Curated copy has one home: no module or Studio field may carry copy a Voice field already owns.
- The specimen placement map is `Record<TVoiceFieldId, …>`, so registering a field without placing it in the preview fails type-check.

## Dependencies

- Layers: `@blog/config` (registry, catalog), `@blog/db` (`site_config`, validation), `apps/platform` (editor), `apps/web` (resolution). The specimens import `@blog/ui` from `site-preview/`, the one platform directory allowed to.
- Features: ./look.md (shared row, save bar, preview theming), ./languages.md, ./errors-and-404.md, ./post-modules.md, ./taxonomy-list-module.md, ./bookmarks.md, ./rendering-and-caching.md, ./tenant-access.md, ./audit-and-findings.md.
- Env: `SITE_CONFIG_REVALIDATE_SECRET` (web and platform, identical values), `WEB_APP_URL` (platform). Without them a save still lands and appears within the fallback window.

## Entry points

- `packages/config/src/voice/voice-fields.ts`, `voice-fixed-keys.ts`, `site-messages.ts`
- `packages/db/src/queries/site-config/upsert-site-config/upsert-site-config.ts`, `packages/db/src/schema/site-config.ts`
- `apps/platform/src/server/site-config/save-voice-overrides-action.ts`
- `apps/platform/src/components/features/voice/voice-page-content/voice-page-content.tsx`
- `apps/platform/src/components/features/site-preview/voice-specimen/voice-specimen.tsx`
- `apps/web/src/utils/resolve-tenant-messages/resolve-tenant-messages.ts`
- `apps/web/src/components/shared/site-providers/site-providers.tsx`, `apps/web/src/i18n/request.ts`
- `apps/web/src/server/site-config/get-voice-rich/get-voice-rich.ts`

## Tests and stories

- `packages/config/src/voice/*.test.ts` — registry/catalog coverage, plain-text projection.
- `packages/db/src/queries/site-config/upsert-site-config/upsert-site-config.test.ts`, `get-site-config/get-site-config.test.ts`.
- `apps/platform/src/components/features/voice/**/*.test.tsx`, `apps/platform/src/components/features/site-preview/voice-*/*.test.tsx`, `apps/platform/src/utils/voice-draft/voice-draft.test.ts`, `apps/platform/src/server/site-config/save-voice-overrides-action.test.ts`, the two `voice/page.test.tsx` route tests.
- `apps/web`: tests beside `resolve-tenant-messages`, `resolve-voice-rich-fields`, `get-voice-rich`, `voice-rich-provider`, `voice-rich-text`, `wrap-voice-text`, `fill-voice-placeholders`, and `src/i18n/request.test.ts`.
- Stories: `apps/web/src/components/pages/not-found-page/not-found-page.stories.tsx`, `locale-error-page/locale-error-page.stories.tsx`. The platform has no Storybook.

## Related

- #4022 — per-language price period wording in Site Settings; retires the `pricingModule.period.*` catalog keys and their `VOICE_FIXED_KEYS` entries.

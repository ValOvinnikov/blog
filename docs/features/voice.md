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
  - apps/platform/src/utils/voice-sections/**
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

- **Platform:** `/dashboard/voice` (a member's own site) and `/tenants/<tenantId>/voice` (operator view), both rendering `VoicePageContent`. The page stacks its head, the shell notices, the note row, then the sections 20px apart (16 below `md`, through `SettingsFormShell`'s opt-in `hasTightGap`; every other settings page keeps 24). The note row puts the info note first, filling the width, and the "Live preview" label with the Light / Dark group after it — at its right from `md`, right-aligned 12px below it on a phone — so the reading order is heading, language radio group, notices, note, then the switch. One language at a time through a language radio group over the live languages (shown only with more than one, and still operable on an archived tenant), each option's sub-line naming the default language and its customised count, the track scrolling sideways with edge fades below `md`. The cards sit in two collapsible sections, Error pages (404, error) and Empty states (archive, bookmarks), 28px apart from `md` and 16 below. Each section is a `<section id="sec-errors">` / `"sec-empty"` labelled by its `h2`, which holds one button with `aria-expanded` and `aria-controls` naming its one body (`sec-…-body`) in both states, and a meta line: "5 fields · 1 customised", "… · all default", or "… · 1 field needs attention" in red after a rejected save. Collapsed, the body lists a summary row per surface — a link to its card (`#s-notfound`, `#s-error`, `#s-lists`, `#s-bookmarks`) with name, description and count ("3 fields", "5 lists") from `md`, and its Default/Customised pill; activating one opens the section, scrolls the card's header 16px under the top bar, focuses the card's `h3` (`tabindex="-1"`, no ring) and replaces the URL hash. Every section starts collapsed except the one a first-load `#sec-…` or card hash points into, which opens and is scrolled to; with reduced motion every jump scrolls instantly and the chevron does not rotate. Open sections live in `useVoiceDraft` above the card list's re-key, so they survive Save and a language switch, and a rejected save opens the section holding the field. Every customised count — section meta, card summary, language sub-line — counts the draft, saved or not. Each card is a `<section>` labelled by its `h3`, in page order (404, error, archive, bookmarks), beside a specimen of that surface. On the Page not found, Error page and Bookmarks cards the fields stack in a cell padded 18 (14 below `md`), 20 apart, each one a label row (the label, the "Unsaved" dot image whenever the draft differs from the saved value, then the Default/Customised pill — an unsaved edit to a default field already reads Customised), a hint row (the hint, and Reset at its end whenever the value differs from the default, saved or not, and the tenant is not archived; it restores the default into the draft without saving) and the control: a 36px text input (44 below `md`) or the compact rich editor with its toolbar at every width, then the "Keep `{name}`" note and any error. An invalid control carries `aria-invalid` and is described by its hint, note and error, plus the archived notice when archived. Every Voice field at its default — on these cards and in the open Empty lists row — shows the default copy as the control's value, not a placeholder, text and rich alike, a `{name}` token appearing raw beside its "Keep `{name}`" note; the draft is unchanged (an empty string or `null` means default), so text equal to the default is stored as the empty value, a text control emptied while focused stays empty until blur and then shows the default again, and a field that merely shows its default adds to no count while any edit counts, saved or not. The specimen outlines only the slot of the field whose control has focus, none when no field has focus. Empty-state lists show as a `ul` of compact rows, one open at a time; the first row is open when Empty states first opens, and the open row survives Save and a language switch. Each row is a button inside an `h4` with a right chevron that turns down when open; from `md` it shows the list's name over its route in mono ("Shown at /blog") in a 130px column, the value with an ellipsis, then the unsaved dot (whenever the draft differs from the saved value) and the pill, and keeps all of them while open — below `md` only the name, dot, pill and chevron. An open row's button and body sit on `surface-2`; the body is the hint with Reset (whenever the value differs from the default and the tenant is not archived), the editor and the "Keep `{name}`" note, and never repeats the dot or pill. A closed row with an error shows it under its trigger, linked with `aria-describedby`. From `lg` each card's preview pane sits beside its fields, labelled "Preview · <open row>" on Empty lists (the first row's name while none is open) and "Preview" on the single-field cards. Below `lg` only Empty lists offers a preview, behind a full-width "Show preview" button (`aria-expanded`, `aria-controls`) that keeps focus, flips to "Hide preview" and resets after Save or a language switch; the other cards show no preview there, and their note closes the card under the last field. Saving goes through the shared settings save bar.
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
- Specimens render in the tenant's Look (accent and logo hue, fonts, radius, density, card style) switched between light and dark by the shared preview's Light / Dark icon group (`components/shared/preview-mode-group/`), the same group the preview toolbar shows; Voice never changes Look.

## Constraints and invariants

- Every key in `site-messages.en.json` is either a `VOICE_FIELDS` path or on `VOICE_FIXED_KEYS`, never both, and no fixed key is stale (`voice-fields.test.ts`). A new catalog string cannot ship unclassified; page-level prose is a Voice candidate, everything else is fixed, and the classification is decided per string.
- Validation is generated from the registry inside `upsertSiteConfig` (`@blog/db`): values are trimmed and a blank value removes the override; `TEXT` rejects line breaks; length is capped at `max` (a `RICH` value measured as plain text); placeholders must match exactly — none missing, none unknown; a `RICH` value must fit the rich text shape and every link `href` must pass `sanitizeHref`; a plain string sent for a `RICH` field is wrapped as one paragraph. Failures come back per language as `fieldErrorsByLocale` — one `VOICE_FIELD_ERROR` reason code (`@blog/config`) per field, with `max`, `placeholders`/`count` or `url` as ICU values — and the Voice page renders each in the operator's language from `voiceSettings.fieldError`; an unknown field id or locale throws as a malformed request.
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
- `apps/platform/src/components/features/voice/**/*.test.tsx`, `apps/platform/src/components/features/site-preview/voice-*/*.test.tsx`, `apps/platform/src/utils/voice-draft/voice-draft.test.ts`, `apps/platform/src/utils/voice-sections/voice-sections.test.ts`, `apps/platform/src/server/site-config/save-voice-overrides-action.test.ts`, the two `voice/page.test.tsx` route tests.
- `apps/web`: tests beside `resolve-tenant-messages`, `resolve-voice-rich-fields`, `get-voice-rich`, `voice-rich-provider`, `voice-rich-text`, `wrap-voice-text`, `fill-voice-placeholders`, and `src/i18n/request.test.ts`.
- Stories: `apps/web/src/components/pages/not-found-page/not-found-page.stories.tsx`, `locale-error-page/locale-error-page.stories.tsx`. The platform has no Storybook.

## Related

- #4022 — per-language price period wording in Site Settings; retires the `pricingModule.period.*` catalog keys and their `VOICE_FIXED_KEYS` entries.

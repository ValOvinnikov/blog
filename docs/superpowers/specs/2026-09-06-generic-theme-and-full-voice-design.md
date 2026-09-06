# Generic theme & full-catalog Voice — Design

**Status:** Design — approved in conversation 2026-09-06; awaiting written
review before `writing-plans`.
**Date:** 2026-09-06
**Supersedes:** decisions D4 and D5 of
[`2026-08-10-configurability-and-de-console-design.md`](./2026-08-10-configurability-and-de-console-design.md)
(code voice-packs, "preserve the console voice") and the `chromeOn` field of
the preset-bundle shape its core model and D3 define. Its D6 (two presets,
`console` and `editorial`) stands.
The rest of that doc (the look/behavior ladders, the preset registry) stands
and is already reflected in `SPEC.md`.
**Epic:** #2746 (sub-issues #2747–#2761, one per layer and phase).
**Related:** `SPEC.md` "Theme-as-content", "Voice-as-content" and "Curated UI
copy lives in Voice, not on modules"; #1899 (module copy vs. Voice); #1420
(catalog neutralisation); #1415/#1416/#1417 (the `chromeOn` branches this
removes).
**Mock:** the approved Voice page layout (variant A, "split workbench") is at
<https://claude.ai/code/artifact/1a48581b-2835-4c04-8060-2f27dace8770>.

## Goal

Two tasks, delivered in order:

1. **One rendering path.** Remove the terminal idiom that the `CONSOLE` preset
   bakes into components — prompt-shaped headings, glyph literals, and the
   `chromeOn` / `isPlain` branches that render two structures. `CONSOLE`
   survives only as a look (fonts, hue, radius, density); every component
   renders one generic structure whose styling is token-driven.
2. **Voice owns every visible string on the site.** The tenant-editable set
   grows from 19 curated keys to the whole visible catalog, edited in the
   platform's Voice page against a live preview of the real component, with a
   rich-text editor for long-form copy.

## Non-goals

- Removing the `CONSOLE` preset or migrating tenants off it. The `preset_id`
  enum, the preset picker and the tenant rows are untouched.
- Removing `brand.specLine` from the Studio brand object. It is an optional,
  authored "build-tag" line under the logo rendered by `BrandLockup`; it
  reads as terminal idiom only when a tenant chooses to write one, so it is
  content, not a hardcoded symbol.
- Per-locale voice. The catalog is `en` only today; the registry is shaped so
  a locale can be added later, nothing more.
- Making accessibility-only strings editable (see D3).
- Click-to-edit in the preview (variant B of the mock). Noted under "Later".

## Decisions

- **D1 — Drop `chromeOn`; one rendering path.** `TThemeTokens.chromeOn` and
  every branch on it go. `site_config` never had a column for it, so no
  Drizzle migration. The framed panel becomes the single structure for
  engagement sections; the "plain" card variant is deleted, not kept as a
  toggle.
- **D2 — Drop preset voice packs.** With Voice covering the full catalog a
  preset has no reason to carry copy. `TPresetBundle` loses `voicePack`,
  `TVoicePack` is deleted, and the message merge drops from three layers to
  two: neutral catalog ← tenant overrides.
- **D3 — Visible copy only. Accessibility-only strings are never
  tenant-editable.** A blanked "Toggle navigation menu" breaks screen readers
  with no visible symptom — exactly the silent-failure class `SPEC.md` warns
  about. Those ~24 keys stay in the neutral catalog, fixed. Per-instance alt
  or aria text belongs on the Sanity schema of the thing it describes
  (already the case: the image-alt helper, CTA action labels).
- **D4 — Copy for a Sanity-modelled feature lives in Studio, not Voice.**
  Feature-wide copy goes on that feature's `settings_*` singleton; per-instance
  content goes on the module. Voice covers only site chrome with no Sanity
  model (navigation, auth, bookmarks, account, 404, errors, pagination,
  archive titles and empty states). The newsletter is the first application:
  its form strings and the confirm/unsubscribe page copy move to
  `settings_newsletter`. Empty states stay in Voice — they are page-level
  archive copy shared by `/blog`, topics and tags, and #1899 already
  documented the module-field failure mode. This refines, not reverses, the
  `SPEC.md` rule "curated UI copy lives in Voice, not on modules": a module
  still never carries an override for copy Voice owns.
- **D5 — Toast copy is not voice.** Toasts are generic operation feedback
  ("Saved", "Removed from bookmarks"). Their strings stay fixed in the
  catalog and out of the registry.
- **D6 — Rich text only for long-form fields**, stored as Portable Text
  restricted to bold, italic, link and plain paragraphs. Labels, buttons,
  titles and placeholders stay single-line strings. No new dependency:
  `@portabletext/editor` (MIT) is already installed for email templates.
- **D7 — The preview is an iframe of the real site.** `apps/platform` may not
  import `apps/web`, and most Voice copy lives in web-owned compositions, so
  re-composing a preview in the platform would approximate and drift. The
  web app exposes a token-gated preview route that renders one surface with
  fixture data and draft overrides pushed by `postMessage`.
- **D8 — Voice page layout is variant A of the mock** (fields by surface on
  the left, sticky live preview on the right that follows focus), plus
  per-surface change counts borrowed from variant C.
- **D9 — The neutral catalog moves to `@blog/config`.** It is the only layer
  both apps can read: the site loads it as base messages, the platform reads
  it for placeholders and "reset to default". `apps/web/src/i18n/messages/`
  stops being the home of site copy.
- **D10 — Metadata derives from visible copy; there are no metadata-only
  Voice fields.** A page's `<title>` is its visible heading and
  its meta description is its visible description, so an admin edits one
  thing and the tab, the share card and the page agree. Keys with no visible
  counterpart (`bookmarksPage.metaDescription`,
  `accountPage.metaDescription`, the RSS fallbacks, which only apply when
  the Sanity site settings are empty) stay fixed in the catalog.
- **D11 — The not-found and error pages use the Studio page shape.** Both
  carry `heading`, `supportingText` and an optional `eyebrow` — the short
  label above the heading that the `Eyebrow` atom already renders
  (`packages/ui/src/atoms/eyebrow`). The not-found eyebrow defaults to
  `404`; the error page's is empty by default. "Code" was rejected as the
  name because the field is a label, not always a status code, and
  `eyebrow` is the term the design system already uses. The heading is the
  page's `<h1>`, which also gives the 404 a meaningful accessible name
  instead of a bare number.
- **D12 — Counters are not voice.** Strings whose job is to show a number
  (`bookmarksPage.hint`, `topicsPage.postsCount`, `tagsPage.postsCount`,
  `toastProvider.mergeCountSuffix`, `pagination.pageSuffix`) stay fixed in
  the catalog. They carry ICU plural syntax an admin should never have to
  type, and they read the same in every brand voice.
- **D13 — Archive titles are Studio content, not voice.** The post index,
  topic index and tag index pages are Studio singletons with `heading` and
  `supportingText`; topic and tag pages take their heading from the topic
  or tag document. The catalog's `blogListPage.title`, `topicPage.title`
  and `tagPage.title` are read only as the post list's accessible name, so
  they are accessibility-only and stay fixed (D3). `tagPage.label` ("Tag: {name}") builds only the tag page's own crumb; under
  this rule that crumb is the bare tag title, as the topic page already does,
  so the key is deleted. `postLatestModule.fallbackHeading` is the latest-posts
  module's accessible-name fallback, so it is accessibility-only and stays
  fixed (D3). Breadcrumb labels follow the same rule: the "Blog", "Topics"
  and "Tags" crumbs are the `heading` of the post index, topic index and
  tag index singletons, and the "Home" crumb is the site's brand name from
  `settings_site`. `breadcrumbs.home/blog/topics/tags` are deleted from the
  catalog; only `breadcrumbs.ariaLabel` remains, fixed. The breadcrumb
  consumers (`blog-list-page`, `topics-page`, `tags-page`, `topic-page`,
  `tag-page`, `blog-post-page`, `generic-page`) take the labels from the
  already-fetched settings and index-page data instead of `t()`.
- **D14 — Every save action shows a spinner while pending.** The platform
  `Button` gains an `isPending` prop: it renders the shared `Spinner`
  before the label, sets `aria-busy`, and is disabled for the duration, the
  way `ConfirmDialog`'s confirm control already behaves. Every save action
  passes `useFormSubmission`'s `isPending` to it — Voice, Look, Features,
  Email templates and tenant details alike — so "did it take?" is answered
  on the button rather than only by the toast that follows.

---

## Task 1 — one rendering path

### What is removed

| Today                                                                                                                                                                                                                                           | Fate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TThemeTokens.chromeOn`, `PRESET_REGISTRY[*].themeTokens.chromeOn`                                                                                                                                                                              | Deleted (`packages/config`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `TVoicePack`, `CONSOLE_VOICE_PACK`, `EDITORIAL_VOICE_PACK`, `TPresetBundle.voicePack`                                                                                                                                                           | Deleted (`packages/config`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `apps/web/src/utils/get-chrome-on/`, `plain`/`isPlain` in `[tenant]/[locale]/layout.tsx` and `app/not-found.tsx`                                                                                                                                | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `isChromeOn` / `isPlain` props and branches in `privacy-section`, `identity-section-view`, `newsletter-section-view`, `bookmarks-page(-view)`, `not-found-page`, `toast-provider`, auth menus                                                   | Deleted; each renders the single structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `apps/web/src/components/shared/plain-section/`                                                                                                                                                                                                 | Deleted (it was the panel without the prompt).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `@blog/ui` `TerminalChip`, `TerminalTyping`, the `blink` keyframes in `configs/tailwind/theme.css`                                                                                                                                              | Deleted. `TerminalTyping` has no consumer; the 404 page renders eyebrow, heading and supporting text. The keyframes live in `configs/tailwind`, so the `config` sub-issue deletes them once the two atoms are gone.                                                                                                                                                                                                                                                                                                                                                                |
| `WindowChrome.User`, `WindowChrome.Prompt`, `WindowChrome.Tag`                                                                                                                                                                                  | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `Toast` props `command`, `state`, `isPlain`; the `TOAST_GLYPH` literals (`✓ › ● ✕ ◐`)                                                                                                                                                           | Deleted; see Toast below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `chromeOn` pass-through in `packages/service` `theme-settings/adaptor/transformer.ts`                                                                                                                                                           | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Look tab "chrome" switch (`look-form-advanced-section`, `default-look-values`, `look-form`, `look-preview`, `preview-sample`), `lookPreview.terminalPrompt` message                                                                             | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Studio `settings_voice` singleton (`packages/studio/src/schema-types/documents/settings/voice.ts`, desk entry)                                                                                                                                  | Deleted; it has had no read path since the Postgres cutover. Two producers go with it: the `settings_voice` starter document seeded by `packages/db/scripts/provision-tenant/steps/starter-content.ts` (`STARTER_DOCUMENT_IDS.VOICE`), and the file's entry in `scripts/check-voice-key-sync.mjs` (next row). Typegen re-run.                                                                                                                                                                                                                                                      |
| `scripts/check-voice-key-sync.mjs` and the `Voice key sync` job in `ci.yml` (`pnpm check:voice-sync`, `check:voice-sync:test`)                                                                                                                  | Phase 1: rewritten to diff the three surviving key sources (`voice-fields.ts`, `apply-voice-overrides.ts`, `upsert-site-config.ts`) in the same PR that deletes `settings_voice`, so the required check never reads a missing file. Phase 2: retired — the registry coverage test in `@blog/config` polices the same duplication — with the job removed from `ci.yml`, the required-check ruleset (18375038) updated in the same sitting, and `docs/context/ci-automation.md` synced. Root scripts and workflows are orchestrator-owned tooling and ride in the owning layer's PR. |
| `BRAND_VARIANTS` (`packages/config/src/constants/brand.ts`), the Studio `brand.variant` field, its `.notNull()` projection in the site-settings query/transformer/types, and the Storybook brand toolbar in `packages/ui/.storybook/preview.ts` | Deleted. #1389 migrated the Indigo look into theme overrides and closed, but never removed the axis; no web code reads `variant` today. Dropping the Studio field orphans one unread string per `settings_site` document — confirm against `production` before the schema PR, no data migration required. Typegen re-run.                                                                                                                                                                                                                                                          |
| "Console brand variant" wording in the doc comments of `opengraph-image.tsx`, `twitter-image.tsx`, `default-social-image.tsx`                                                                                                                   | Reworded; comments only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Renames

- **`WindowChrome` → `Panel`** (`packages/ui/src/molecules/panel/`), compound
  parts `Panel.Header` (heading content + `headingLevel`) and `Panel.Body`.
  The bordered, rounded surface and the title bar keep their token-driven
  styling; the bar renders a real heading in the display font instead of a
  mono prompt line. Landed expand/contract so each PR merges green alone:
  add `Panel`, migrate the 8 production consumers (3 account sections,
  bookmarks view, both auth menus, `NewsletterSignup.Full`, the Look preview
  sample), delete `WindowChrome`.
- **`Toast`** takes an optional `title` plus `message`; the type glyph is an
  `Icon` from the `ICONS` registry (check, info, warning, close), loading keeps
  the `Spinner`. Both apps' toast providers move to the `{ title?, message }`
  call shape (`apps/platform/src/context/toast-provider` currently passes
  `command`/`state` too).
- **`ease-console` → `ease-smooth`** in `configs/tailwind/theme.css` and the
  ~20 `*-variants.ts` files that use the class. Rename only.
- **`BookmarksList`** keeps its column layout; only the "`ls -l`" wording in
  its doc comment changes.

### Catalog keys neutralised

| Old key                                                                                       | New key                                                                                                                                      | Neutral default                            |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `notFound.commandNotFound`                                                                    | `notFound.heading`                                                                                                                           | Page not found                             |
| `notFound.description`                                                                        | `notFound.supportingText` (rich)                                                                                                             | The page you're looking for doesn't exist. |
| (hardcoded `404` heading)                                                                     | `notFound.eyebrow` (optional)                                                                                                                | 404                                        |
| `notFound.metaTitle`, `notFound.metaDescription`                                              | deleted — derived from `notFound.heading` / `notFound.supportingText` (D10)                                                                  | —                                          |
| `authMenu.promptHost`, `authMenu.promptCommandSignIn`, `authMenu.promptCommandAccount`        | `authMenu.signInHeading`, `authMenu.accountHeading`                                                                                          | Sign in / Account                          |
| `bookmarksPage.promptSymbol`, `promptCommand`, `promptFlag`                                   | (use `bookmarksPage.title`)                                                                                                                  | My bookmarks                               |
| `accountPage.{privacy,newsletter,identity}.promptHost`, `.promptCommand`, `privacy.promptTag` | `accountPage.{privacy,newsletter,identity}.heading`                                                                                          | Privacy / Newsletter / Connected accounts  |
| `bookmarkButton.toastCommand`, `toast*State`; `accountPage.*.*ToastCommand`, `*Toast*State`   | deleted (Toast has no chip); `*ToastLoadingMessage`/`*SuccessMessage` remain as `message`; a short `title` key per toast where one is useful | —                                          |

The `not-found-page`'s hardcoded `cd ~` and `$` go with the branch.

### Data migration

`site_config.voice_overrides` rows may hold the seven terminal-prompt keys
(`terminalPromptHost`, `authPromptCommandSignIn`, `authPromptCommandAccount`,
`bookmarksPromptCommand`, `account{Privacy,Newsletter,Identity}PromptCommand`)
the two bookmark-toast keys (`bookmarkToastSavedMessage`,
`bookmarkToastRemovedMessage`), and the two 404 metadata keys
(`notFoundMetaTitle`, `notFoundMetaDescription`, now derived per D10). One
Drizzle SQL migration strips them
(`voice_overrides = voice_overrides - 'terminalPromptHost' - …`) and renames
`notFoundCommandNotFound` → `notFoundHeading` and `notFoundDescription` →
`notFoundSupportingText`. The remaining keys (`notFoundReturnHome`, five
empty states) keep their ids under Task 2. Human-gated apply, same as any migration.

### Tests and stories

Every `describe('plain (isChromeOn: false)')` block and every "renders the
WindowChrome terminal bar" assertion is deleted with its branch;
`window-chrome.stories.tsx`, `terminal-chip.stories.tsx`,
`terminal-typing.stories.tsx` go; `panel.stories.tsx` replaces the first.
`packages/ui/COMPONENTS.md` is regenerated.

---

## Task 2 — Voice as the full catalog

### The registry (`@blog/config`)

`packages/config/src/voice/` holds:

- **`site-messages.en.json`** — the neutral catalog, moved from
  `apps/web/src/i18n/messages/en.json` (D9). `apps/web/src/i18n/request.ts`
  imports it as the base.
- **`VOICE_FIELDS`** — an `as const` array declaring every editable key:

  ```ts
  {
    id: 'notFoundSupportingText',       // flat camelCase; the storage key
    path: 'notFound.supportingText',    // dotted catalog path
    kind: VOICE_FIELD_KIND.RICH,        // TEXT | MULTILINE | RICH
    surface: VOICE_SURFACE.NOT_FOUND,   // which preview surface shows it
    placeholders: [],                   // ICU names that must survive editing
    max: 300,
  }
  ```

  `TVoiceFieldId` is derived from it; `VOICE_FIELD_KIND` and `VOICE_SURFACE`
  are UPPERCASE key/value consts per convention. Flat ids are kept (rather
  than dotted paths) because next-intl reserves `.` in keys, the platform's
  label catalog is keyed by id, and the ten surviving overrides keep their
  ids without migration.

- **Surfaces**, in site order: navigation (the topic chip "All"), archive
  empty states, post page, sharing, not found, error page,
  sign-in menu, bookmarks, account (privacy / newsletter / connected
  accounts). Newsletter (D4), toasts (D5), metadata (D10) and archive titles
  (D13) are not surfaces.
- **Exclusions are mechanical:** a key is in the registry only if it is
  listed; the a11y keys, toast keys and newsletter keys are simply absent. A
  co-located test asserts every registry `path` exists in the catalog and
  every catalog key is either registered or on the explicit fixed list, so a
  new string cannot be added without deciding which it is.

Roughly 60 fields after Task 1's removals and D10.

### Storage and validation (`@blog/db`)

`site_config.voice_overrides` stays JSONB; its type widens to
`Record<string, string | TVoicePortableText>` where `TVoicePortableText` is a
minimal block/span/link type owned by `@blog/config`. `TPortableTextBlock` in
`packages/db/src/schema/email-templates.ts` becomes a re-export of it so the
two JSONB columns share one shape; `@blog/email`'s serializer types and
`apps/platform`'s `EMAIL_PORTABLE_TEXT_SCHEMA` are untouched. No schema change, so no schema migration.

`upsertSiteConfig`'s Zod schema is generated from `VOICE_FIELDS`:

- `TEXT`: trimmed, ≤ `max`, no line breaks.
- `MULTILINE`: trimmed, ≤ `max`.
- `RICH`: array validated against `VOICE_PORTABLE_TEXT_SCHEMA` — decorators
  `strong`/`em`, annotation `link` (`href` run through the canonical
  `sanitizeHref`), style `normal` only, no lists; blank documents
  (`isBlankPortableTextValue`) become absent.
- Placeholders: every name in `placeholders` must appear at least once and
  no unknown `{…}` token may appear. Editable fields never carry ICU
  `plural`/`select` syntax (D12), so a simple `{name}` scan is the whole
  check.
- Blank strings still mean "inherit" and are dropped, as today.

Failures return `{ ok: false, fieldErrors: Partial<Record<TVoiceFieldId,
string>> }` so the page can show them inline.

### Rendering (`apps/web`)

- `resolveTenantMessages` becomes: base catalog ← overrides, where each
  `TEXT`/`MULTILINE` override is set at its registry `path`. next-intl usage
  in components is unchanged.
- `RICH` keys cannot be next-intl messages. The tenant layout also mounts a
  `VoiceRichProvider` holding the resolved rich map (override, else the
  catalog string wrapped as one paragraph). A server accessor
  (`getVoiceRich(id)`) and a client hook (`useVoiceRich(id)`) return Portable
  Text, rendered by the existing `BasicTextRenderer`. Consumers: empty
  states, the not-found and error pages' supporting text, account section
  descriptions.
- `error-boundary-copy.ts`, `error-page.tsx` strings move into the catalog
  under `errorPage.*` and render through the provider. The error page takes the same shape as the not-found page (D11): `errorPage.eyebrow` (optional, empty by default), `heading`, `supportingText`, `retry`, `goHome`. `global-error.tsx`
  keeps fixed copy — it renders when the root layout itself fails and has no
  tenant to read. Documented exception.
- `apply-voice-overrides.ts`'s hand-maintained id→path table is replaced by
  the registry.
- `app/not-found.tsx`'s `generateMetadata` builds `title` from
  `notFound.heading` and `description` from the plain text of
  `notFound.supportingText` (a `portableTextToPlainText` helper in
  `@blog/config`).

### Preview route (`apps/web`)

`apps/web/src/app/[tenant]/preview/voice/[surface]/page.tsx`, a sibling of
`[locale]` so it inherits `ThemeScope` and fonts without the site header and
footer. Locale is the tenant default.

- **Fixtures, not data.** Each surface renders its existing pure view
  (`IdentitySectionView`, `PrivacySection`, `NewsletterSectionView`,
  `BookmarksPageView`, `NotFoundPage`, the sign-in and account menus, the
  archive list) with fixture props from `apps/web/src/preview/voice/`. The
  account fixtures in `src/testing/` move there and the tests import them
  from the new home.
- **Draft channel.** A client island wraps the surface in
  `NextIntlClientProvider` + `VoiceRichProvider`, listens for
  `{ type: 'voice-draft', overrides }` messages from the platform origin, and
  re-renders with the merged messages. Elements bound to a field carry
  `data-voice-key`; a `{ type: 'voice-focus', id }` message outlines them.
- **Security.** The URL carries `?token=` — an HMAC over
  `voice-preview:<tenantId>:<expiresAt>` using `SITE_CONFIG_REVALIDATE_SECRET`
  (already shared by both apps), ten-minute expiry, compared with
  `isSecretMatch`; the route checks the token's tenant against the
  host-resolved tenant and 404s on mismatch or expiry. It sets
  `robots: noindex`, `Content-Security-Policy: frame-ancestors
<PLATFORM_APP_URL>`, and ignores `postMessage` from any other origin.
  `PLATFORM_APP_URL` is a new optional web env var (`turbo.json`,
  `docs/context/environment-variables.md`); absent, the route 404s.

### Voice page (`apps/platform`)

Layout per D8 and the mock:

- **Header:** "Voice", one-line description, actions **Discard** (disabled
  when clean), **Save**, and an "N unsaved" count. The "Basic" card and the
  "Advanced" disclosure are removed.
- **Left column:** a search box filtering fields by label or default text;
  then one `Card` per surface in site order, header showing the surface name,
  its route and its change count. Each field row: label, a hint saying where
  it appears, the control for its kind (`TextInput`, `Textarea`, or
  `PortableTextEditor` with a bold/italic/link toolbar), placeholder = neutral
  default, a change marker and **Reset** when overridden, placeholder chips
  ("Keep these: `{count}`") when the field has them, and inline field errors
  from the save action.
- **Right column, sticky:** surface `<select>`, light/dark toggle (as Look),
  the iframe, and a status line. Focusing a field switches the iframe to that
  field's surface (250 ms debounce) and posts `voice-focus`; typing posts
  `voice-draft` (150 ms debounce). If `WEB_APP_URL` is unset or the iframe
  fails to load, an `Alert` says the preview is unavailable and editing still
  works. Below 960 px the preview collapses into a toggleable bottom sheet.
- **Editor:** `PortableTextEditor` gains a `schema` prop (default: the email
  schema) so Voice passes `VOICE_PORTABLE_TEXT_SCHEMA`; the toolbar renders
  only the buttons the schema allows.
- **Labels and hints** live in the platform catalog under `voiceFieldLabels.
<id>` / `voiceFieldHints.<id>` / `voiceSurfaces.<surface>`; a test asserts
  every registry id has both.
- **Save:** the existing `saveVoiceOverridesAction` sends the full draft;
  the Save button shows the spinner and is disabled while the action is
  pending (D14), and the field controls are `inert` for the duration;
  `upsertSiteConfig` validates; success toasts, refreshes and revalidates the
  site as today; `fieldErrors` render inline and the first errored field
  receives focus.
- `apps/platform/src/utils/voice-fields/voice-fields.ts` is deleted in favour
  of the registry.

### Newsletter copy → Studio (D4)

- **Studio:** `settings_newsletter` gains a `formCopy` fieldset (`submitLabel`,
  `emailPlaceholder`, `successMessage`, `errorInvalid`, `errorAlreadySubscribed`,
  `errorServer`, `trustCues[]` up to 2) and a `landingPages` fieldset with
  `confirm` (`confirmedTitle`, `confirmedMessage`, `invalidTitle`,
  `invalidMessage`, `errorTitle`, `errorMessage`, `returnHome`) and
  `unsubscribe` (`confirmTitle`, `confirmMessage`, `confirmButtonLabel`,
  `successTitle`, `successMessage`, `invalidTitle`, `invalidMessage`,
  `returnHome`) objects. All strings, all with `initialValue` equal to today's
  catalog default and validation `required()`, so a document seeded by
  provisioning renders exactly what the site renders today. Additive: no
  content migration; existing documents show the defaults until saved.
  Typegen re-run.
- **Service:** the newsletter-settings query/transformer projects the new
  fields with `.notNull()` and explicit sub-fields per the groqd conventions.
- **Web:** `NewsletterForm` takes its copy as props (both the module and the
  post-page inline form pass the settings values); the confirm and
  unsubscribe route handlers read the settings document instead of
  `getTranslations`. The `newsletterForm`, `newsletterConfirm` and
  `newsletterUnsubscribe` namespaces are deleted from the catalog.
- **Email:** untouched — the email templates already have their own home.

---

## Delivery

One epic (#2746), two phases. Phase 1 lands first: Phase 2 registers the
renamed keys.

**Phase 1 — one rendering path** (#2747–#2753). Sub-issues per layer, dispatch order
`config → studio → service → ui → web → platform-app → db`:

1. `config`: drop `chromeOn`, voice packs, `TVoicePack`, `BRAND_VARIANTS`;
   add `ease-smooth` (remove `ease-console` and the `blink` keyframes in a
   follow-up PR once ui/web/platform-app have migrated).
2. `studio`: delete `settings_voice` and `brand.variant`; typegen. The same
   PR rewrites `scripts/check-voice-key-sync.mjs` to the three surviving
   sources (orchestrator-owned tooling).
3. `service`: drop `chromeOn` pass-through and the `brand.variant`
   projection.
4. `ui`: add `Panel`; `Toast` title/message + icons; delete `TerminalChip`,
   `TerminalTyping`; swap `ease-console` → `ease-smooth` (WindowChrome
   deleted in step 6).
5. `web`: single-path sections, 404, bookmarks, auth menus, toast provider;
   catalog key renames; delete `PlainSection`, `get-chrome-on`.
6. `platform-app`: Look tab without the chrome switch, preview sample on
   `Panel`, toast call shape, and `Button.isPending` wired into every
   existing save action (D14); then `ui` deletes `WindowChrome`.
7. `db`: migration stripping the dead override keys; remove the
   `settings_voice` starter document from the provisioning seed.

**Phase 2 — full-catalog Voice** (#2754–#2761). Two parallel chains after Phase 1:
`config → db → web → platform-app` for the registry, storage, rendering,
preview route and page; `studio → service → web` for the newsletter copy.

**Env and docs in the same PRs:** `PLATFORM_APP_URL` in `apps/web` env, turbo
and `docs/context/environment-variables.md`; `SPEC.md` "Theme-as-content",
"Voice-as-content" and "Curated UI copy" sections rewritten to this doc's
final shape; `.claude/agents/web.md` and `platform-app.md` gain the preview
route and Voice page conventions; this spec is deleted in the PR that syncs
`SPEC.md`.

**Verification** per PR: `pnpm type-check && pnpm lint && pnpm test && pnpm
knip`, `pnpm gen:ui-index:check` for `packages/ui` PRs,
`pnpm check:turbo-env-sync` for the env PR, `pnpm check:voice-sync` wherever
voice keys change until Phase 2 retires it, `pnpm typegen` diff-minimal for the Studio PRs. The
preview route gets an e2e smoke test: load with a valid token, post a draft,
assert the outlined element's text changed.

## Later (recorded, not scoped)

- Click-to-edit from the preview (variant B): the `data-voice-key` attributes
  and the `postMessage` channel already carry what it needs.
- Per-locale catalogs: the registry `path` is locale-independent; a second
  `site-messages.<locale>.json` plus a locale column on the override map is
  the shape.

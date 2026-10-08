# Generic theme & full-catalog Voice — Design

**Status:** Design — approved in conversation 2026-09-06; awaiting written
review before `writing-plans`.
**Date:** 2026-09-06
**Amended:** 2026-10-08 — Voice scope cut to page-level prose, per-language
overrides, section sidebar title in Studio, contents rail relabelled
(D15–D18). Voice page redesigned around one card per surface with its own
preview, and the shared save bar, leave-page guard and draft recovery
(D8 revised, D19). The Look page follows the same pattern (D20).
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
**Mock:** the approved Voice, Email and Look redesign, desktop and phone,
with the save, leave and recovery states, is at
<https://claude.ai/artifact/2VkuUEbjfD5QEMXaZSZHJH>. It supersedes the
earlier three-variant mock
(<https://claude.ai/code/artifact/1a48581b-2835-4c04-8060-2f27dace8770>).

## Goal

Two tasks, delivered in order:

1. **One rendering path.** Remove the terminal idiom that the `CONSOLE` preset
   bakes into components — prompt-shaped headings, glyph literals, and the
   `chromeOn` / `isPlain` branches that render two structures. `CONSOLE`
   survives only as a look (fonts, hue, radius, density); every component
   renders one generic structure whose styling is token-driven.
2. **Voice owns the copy an editor writes** (revised 2026-10-08, D15). The
   tenant-editable set is the page-level prose that carries a site's voice:
   the empty states and the 404 and error pages, 11 fields. Each is edited
   per language (D16) in the platform's Voice page against a live preview,
   with a rich-text editor for long-form copy. Every other visible string
   stays fixed in the catalog, which we translate.

   **Superseded:** this goal first read "Voice owns every visible string on
   the site", growing the editable set to the whole visible catalog (72
   fields by the time the registry landed). D15 records why it was cut back.

## Non-goals

- Removing the `CONSOLE` preset or migrating tenants off it. The `preset_id`
  enum, the preset picker and the tenant rows are untouched.
- Removing `brand.tagline` from the Studio brand object. It is an optional,
  authored "build-tag" line under the logo rendered by `BrandLockup`; it
  reads as terminal idiom only when a tenant chooses to write one, so it is
  content, not a hardcoded symbol.
- Making accessibility-only strings editable (see D3).
- Click-to-edit in the preview (variant B of the mock). Noted under "Later".

## Decisions

- **D1 — Drop `chromeOn`; one rendering path.** `TThemeTokens.chromeOn` and
  every branch on it go. `site_config` never had a column for it, so no
  Drizzle migration. The framed panel becomes the single structure for
  engagement sections; the "plain" card variant is deleted, not kept as a
  toggle.
- **D2 — Drop preset voice packs.** A preset is a look, and has no reason to
  carry copy. `TPresetBundle` loses `voicePack`,
  `TVoicePack` is deleted, and the message merge drops from three layers to
  two: neutral catalog ← tenant overrides.
- **D3 — Visible copy only. Accessibility-only strings are never
  tenant-editable.** A blanked "Toggle navigation menu" breaks screen readers
  with no visible symptom — exactly the silent-failure class `SPEC.md` warns
  about. Those ~24 keys stay in the neutral catalog, fixed. Per-instance alt
  or aria text belongs on the Sanity schema of the thing it describes
  (already the case: the image-alt helper, CTA action labels).
- **D4 (revised 2026-09-07) — Studio owns a feature's authored content.
  Operational form copy stays fixed in the catalog.** The dividing line is
  authorship. Copy an editor _writes_ as the feature's content — its pitch,
  its argument, the words that differ because this tenant has something
  particular to say — goes on that feature's `settings_*` singleton
  (feature-wide) or its module (per-instance). Copy that merely _operates_ the
  interface — button labels, input placeholders, status and error messages,
  confirmation-page wording — is neither content nor voice: it stays fixed in
  the neutral catalog, for the same reason toast copy does under D5. It is
  generic operation feedback, identical for every tenant, and nobody should be
  editing it.

  For the newsletter this means `settings_newsletter` gains exactly one field,
  **`trustCues`**, joining the `heading` and `description` it already has. All
  24 newsletter catalog keys stay where they are — `newsletterForm`'s seven
  operational strings, and every `newsletterConfirm.*` / `newsletterUnsubscribe.*`
  landing-page string — except the two `trustCue*` keys, which Studio takes
  over. Nothing moves into `VOICE_FIELDS`; the newsletter contributes no Voice
  surface.

  Empty states stay in Voice — they are page-level archive copy shared by
  `/blog`, topics and tags, and #1899 already documented the module-field
  failure mode. The `SPEC.md` rule "curated UI copy lives in Voice, not on
  modules" is unchanged.

  **Superseded:** the original D4 ("copy for a Sanity-modelled feature lives
  in Studio, not Voice") moved the newsletter's form strings and both landing
  pages onto `settings_newsletter`. Implementing it put 21 labels,
  placeholders and error messages into a CMS singleton as required fields,
  which made the existing tenant document invalid and would have needed a
  backfill migration to repair — a large amount of machinery for strings no
  tenant has a reason to change. The rule above replaces it, and reduces the
  newsletter's share of this epic to a single field.

- **D5 — Toast copy is not voice.** Toasts are generic operation feedback
  ("Saved", "Removed from bookmarks"). Their strings stay fixed in the
  catalog and out of the registry.
- **D6 — Rich text only for long-form fields**, stored as Portable Text
  restricted to bold, italic, link and plain paragraphs. Labels, buttons,
  titles and placeholders stay single-line strings. No new dependency:
  `@portabletext/editor` (MIT) is already installed for email templates.
- **D7 (revised 2026-10-08) — The preview renders `@blog/ui` specimens
  inside the platform.** The Voice page previews each surface with the same
  `@blog/ui` atoms the site passes that copy into (`Eyebrow`, `Heading`,
  `Text`, `Button`, `LinkButton`). They are themed through the token path the
  Look preview already uses and fed straight from the form's draft state.
  - `apps/web` carries no preview code: no route, no proxy branch, no
    framing carve-out in the security headers both apps share, no token, no
    env var and no `postMessage` channel.
  - The layout around the atoms is a platform copy with nothing to catch
    drift. Fidelity is best-effort, the trade already accepted for the
    archive empty states.

  **Superseded:** "the preview is an iframe of the real site", a token-gated
  `apps/web` route rendering every surface from fixtures (#2757). D15 leaves
  11 fields on four simple surfaces. For those, the route's machinery bought
  little fidelity that a specimen does not: a proxy carve-out on every
  request, an `X-Frame-Options`/`frame-ancestors` carve-out in the shared
  preset, HMAC tokens and a new env var.

- **D8 (revised 2026-10-08) — One card per surface, each with its own
  preview.** The Voice page is one scrolling column of four cards (page not
  found, error page, empty lists, bookmarks). Each card has its fields on
  the left and its specimen (D7) on the right. Editing a field re-renders
  the specimen beside it, and focusing one outlines its text there.
  - Empty lists render as five compact rows: label, the current text,
    Default or Customised, and a chevron. One row is open at a time with
    the full editor, and the specimen shows only the open list inside its
    page.
  - On a phone each card stacks its fields over a "Show preview"
    disclosure.

  **Superseded:** variant A of the earlier mock (fields on the left, one
  sticky preview on the right that follows focus, a surface picker, a
  search box and a bottom sheet below 960 px). It was sized for the
  72-field catalog. At 11 fields it costs more than it gives.

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
  (`packages/ui/src/components/atoms/eyebrow`). The not-found eyebrow defaults to
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
  `tag-page`, `blog-post-page`, `landing-page`) take the labels from the
  already-fetched settings and index-page data instead of `t()`.
- **D14 — Every save action shows a spinner while pending.** The platform
  `Button` gains an `isPending` prop: it renders the shared `Spinner`
  before the label, sets `aria-busy`, and is disabled for the duration, the
  way `ConfirmDialog`'s confirm control already behaves. Every save action
  passes `useFormSubmission`'s `isPending` to it — Voice, Look, Features,
  Email templates and tenant details alike — so "did it take?" is answered
  on the button rather than only by the toast that follows.
- **D15 (2026-10-08) — Voice is bounded to page-level prose.** A string is
  tenant-editable only if it is page-level prose an editor writes in the
  site's own voice. Everything else stays fixed in the catalog, which we
  translate into every locale:
  - copy that operates the interface: buttons, links, toggles, badges,
    statuses, form and section labels, and page names that a fixed menu link
    or aria label repeats;
  - copy that states what the code enforces: data export and deletion,
    consent categories and choices;
  - third-party names (GitHub, Google);
  - copy read only by assistive technology (D3).

  This is D4's rule, which #2921 already applied to sign-in, applied to every
  surface. The editable set is 11 fields, eight of them `RICH`:

  | Surface     | Editable fields                                                       |
  | ----------- | --------------------------------------------------------------------- |
  | `ARCHIVE`   | `blogListEmpty`, `topicEmpty`, `tagEmpty`, `topicsEmpty`, `tagsEmpty` |
  | `BOOKMARKS` | `bookmarksEmpty`                                                      |
  | `NOT_FOUND` | `notFoundEyebrow`, `notFoundHeading`, `notFoundSupportingText`        |
  | `ERROR`     | `localeErrorTitle`, `localeErrorDescription`                          |

  The other 61 registered ids move to `VOICE_FIXED_KEYS`. They include
  every field of `NAVIGATION`, `POST`, `SHARING`, `ACCOUNT` and
  `CONSENT_BANNER`, which leave `VOICE_SURFACE`; the pagination labels; the
  bookmark button and the bookmarks page's title and list heading; the 404's
  "Return home"; and the error page's "Try again" and "Go home". No catalog
  key is added or removed, and the registry coverage test proves the move is
  complete.

  The consent banner's message goes fixed with the rest of its surface. This
  reverses `SPEC.md`'s cookie-consent "Copy" bullet. Rewording the message
  never re-asks visitors who consented under the old wording, and it cannot
  link a privacy policy until #3726.

  Of the 61, the 60 that the full-catalog expansion added need no data
  migration, because the platform could only ever save the original eight
  keys.
  `notFoundReturnHome` is the exception: it is saveable today. The platform's
  field list must drop it in the same PR that unregisters it, because
  `upsertSiteConfig` rejects an unregistered key and every Voice save would
  fail. Any custom wording a tenant gave it reverts to the catalog default.

  **Superseded:** Goal 2's original "every visible string". It reversed the
  "deliberately bounded" curated set of
  [`2026-08-10-configurability-and-de-console-design.md`](./2026-08-10-configurability-and-de-console-design.md),
  and this returns to it. Making buttons, statuses and settings copy
  editable gained no voice. It created label-in-name breaks against fixed
  aria labels, page names that stopped matching the menu links leading to
  them, and copy that could drift from what the code actually does.

- **D16 (2026-10-08) — Voice overrides are per language.** A tenant serves
  its default `locale` plus `additionalLocales`. Each editable field takes an
  optional value per live language, and falls back to that language's
  catalog default when empty.
  - `site_config.voice_overrides` gains a locale level:
    `{ [locale]: { [fieldId]: value } }`. Each value is validated as before
    (kind, `max`, placeholders).
  - A Drizzle data migration moves existing values under the tenant's
    default `locale`, with the usual human-gated apply. This keeps today's
    behaviour, where overrides apply only on default-language pages.
  - Rendering applies the request language's overrides on every page and to
    every string, whether a server or a client component renders it.
  - The Voice page edits one language at a time, through a switcher over
    the tenant's live languages. Placeholders, "reset to default" and the
    preview follow the selected language.
- **D17 (2026-10-08) — The section sidebar's title is Studio content.** The
  sidebar heading on nested landing pages (`sectionNavigation.label`, "In
  this section") becomes an optional `sectionNavigationTitle` string on the
  section's root landing page. It sits beside the `sectionNavigation` toggle
  and is shown only while that toggle is on.
  - An empty title falls back to the catalog default, which is fixed. So no
    Voice override competes with it, which is the failure mode "Curated UI
    copy lives in Voice, not on modules" warns about.
  - Landing pages are per-language documents, so the title is localised
    with no extra machinery.
  - Additive and optional, so no content migration. It ships through
    `studio → service → web`.
- **D18 (2026-10-08) — The post contents rail is labelled "Contents".**
  `postContentsRail.label` stays fixed. Its default changes from "Topics",
  which collided with the site's topic taxonomy, to "Contents" in all five
  catalogs: de "Inhalt", es "Contenido", fr "Sommaire", nl "Inhoud".
- **D19 (2026-10-08) — Settings pages save through one save bar, guard
  against leaving, and recover drafts.** These live in `SettingsFormShell`,
  so Voice, Email and every other settings page get the same behaviour. Built in #4480 (save bar, guard) and #4481 (recovery); the Look page joins in #4482.
  - _Save bar:_ it replaces the header Save button and is pinned to the
    bottom of the content area, shown only while there are unsaved changes.
    It holds the change count, with a per-language breakdown on Voice and
    Email, plus Discard, Save and ⌘S / Ctrl+S. After a save, the header says
    "All changes saved" until the next edit; an untouched page shows no save
    status (amended 2026-10-08). Field errors stay inline, and the bar adds "N
    fields need attention" with a link to the first one.
  - _Leave-page guard:_ an in-app link asks "Leave without saving?" with
    Stay, Discard and leave, or Save and leave, through Next's `Link`
    `onNavigate`. Reload, closing the tab and typed URLs fall back to
    `beforeunload`.
  - _Draft recovery:_ the draft is kept on the device per tenant, page and
    language, and offered back on return. When someone saved since, the
    banner offers the differences for review before any restore.
  - One draft covers the whole page. Switching a section, template or
    language never discards it.
- **D20 (2026-10-08) — The Look page follows the Voice and Email pattern.**
  Setting cards on the left, a preview on the right that stays in view while
  the cards scroll, and the D19 save bar. Every field, and how it is stored,
  is unchanged; nothing on the page is per-language.
  - _Cards,_ replacing the "Basic" card and the "Advanced" fold: Preset (the
    picker, with "Reset to preset" in the card header beside it), Colour
    (accent and logo hues), Type (heading and body fonts), Shape (corners,
    density, card style), Brand (logo and favicon), Language switcher. Each
    card header carries an unsaved dot.
  - _Reset to preset_ changes the draft only, so Discard undoes it.
  - _Accent contrast:_ an inaccessible hue stays an inline error on the
    field, and becomes a D19 "needs attention" field that blocks Save.
  - _Preview:_ the existing `@blog/ui` sample with its Light/Dark toggle,
    plus a Desktop/Mobile width toggle. The dashed "Full page preview"
    placeholder is removed.
  - _Brand images are staged:_ picking a logo or favicon no longer uploads
    it. The file uploads when the page is saved, so Discard drops it. A
    recovered draft (D19) cannot hold a file, so it restores every other
    field and says the image has to be picked again.
  - _On a phone:_ Edit/Preview tabs replace the two columns; the save bar
    spans the width.
  - Copy is platform UI only, so nothing joins Voice.

---

## Task 1 — one rendering path

### What is removed

| Today                                                                                                                                                                                                                                           | Fate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TThemeTokens.chromeOn`, `PRESET_REGISTRY[*].themeTokens.chromeOn`                                                                                                                                                                              | Deleted (`packages/config`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `TVoicePack`, `CONSOLE_VOICE_PACK`, `EDITORIAL_VOICE_PACK`, `TPresetBundle.voicePack`                                                                                                                                                           | Deleted (`packages/config`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `apps/web/src/utils/get-chrome-on/`, `plain`/`isPlain` in `[tenant]/[locale]/layout.tsx` and `app/not-found.tsx`                                                                                                                                | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `isChromeOn` / `isPlain` props and branches in `privacy-section`, `identity-section-view`, `newsletter-section-view`, `bookmarks-page(-view)`, `not-found-page`, `toast-provider`, auth menus                                                   | Deleted; each renders the single structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `apps/web/src/components/shared/plain-section/`                                                                                                                                                                                                 | Deleted (it was the panel without the prompt).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `@blog/ui` `TerminalChip`, `TerminalTyping`, the `blink` keyframes in `configs/tailwind/theme.css`                                                                                                                                              | Deleted. `TerminalTyping` has no consumer; the 404 page renders eyebrow, heading and supporting text. The keyframes live in `configs/tailwind`, so the `config` sub-issue deletes them once the two atoms are gone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `WindowChrome.User`, `WindowChrome.Prompt`, `WindowChrome.Tag`                                                                                                                                                                                  | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Toast` props `command`, `state`, `isPlain`; the `TOAST_GLYPH` literals (`✓ › ● ✕ ◐`)                                                                                                                                                           | Deleted; see Toast below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `chromeOn` pass-through in `packages/service` `theme-settings/adaptor/transformer.ts`                                                                                                                                                           | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Look tab "chrome" switch (`look-form-advanced-section`, `default-look-values`, `look-form`, `look-preview`, `preview-sample`), `lookPreview.terminalPrompt` message                                                                             | Deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Studio `settings_voice` singleton (`packages/studio/src/schema-types/documents/settings/voice.ts`, desk entry)                                                                                                                                  | Deleted; it has had no read path since the Postgres cutover. Two producers go with it: the `settings_voice` starter document seeded by `packages/db/scripts/provision-tenant/steps/starter-content.ts` (`STARTER_DOCUMENT_IDS.VOICE`), and the file's entry in `scripts/check-voice-key-sync.mjs` (next row). Typegen re-run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `scripts/check-voice-key-sync.mjs` and the `Voice key sync` job in `ci.yml` (`pnpm check:voice-sync`, `check:voice-sync:test`)                                                                                                                  | Phase 1: rewritten to diff the three surviving key sources (`voice-fields.ts`, `apply-voice-overrides.ts`, `upsert-site-config.ts`) in the same PR that deletes `settings_voice`, so the required check never reads a missing file. Phase 2: retired — the registry coverage test in `@blog/config` polices classification (every catalog key registered or explicitly fixed), which is the stronger guarantee; the three-list duplication it replaced disappears as the later Phase 2 PRs make the registry the single source the runtime reads — with the job removed from `ci.yml` and `docs/context/ci-automation.md` synced. No ruleset change is needed — `Voice key sync` was never in 18375038's required checks (verified 2026-09-07), so removing the job leaves no PR waiting on a check that never reports. Root scripts and workflows are orchestrator-owned tooling and ride in the owning layer's PR. |
| `BRAND_VARIANTS` (`packages/config/src/constants/brand.ts`), the Studio `brand.variant` field, its `.notNull()` projection in the site-settings query/transformer/types, and the Storybook brand toolbar in `packages/ui/.storybook/preview.ts` | Deleted. #1389 migrated the Indigo look into theme overrides and closed, but never removed the axis; no web code reads `variant` today. Dropping the Studio field orphans one unread string per `settings_site` document — confirm against `production` before the schema PR, no data migration required. Typegen re-run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| "Console brand variant" wording in the doc comments of `opengraph-image.tsx`, `twitter-image.tsx`, `default-social-image.tsx`                                                                                                                   | Reworded; comments only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Renames

- **`WindowChrome` → `Panel`** (`packages/ui/src/components/molecules/panel/`), compound
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

## Task 2 — Voice for the editor's copy

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

- **Surfaces**, in site order: archive empty states, bookmarks, not found,
  error page (D15). Navigation, the post page, sharing, account, the consent
  banner, sign-in (#2921), newsletter (D4), toasts (D5), metadata (D10) and
  archive titles (D13) are not surfaces.
- **Exclusions are mechanical:** a key is in the registry only if it is
  listed; the a11y keys, toast keys and newsletter keys are simply absent. A
  co-located test asserts every registry `path` exists in the catalog and
  every catalog key is either registered or on the explicit fixed list, so a
  new string cannot be added without deciding which it is.

Eleven fields (D15).

### Storage and validation (`@blog/db`)

`site_config.voice_overrides` stays JSONB; its type widens to
`Partial<Record<TLocaleIsoCode, Record<string, string | TVoicePortableText>>>`
(one map per language, D16) where `TVoicePortableText` is a
minimal block/span/link type owned by `@blog/config`. `TPortableTextBlock` in
`packages/db/src/schema/email-templates.ts` becomes a re-export of it so the
two JSONB columns share one shape; `@blog/email`'s serializer types and
`apps/platform`'s `EMAIL_PORTABLE_TEXT_SCHEMA` are untouched. No column
change; the D16 data migration nests the existing values under each tenant's
default `locale`.

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

- `resolveTenantMessages` becomes: base catalog ← the request language's
  overrides (D16), where each `TEXT`/`MULTILINE` override is set at its
  registry `path`. The merged messages must reach server-rendered strings as
  well as client ones. Every editable field renders on the server, so
  overrides that reach only `NextIntlClientProvider` never show.
- `RICH` keys cannot be next-intl messages. The tenant layout also mounts a
  `VoiceRichProvider` holding the resolved rich map (override, else the
  catalog string wrapped as one paragraph). A server accessor
  (`getVoiceRich(id)`) and a client hook (`useVoiceRich(id)`) return Portable
  Text, rendered by the existing `PortableText`. Consumers: empty
  states, and the not-found and error pages' supporting text.
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

### Preview (`apps/platform`, D7)

- **One specimen per surface, inside its card (D8).**
  - _Page not found_ and _Error page_: `Eyebrow` (left out when blank),
    `Heading` at hero size, `Text`, and the page's fixed actions as
    `LinkButton`/`Button`. Those are "Return home" for the 404, and "Try
    again" / "Go home" for the error page.
  - _Empty lists_: the open list only, inside its page. That is the list's
    eyebrow and heading (fixed, from Studio in the real site), its count
    line, then the message, with `{name}` filled from a sample topic or tag.
  - _Bookmarks_: the fixed page title and "Saved posts" panel heading
    around the empty message.
- **Where it lives.** The platform's single `@blog/ui` exception widens from
  `look/look-preview/preview-sample/` to one shared
  `apps/platform/src/components/features/site-preview/` directory. It holds
  both the Look sample and the Voice specimens and is still one
  ESLint-guarded directory. `configs/eslint/platform.js`, `CLAUDE.md`,
  `SPEC.md`, `.claude/agents/platform-app.md` and
  `docs/context/frontend-conventions.md` name the new path in the same PR
  that moves it.
- **Theme.** The `theme-preview-tokens` builders
  (`apps/platform/src/utils/theme-preview-tokens/`) plus the tenant's font
  variables, with the light/dark toggle the Look preview has.
- **Drafts.** Each field shows the draft value for the selected language
  (D16), else that language's catalog default from `SITE_MESSAGES_BY_LOCALE`
  (`@blog/config`). The fixed action labels come from the same catalog.
- **Rich values.** A small platform renderer handles exactly the
  `VOICE_PORTABLE_TEXT_SCHEMA` marks (bold, italic, link). `@blog/ui` has no
  Portable Text renderer, and the platform may not import `apps/web`'s.
- **Focus.** Each field's element sits in a platform-owned wrapper carrying
  `data-voice-key`. Focusing a field outlines that wrapper in the specimen
  beside it, and no `@blog/ui` prop widens for it.
- **Completeness.** The specimens' field map is typed
  `Record<TVoiceFieldId, …>`, so registering a field without placing it
  fails type-check.

### Voice page (`apps/platform`)

Layout per D8, D19 and the mock:

- **Header:** "Voice", a one-line description, and the D19 save status. The
  "Basic" card and the "Advanced" disclosure are removed. A one-line note
  says buttons, menus and labels are translated for you and so aren't
  listed.
- **Language:** a switcher over the tenant's live languages, shown when it
  serves more than one (D16). Each language shows its customised count.
  Fields, placeholders, badges and specimens all follow the selected
  language.
- **Cards:** one per surface in site order. The header shows the surface
  name, where it appears and its customised count.
  - Each field row has a label, a hint saying where it appears, and the
    control for its kind (`TextInput`, `Textarea`, or `PortableTextEditor`
    with a bold/italic/link toolbar). The neutral default is the
    placeholder.
  - A Default or Customised badge, an unsaved marker and **Reset** once
    overridden.
  - A "Keep `{name}`" note when the field has a placeholder token.
  - Inline field errors from the save action.
  - The specimen sits beside the fields (D7, D8).
- **Phone:** cards stack their fields over a "Show preview" disclosure. Tap
  targets are at least 44 px, and inputs use 16 px text so iOS doesn't zoom
  in.
- **Editor:** `PortableTextEditor` gains a `schema` prop (default: the email
  schema) so Voice passes `VOICE_PORTABLE_TEXT_SCHEMA`; the toolbar renders
  only the buttons the schema allows.
- **Labels and hints** live in the platform catalog under `voiceFieldLabels.
<id>` / `voiceFieldHints.<id>` / `voiceSurfaces.<surface>`; a test asserts
  every registry id has both.
- **Save** through the D19 save bar. `saveVoiceOverridesAction` sends the
  full draft. The bar's Save shows the pending state (D14), and the field
  controls are `inert` meanwhile. `upsertSiteConfig` validates; success
  toasts, refreshes and revalidates the site as today. `fieldErrors` render
  inline, the bar counts them and links to the first.
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

**Amendment (2026-10-08) — remaining delivery.** The preview route (#2757)
is not built (D7). The rest lands one layer at a time, each merged before
the next starts:

1. `web`, `prio:now`: a confirmed fix so overrides reach server-rendered
   strings (see Rendering). It ships first and stands alone.
2. `config`: the D15 scope cut and D18's "Contents". This one PR also edits
   the `web` and `db` tests that name a moved id, so it merges green alone.
3. `config` + `platform-app`: retire `notFoundReturnHome` in one PR, because
   the platform's field list has to drop it in the same change (D15).
4. D16 per-language overrides, through `config → db → web → platform-app`,
   expand/contract so each PR merges green alone.
5. #2911 is rescoped to the three surviving `RICH` sinks outside the empty
   states: `notFoundSupportingText`, `localeErrorDescription` and
   `bookmarksEmpty`.
6. `platform-app`, #2758 rescoped: the `site-preview/` move, then the
   editor, then the specimens. The settings save bar and leave-page guard
   (#4480) land first; draft recovery (#4481) and the Look page's move
   onto the shell (#4482) follow independently.
7. D17 runs as its own `studio → service → web` chain, parallel to all of
   the above.
8. D20, two `platform-app` tickets in order: the Look layout, then staged
   brand images (both edit the Look form). Independent of the Voice chain.

**Env and docs in the same PRs:** `SPEC.md` "Theme-as-content",
"Voice-as-content", "Curated UI copy" and the cookie-consent "Copy" bullet
are rewritten to this doc's final shape. `.claude/agents/platform-app.md`
gains the Voice page and specimen conventions. This spec is deleted in the
PR that syncs `SPEC.md`.

**Verification** per PR: `pnpm verify`, plus `pnpm typegen` diff-minimal for
the Studio PRs.

## Later (recorded, not scoped)

- Click-to-edit from the preview (variant B): the specimens' `data-voice-key`
  wrappers already carry what it needs.

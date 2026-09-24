# Content model

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §6. Update this file (not a duplicate) whenever
> the Sanity schema changes shape.

Source of truth: `packages/studio/src/schema-types/` (documents grouped `blog/`,
`pages/`, `settings/`; shared `objects/`; `modules/` — standalone,
cross-referenceable page-builder documents, not embedded objects). Naming
convention `{group}_{name}` is being applied incrementally (#251):
every `settings_*`, `page_*`, `blog_*`, `block_*` and `module_*` document is
done; `link` and `migrationState` still carry legacy names.

**Modules are documents, not embedded objects** — pages reference them by
`_ref`, so a module is independently listable, previewable, and reusable
across pages (Studio's built-in **Incoming references** view shows which
pages use a given module before it's edited or deleted). `TModuleType`
(`packages/config/src/constants/module.ts`) is the single source of truth for
the module type registry — a **type-only** union derived from the generated
Sanity types, not a runtime const.

**Only one consumer of that union is exhaustive.** `REVALIDATE_TAGS` requires
a `Record<TModuleType, …>` half, so a new module type that is missing there is
a compile error (see [`data-flow.md`](./data-flow.md)). Rendering is not:
`apps/web` keys components in **one map per page type** — `HOME_MAP`,
`LANDING_MAP`, `BLOG_POST_MAP`, `POST_INDEX_MAP`, `TOPIC_MAP`, `TAG_MAP`,
`TOPIC_INDEX_MAP`, `TAG_INDEX_MAP` — and every one is declared
`Partial<Record<TPage…Type, TModuleComponent>>`. A module the schema allows on
a page but the map omits therefore compiles cleanly and renders nothing at
runtime. That is the drift to check for by hand when adding a module: a new
type that lands in a page's `allow` list but not in that page's map.

Those per-page maps include the hero types, so a hero is keyed the same way as
any other module; what differs is that a hero arrives through the page's own
`hero` reference rather than its `modules[]` array.

## Module documents

`packages/studio/src/schema-types/modules/`. Sixteen `module_*` types exist.
**Fifteen are live** — schema, service adaptor and renderer all present. One is
not, and should not be described as working:

| Type          | State                                                                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `module_hero` | Deprecated in-schema ("Superseded by the Blog Hero module"). No page's hero slot offers it, no renderer keys it, and its surviving `service.modules.hero.v1` loader has no caller. Replaced by `module_heroBlog`. |

### What every module carries

- **`title`** — required, internal Studio label only, never rendered. Via
  `titleField()`, so a module stays listable and previewable independent of its
  display fields.
- **`brandVariant`** — required, via `brandVariantField()`. `PRIMARY` /
  `SECONDARY` by default; the hero family and `module_cta` pass the wider list
  including `BRAND_PRIMARY`.
- **`layout`** — optional. `spacingTop` / `spacingBottom` (five named scales),
  `dividerTop` / `dividerBottom` hairlines, and `containerWidth` capping the
  inner content. Spacing is padding rather than margin, so consecutive bands
  tile edge-to-edge. Heroes use `heroLayoutField`, which omits
  `containerWidth`.
- **`headingBlock`** — required where present (its own `heading` required,
  `supportingText` optional). Every module except `module_content` and
  `module_heroBlog`, both of which get their heading elsewhere.

### The layout controls, stated once

These recur across modules and mean the same thing everywhere:

- **`brandVariant`** colours the full-bleed band behind the module
  (`bg-primary` / `bg-secondary` / `bg-brand-primary-muted`). Nothing
  structural changes.
- **`contentAlignment`** text-aligns the module's own heading and supporting
  copy. It never affects cards, grid columns, or item layout.
- **`contentPosition`** applies to the hero family and `module_cta` only. On
  `SPLIT` it chooses which side the copy sits on from `lg` up; on `BANNER` it
  chooses which corner the text block occupies. **It does nothing on
  `STACKED`, and nothing on CTA's `CALLOUT`.** It is stored as separate
  per-variant fields (`contentPositionSplit`, `contentPositionBanner`) which
  the service layer collapses into one value.
- **`mediaOrder`** on `SPLIT` reorders **the mobile stack only** — the desktop
  side is `contentPosition`'s job. On `STACKED` it puts the image above or
  below the copy at every width. It has no effect on `BANNER`.
- **`displayMode`** switches a grid for a carousel. Carousels show roughly one
  and a fifth cards on mobile (a deliberate peek at the next), two from `sm`,
  three from `md`, with scroll-snap; the arrows hide once hydrated if there is
  nothing left to scroll.

### Hero slot — one per page, rendered before `modules[]`

All three share `variant` (`SPLIT` default · `STACKED` · `BANNER`) and the wide
`brandVariant` list. `SPLIT` is two columns from `lg` up; `STACKED` is one
column at every width; `BANNER` goes full-bleed to the viewport with the image
as a scrimmed background and white text.

#### `module_heroBlog` — featured-post hero

Opens a page with one blog post: its image, its own title as the heading, and a
primary action linking to it. Either pin a post or let it track the newest post
marked Featured.

- **Source** — `postSource`: `NEWEST_FEATURED` (default) · `PINNED`. Pinning
  reveals a `post` reference, whose picker is filtered to published posts.
- **Optional overrides** — `image` falls back to the post's hero image;
  `eyebrow` falls back to the post's topic.
- **Action** — `primaryActionLabel` required, 40 characters max;
  `primaryActionAppearance`: `CONTAINED` (default) · `INLINE`; one optional
  secondary action.
- **Blocks publish** — `NEWEST_FEATURED` with no published featured post
  anywhere (checked by live query), or `PINNED` with no post chosen.
- **Renders nothing** if the referenced post does not resolve.
- **Pages** — home, landing, tag, topic, post index, topic/tag index.

#### `module_heroProfile` — person hero

Introduces one person, drawing their photo, role, bio and social links from a
referenced author.

- **Author** — `author` reference, required; publish is blocked without it.
- **Image** — optional, and the fallback differs by variant: `STACKED` shows a
  circular avatar falling back to initials, `SPLIT` shows a square portrait
  **only if an image exists** (with none, nothing visible renders and the name
  is screen-reader-only), `BANNER` shows the photo full-bleed or nothing.
- **Toggles** — `showRole` (on) fills the eyebrow slot with the author's role
  instead of the module's own `eyebrow` copy, which is hidden while it is on;
  `showBio` (on) renders the bio; `showSocialLinks` (on) renders the social
  row.
- **Actions** — `ctaButtons`, 0–2, no two of the same variant, primary first
  if present.
- Has no `STACKED` media-order control, unlike the other two heroes.
- **Pages** — home, landing.

#### `module_heroStatement` — authored statement hero

A bold opening statement with no post or author behind it — every word and
image is authored on the module.

- **Copy** — `headingBlock` required, `eyebrow` optional.
- **Image** — **required for `SPLIT` and `BANNER`**, optional for `STACKED`.
  Publish is blocked if missing on the two variants that need it.
- **Actions** — `ctaButtons`, 0–2, same ordering rule as above.
- **Pages** — home, landing.

### Allowed on every page with a `modules[]` array

#### `module_cta` — single-action section

A headline, supporting copy, up to two actions and an optional image, in one of
three shapes.

- **Variants** — `variant`: `CALLOUT` (default) · `SPLIT` · `BANNER`.
  `CALLOUT` is a centred card with the media above the copy and a fixed
  maximum width. `SPLIT` is two columns from `md` up with the media in a
  bordered, rounded frame. `BANNER` is full-bleed with a scrimmed background
  image.
- **Two tones, not one** — `brandVariant` (default `SECONDARY`) colours the
  card or overlay; `bandTone` (default `PRIMARY`, hidden for `BANNER`) colours
  the outer band behind it. A warning, not an error, flags the two being
  equal.
- **Image** — required for `BANNER` and `SPLIT`; publish is blocked without
  it.
- **Copy** — optional `eyebrow`, optional `content` (short formatted text),
  `footnote` capped at 120 characters.
- **Actions** — `ctaButtons`, 0–2, same ordering rule as the heroes.
- **Pages** — all.

#### `module_newsletter` — subscribe section

Heading, copy and the signup form.

- **Variants** — `variant`: `FULL` (default) · `COMPACT`. `FULL` is a bordered
  panel that splits into two panes from `md` — pitch and trust cues on the
  left, form on the right. `COMPACT` is a single accent-bordered strip that
  becomes one inline row from `sm`.
- `contentAlignment` affects `FULL`'s pitch pane only; `COMPACT` ignores it.
- **Renders nothing** when the tenant's `NEWSLETTER` capability is off, and
  for any visitor already carrying a subscribed cookie. Neither is an author
  setting.
- **Pages** — all.

### Allowed on home and landing only

#### `module_content` — prose body

A block of portable text between other modules. No variants beyond the band
colour.

- **`body`** — required, type `articleText`: `Normal`, `H2`–`H4` and `Quote`
  styles (H1 is deliberately excluded so the body never competes with the page
  title), images with alt text and their own layout, code blocks, and asides.
  Link annotations point at a `link` document.
- Bulleted and numbered lists, and Sanity's full default decorator set (bold,
  italic, code, underline, strike-through), are **inherited by omission** —
  `articleText` declares neither, unlike its narrower siblings `listedText`
  and `paragraphText`, which spell out bold and italic only. They render
  correctly; the intent is simply undeclared.
- **Pages** — home, landing.

#### `module_featureList` — feature cards

A grid or carousel of feature cards.

- **Items** — `features`: 2–8 references to `block_feature` **documents**, so
  the same feature can appear on several pages and be edited once. Each
  requires an icon or an image.
- **Variants** — `imageShape` required: `WIDE` (default) · `SQUARE` ·
  `CIRCLE`; an item with no image falls back to its icon. `displayMode`:
  `GRID` (default) · `CAROUSEL`. `cardAlignment` required: `LEFT` (default) ·
  `CENTER`, which centres each card's own text and media.
- **Grid columns are computed, not authored** — 2→2, 3→3, 4→4, 5–6→3, 7–8→4,
  chosen so the last row never leaves a single orphan card.
- **Actions** — `ctaButtons`, 0–2.
- **Renders nothing** when no items resolve.
- **Pages** — home, landing.

#### `module_testimonial` — social proof

- **Items** — `testimonials`: 1–8 references to `block_testimonial`
  **documents**, reusable the same way feature cards are. Each requires a title,
  a name and a quote; role, image and link are optional. The quote is Portable
  Text (`listedText`), not a string, so it carries bold, italics, lists and
  inline links.
- **Variants** — `displayMode`: `GRID` (default) · `CAROUSEL`;
  `cardAlignment`: `LEFT` (default) · `CENTER`. A single quote always renders as
  a spotlight, with its heading and actions centred whatever `contentAlignment`
  says; from two items up, `displayMode` picks the grid or the carousel.
- **Grid columns** derive from the item count — 2→2, 3→3, 4→2, 5→3, 6→3, 7→3,
  8→2 — capped at three rather than the feature grid's four, because a quote is
  the wider card. Seven is the one count left with a single card on its last
  row; no column choice inside that cap avoids it.
- **Images** — an item renders its `image` when it has one and the person's
  initials otherwise. There is no module-level toggle: the item is the only
  thing that decides.
- **Actions** — `ctaButtons`, 0–2.
- **Pages** — home, landing.

#### `module_logoWall` — logo social proof

- **Items** — `logos`: 1–12 **inline `logoItem` objects**, not references. Logos
  never recombine: a wall is reused by referencing the same `module_logoWall`
  from several pages, so reuse already happens one level up. `block_logo`
  existed briefly and was retired for that reason. Validated `required()`,
  `min(1)` and `max(12)` as separate rules, and deliberately **without
  `unique()`** — repeating a logo is not a mistake worth blocking.
- **The item** — `name`, an `image` and an optional `link` reference. `name` is
  the logo's alt text and never renders as visible text: WAI's rule is that a
  logo's alt is the organisation's name, “Stripe” rather than “Stripe logo”. The
  image is a plain `image`, not an `imageWithAlt`, because a generic “describe
  the image” prompt invites the wrong alt.
- **A wrapping flex row, not a grid** — `LogoTile` is a fixed-size card, so how
  many fit per row follows from wrapping rather than a column count or a
  breakpoint ladder. There is no derived column helper. See `SPEC.md` for the
  card's dimensions and for why the logo's box is computed from the asset's
  aspect ratio rather than from the decoded image file.
- **Variants** — `displayMode`: `GRID` (default) · `CAROUSEL`.
- **Actions** — `ctaButtons`, 0–2.
- **Renders nothing** when the array is empty, or when a logo's image cannot be
  resolved — one unresolvable logo costs the whole wall rather than leaving a
  gap in it.
- **Pages** — home, landing.

#### `module_stats` — figures that back a claim

- **Items** — `stats`: 2–6 **inline `stat` objects**, not references. A logo or
  a quote recurs across pages; a figure belongs to the argument one page is
  making, and reusing it would make a stale number wrong in two places. So
  there is no Blocks desk entry, no reference picker and no `block_*`
  revalidation tag — the whole module is one document read.
- **The figure** — `value` is a single required string, never a number plus a
  unit: real figures are `2.4M`, `<50ms`, `4.9/5`, `24/7`, `3×`, `Top 10`, and
  a number-plus-unit split expresses none of them. Nothing is parsed; past
  eight characters it warns. `label` is required, `description` optional.
- **No `displayMode`** — two to six short figures always fit one or two rows,
  so a carousel would hide them behind a swipe. One alignment control only:
  the figures follow `contentAlignment` with the heading and actions.
- **Grid columns** derive from the item count — 2→2, 3→3, 4→4, 5→3, 6→3 —
  via the shared `toModuleGridColumns` helper, capped at four and dropping to
  two on tablet and phone.
- **Not cards** — the figures sit directly on the band with a hairline between
  columns and no surface, border or radius. A card surface would promise a
  click this module does not have, so `CardGrid` is skipped.
- **Reading order** — the band is a `<dl>`, label-first in source order, so a
  screen reader hears “median organic lift, plus 38 percent”; CSS `order` puts
  the value on top visually. The value is the only thing carrying the accent.
- **Footnote** — `footnote`, one optional line under the figures.
- **Actions** — `ctaButtons`, 0–2.
- **Pages** — home, landing.

### Listings

#### `module_postList` — paginated archive

The archive itself: every post, or the posts of the topic or tag whose page
holds it. This is the only paginated module; every other listing is a
fixed-count teaser.

- **`pageSize`** — required integer, 1–24. The page number comes from the
  route, not the schema.
- **`showImages`** toggles card images; with it off the card is text-only, with
  no placeholder.
- No `displayMode` — always a grid.
- **Always renders something.** Empty results show an empty-state message;
  a fetch failure or an out-of-range page returns a 404 rather than an empty
  page.
- **Page-side rules** — exactly one per topic, tag or post-index page (error),
  a warning when absent, and a given post-list document may back only one
  topic or tag page (error).
- **Pages** — topic, tag, post index.

#### `module_postLatest` — newest posts

A short teaser of the most recent posts, for surfacing recency on a page that
is about something else.

- **`limit`** — required integer, 1–12. `displayMode`: `GRID` (default) ·
  `CAROUSEL`. `showImages`.
- A warning, not an error, when `CAROUSEL` is paired with a limit below 4 —
  fewer than four cards do not fill a row on wide screens.
- **Renders nothing** when no posts resolve.
- **Pages** — home, landing, topic, tag, topic/tag index.

#### `module_postFeatured` — spotlight, at most three

A curated highlight rather than a chronological feed, with the first post shown
larger as the lead.

- **Source** — `postSource` required: `PINNED` (default) reveals a `posts`
  array (unique, at most 3, at least one required); `NEWEST_FEATURED` reveals
  a `limit` of 1–3 instead.
- **Variants** — `displayMode`, `showImages`. In `GRID` the lead post renders
  as a large card with its media beside the text from `md` up; a single
  remaining post becomes a second full-width split card, and two or more fall
  into a two-column grid beneath. **`CAROUSEL` drops the lead distinction
  entirely** — every item renders uniformly.
- **Blocks publish** — `NEWEST_FEATURED` with no published featured post
  anywhere.
- **Renders nothing** when no posts resolve.
- **Pages** — home, landing, post index.

#### `module_postRelated` — next reads

Other posts the reader might want next, chosen automatically from the current
post's tags and topic. The selection lives in the service layer; nothing about
it is authored.

- **`limit`** — required integer, 1–6, default 3. `showImages`. No
  `displayMode` — always a grid.
- **Pages** — post only. It is the sole listing module allowed there.

#### `module_taxonomyList` — browse topics or tags

A list of topics or tags, each with its description and post count.

- **`taxonomy`** — `TOPICS` · `TAGS`, and **optional on the module** so it can
  inherit the subject of the page holding it.
- **`sortOrder`** — `ALPHABETICAL` (default) · `MOST_POSTS`.
- **`limit`** — integer, minimum 1, no maximum; empty shows every term.
- **`showLatestPosts`** (on) inserts each term's most recent post titles
  between its description and its post count.
- **Enforcement of `taxonomy` is uneven.** Home, landing and the topic/tag
  index pages reject a referenced module that has no `taxonomy` set, and the
  index pages additionally reject one whose kind disagrees with the page.
  Post index, topic and tag pages allow the module but run no such check — on
  those, an empty `taxonomy` publishes cleanly.
- A fetch failure returns a 404; zero entries show an empty-state message.
- **Pages** — home, landing, topic, tag, post index, topic/tag index.

### Not author-controllable

Behaviour that exists in the renderer with no schema field behind it. None of
it can be presented as a setting:

- Feature-grid column counts (derived from item count).
- The larger lead card in `module_postFeatured`'s grid, and its separate
  image-rendering path.
- `module_heroProfile`'s initials fallback, which exists for `STACKED` only.
- Newsletter suppression by tenant capability or by a subscribed visitor.
- Carousel cards-per-view breakpoints and arrow auto-hiding.

## Page documents reference modules

Every page composes from the same two slots: an **optional** `hero` (a single
reference, rendered before everything else, which takes over the page's `<h1>`
when set) and a `modules` array. What differs per page is which module types
each slot accepts.

`heroField({ allow })` (`schema-types/fields/hero-field/hero-field.ts`) and
`modulesField({ allow, description?, once? })`
(`schema-types/fields/modules-field/modules-field.ts`) build both — one strong
`reference` array member per allowed type, defined in one place rather than
duplicated per page.

| Page                               | Hero slot accepts                          | `modules[]` accepts                                                                                        |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `page_home` (singleton)            | `heroBlog`, `heroStatement`, `heroProfile` | `content`, `cta`, `newsletter`, `postLatest`, `taxonomyList`, `postFeatured`, `featureList`, `testimonial` |
| `page_landing`                     | `heroBlog`, `heroStatement`, `heroProfile` | same eight as home                                                                                         |
| `page_postIndex` (singleton)       | `heroBlog`                                 | `postList`, `cta`, `newsletter`, `postFeatured`, `taxonomyList`                                            |
| `page_topic`, `page_tag`           | `heroBlog`                                 | `postList`, `postLatest`, `cta`, `newsletter`, `taxonomyList`                                              |
| `page_topicIndex`, `page_tagIndex` | `heroBlog`                                 | `taxonomyList`, `postLatest`, `cta`, `newsletter`                                                          |
| `page_post`                        | — none                                     | `postRelated`, `newsletter`, `cta`                                                                         |

**Home and landing are the composable pages** — they take all three heroes and
every non-listing module. Everything else is a page _about_ something, so its
hero is fixed to `heroBlog` and its module list is scoped to what makes sense
there. `page_post` has no hero slot at all.

`page_topicIndex` and `page_tagIndex` are both produced by one factory,
`taxonomyIndexPage({ kind, … })`, so they differ only in their fixed taxonomy
kind. Each still carries a legacy singular `taxonomyList` reference field,
**deprecated and read-only** — superseded by the `module_taxonomyList`
reference now folded into `modules[]`, and left in place only until a migration
drops it. Do not author against it.

**`modules[]` validation lives in `modulesField`, not per page.** Two rules run
on every page: `.unique()` rejects the same module _document_ referenced twice,
and — when the page passes `once` — a second module of a listed _type_ is
rejected, flagged against each offending array item rather than as a
document-wide banner. Omitting `once` attaches no second rule at all.

| Page                               | `once`         |
| ---------------------------------- | -------------- |
| `page_postIndex`                   | `postList`     |
| `page_topic`, `page_tag`           | `postList`     |
| `page_topicIndex`, `page_tagIndex` | `taxonomyList` |
| `page_post`                        | `postRelated`  |
| `page_home`, `page_landing`        | — none         |

Home and landing pass nothing deliberately: they are the composable pages, so
repeat `module_content`, `module_cta` and `module_newsletter` have to stay
authorable. A blanket one-per-type rule would forbid the second content section
on a marketing page.

**Only three page-level rules survive**, each guarding a state the renderer
would otherwise get silently wrong:

- **Topic, tag** — a term may back only one archive page
  (`validateUniqueTaxonomyReference`, on the `topic`/`tag` reference field).
  Every taxonomy href resolves through `*[_type == "page_topic" && topic._ref ==
^._id][0]`, so a second page makes that `[0]` arbitrary.
- **Topic index, tag index** — a referenced `module_taxonomyList` must match the
  page's own kind (`validateTaxonomyListReferencesMatchKind`). Nothing else
  stops `/topics` listing tags.
- **`blog_topic`, `blog_tag`** — a term with no archive page blocks publishing
  (`validateHasPage`), since its URL 404s with no runtime fallback.

The cardinality, blank-heading and unset-taxonomy validators that used to sit
here are gone. The blank-heading ones guarded a state `headingBlockField()`'s
`required()` already makes impossible; the "warns when none is present" ones
were invisible until an editor clicked the validation icon; and an unset
`module_taxonomyList.taxonomy` now renders the module's empty state instead of
404ing the page.

Beyond the module slots, pages carry their own fields: `title` (internal Studio
label on the singletons), `slug` where the page is addressable — `page_landing`
additionally rejects anything in `RESERVED_SLUGS` — `headingBlock` where the
page owns its own `<h1>` (hidden once a hero is set, since the hero then owns
it), and `seo` on all of them. `page_topic` and `page_tag` each add a required
reference to the term they archive.

`page_post` carries the most of its own, since the post _is_ the page:
`heroImage` (`imageWithAlt`, optional — a post without one renders imageless
rather than 404ing), `content` (`articleText`, required), `featured`, `author`
(→ `person`, required), `topic` (→ `blog_topic`, required — the single
primary classification), `tags` (→ `blog_tag`, optional, max 6), `publishedAt`
(required — it drives sort order and the date readers see), and
`postTakeaways` (optional, the 30-second-skim summary).

**Other documents**

- `person` — name, image (`imageWithAlt`), bio, role, socialLinks (array of
  `socialProfile`), profilePage (optional ref → a `link` document, so any page
  type it can target).
- `blog_topic` — `title` (required, max 60), slug, description (max 300). The
  post's single primary classification, rendered by the `page_topic` archive
  that references it.
- `blog_tag` — same shape as `blog_topic`. A peer taxonomy, not a sub-level of
  it: a post carries one required `topic` and up to six optional `tags`, and
  each drives its own archive. Neither carries `seo` of its own — the archive's
  metadata lives on the `page_topic`/`page_tag` document that renders it, and
  both warn when no such page exists.
- `block_feature` (`featureBlockSchema`) — a reusable feature card, referenced
  by `module_featureList`'s `features` array (2–8 per module).
- `block_testimonial` (`blockTestimonialSchema`, titled "Testimonial Item") — a
  reusable quote, referenced by `module_testimonial`'s `testimonials` array (1–8
  per module). Authored under **Blocks → Cards** alongside `block_feature`.
- `link` — the single link target every reference-shaped object
  (`linkRef`, `ctaButton`, `ctaSecondaryButton`, `socialProfile`,
  `person.profilePage`) points at.
- `settings_site` (singleton) — `titleField` (bare; see helper note below),
  brand
  (`brand` object: name/logo/tagline — `logo` is optional, falling
  back to a default mark when unset; `tagline` is
  a `brandTagline` object, `{ items: string[] (max 4, each max 15 chars),
separator: BRAND_TAGLINE_SEPARATORS }`, replacing a plain string so the
  service layer can join it with a chosen separator glyph). Carries no SEO
  fields — page metadata and the RSS channel description are authored on the
  pages themselves.
- `settings_theme` (singleton, `themeSettingsSchema`) — `titleField` (bare; see
  helper note below), `preset` (required, `PRESET_ID` stored value:
  `CONSOLE`/`EDITORIAL`), `accentHue`/`logoHue` (optional numbers, 0-360,
  OKLCH hue channels — `logoHue` falls back to `accentHue` when unset),
  `headingFont`/`bodyFont` (optional, `FONT_CHOICE`), `radiusScale`
  (optional, `RADIUS_SCALE`), `density` (optional, `DENSITY`) — a
  tenant-level theme override resolved against `PRESET_REGISTRY` in
  `@blog/config`; part of the Phase 2 configurability epic (#1285).
- Voice copy has no Studio schema. Tenant-overridable UI strings live in
  Postgres, in `site_config`'s `voiceOverrides`, edited in the platform's
  Voice page and merged over the neutral catalog at request time. The
  `settings_voice` singleton that once held them was deleted after the
  Postgres cutover left it with no read path.
- `settings_navigation` (singleton) — `titleField` (bare; see helper note
  below), items (links).
- `settings_footer` (singleton) — `titleField` (bare; see helper note below),
  `social` (social links).
- `settings_newsletter` (singleton) — `titleField` (bare; see helper note
  below), `heading` (required, max 80), `description` (optional, max 300),
  `trustCues` (optional, max 2 phrases of 40 characters) — the CMS-authored
  source of the newsletter form's copy wherever
  it's rendered outside the `module_newsletter` page-builder placement. Lives
  in the desk's **Blog** section, directly after Authors, not the top-level
  Settings group.
- `migrationState` — the system ledger recording which content migrations in
  `packages/studio/migrations/` have run. `studio-config.ts` hides it from
  document actions and the new-document menu; it is never authored by hand.

**Reusable `titleField` helper** (`schema-types/fields/title-field/title-field.ts`) —
`titleField({ initialValue?, readOnly?, description? })`
returns a required `defineField({ name: 'title', type: 'string', … })`. The
field is an **internal Studio label**, never rendered, and its single default
description says so. It says nothing about the slug even on the documents
whose slug derives from it — `slugField()`'s own description already does, one
field below. A caller passing its own `description` overrides the default.
Keep it **bare**
for singletons: a fixed `initialValue` + `readOnly: true` does **not** fix the
Studio "Untitled" heading — `initialValue` doesn't fire for a singleton
opened by `documentId`, and `readOnly` then leaves the field permanently
empty. Singletons resolve their Studio label via `preview.prepare` instead
(select `title`, fall back to `'Unknown'`). Content/module documents pass
`max` for an editable headline.

**Objects** — `linkRef`, `ctaButton`, `ctaSecondaryButton` and
`socialProfile` (each wrapping a reference to a `link` **document**), `stat`
(one figure — `value`, `label`, optional `description` — embedded on
`module_stats` rather than referenced, so a number lives with the one
argument that uses it),
`brand`, `brandTagline` (structured tagline: `items` + a
`BRAND_TAGLINE_SEPARATORS`-driven `separator`), `imageWithAlt` (required alt —
used by `page_post.heroImage`, `person.image`, `brand.logo`,
`openGraph.image`, `block_feature.image` and the hero/CTA modules), `bodyImage` (required alt; optional `layout`
from `IMAGE_LAYOUT`, undefined = Inline — shares its `alt`/hotspot shape with
`imageWithAlt` via the `image-alt-field` helper, but is a distinct type
registered only as `richText`'s body-array image member, so the layout
choice can't leak into hero/avatar/OG/brand images), `seo` (`metaTitle`
required, 30–60 characters; every other field optional and omitted from the
page head when unset — there is no fallback) + `openGraph`,
`proseText` / `richText`, `aside` (deep-dive block type registered in
`richText`'s portable-text array; `kind` from `ASIDE_KIND`, required; `body`
via `proseText`, required — part of the choose-your-depth reading feature,
#957), `postTakeaways` (see `page_post` above), `layout`/`heroLayout` (all-optional
fields, no defaults set at the schema level: `spacingTop`/`spacingBottom`
(`SPACING_SCALE`), `containerWidth` (`CONTAINER_WIDTH`, `layout` only —
`heroLayout` omits it, Hero's grid always manages its own width),
`dividerTop`/`dividerBottom` (boolean) — the two types share their
overlapping fields via `spacingAndDividerFields()` (same
two-named-types-sharing-a-helper pattern as `imageWithAlt`/`bodyImage`), and
are attached to every `module_*` document via the shared `layoutField`/
`heroLayoutField` values; `service`/`apps/web`'s `Section` component decide
unset-vs-set and rendering defaults), `headingBlock` (`heading` (string)
and `supportingText` (text) — neither carries a length cap, forced `max()`
validation having been removed as editor-hostile). There is **one**
registered `headingBlock` type; requiredness is enforced at two levels,
since Sanity never descends into an absent object — the registered type
marks its nested `heading` `required()`, and `headingBlockField()`, which
takes no options, marks the containing field `required()` so that nested
rule always has an object to run against. The heading is
**required on every call site** — every module and every page — so no layer
has to reason about which case it is holding; `module_content` and
`module_heroBlog` carry no `headingBlock` at all — the first has no heading of
its own, the second takes the referenced post's title — and
alignment is not bundled here — it is a separate module-level
`contentAlignment` field. Every `module_*` document gets its own
standalone, **required** `brandVariant` field (`@blog/config`'s
`BRAND_VARIANT` const) via the shared `brandVariantField()` helper, placed
immediately after `titleField` in each schema's `fields` array (see
"Module documents" above).

**Conventions**

- `defineType`/`defineField`/`defineArrayMember` everywhere; validation
  `rule.required()` on every field the frontend assumes; images get
  `hotspot: true` + required alt. Every schema definition is a **named
  export** (`{localName}Schema`) — never `export default defineType`.
- Enum-ish stored values come from `@blog/config` constants — **both key and
  value UPPERCASE** (`LINK_TYPE.INTERNAL === 'INTERNAL'`,
  `HERO_FIELD_MODE.CUSTOM === 'CUSTOM'`), `as const`; schema `options.list` and
  migrations use the same constant.
- Singletons enforced through desk structure; Studio also groups a top-level
  **Modules** section with one browsable list per module type (Heroes, Post
  Lists, Content, CTAs).
- No migration was needed for the modules-as-documents redesign — datasets
  were recreated clean before this model shipped.

## Migrations & live data (core contract)

Content is live in the `production` dataset. Schema and content are decoupled:
changing a schema does **not** change existing documents.

- Any change altering an _existing_ shape (rename/remove/move a field, rename a
  `_type`, restructure a document) **requires a content migration** — decide
  this before implementing, and surface the plan to the user. Additive,
  optional-only changes need none (say so explicitly).
- Tooling lives in `packages/studio/migrations/` (`README.md`) with helper scripts:
  `migrate:new` (folders are now UTC-timestamped, `YYYYMMDDTHHmm-<slug>`, for
  deterministic run order) / `migrate:dry` / `migrate:run` / `dataset:export`.
- Workflow: **dry-run → dataset export (backup) → human-gated run**. Running
  against `production` is human-gated, like deploys. Migrations must be
  idempotent.
- **`migrate:deploy`** runs only the migrations not yet recorded in a
  per-dataset `migrationState` ledger document (`_id: 'migrationState'`, a
  declared but Studio-hidden schema type — no create/edit/delete actions,
  excluded from the new-document menu), in order:
  dry-run → run (`--no-dry-run --no-confirm`) → append `{id, runAt, sha}` to
  the ledger, stopping on first failure. A second run with nothing new is a
  no-op. `migrate:backfill` records the currently-pending folder migrations as
  applied **without** running them (one-time, per dataset, for migrations that
  predate the ledger). Both need a write token (`SANITY_AUTH_TOKEN` /
  `SANITY_DEPLOY_TOKEN`).
- CI (`Migrations` job) validates every migration loads and — with a read
  token — dry-runs each one read-only. It never mutates data.
- `migrate:deploy --yes` is automated as part of the deploy pipeline: dev runs
  it via `deploy-development.yml`'s `migrate` job on merges to `main` that
  touch `studio` or `web` (an admin-only merge skips it, since neither changed;
  a web-only change still needs the migration), production runs it
  unconditionally via `deploy-production.yml` on a `vX.Y.Z` tag push, after a
  dataset export backup and behind the `production` Environment's
  required-reviewer gate, same as `sanity deploy`. Both commands remain
  available to run manually (e.g.
  `SANITY_STUDIO_DATASET=development pnpm --filter @blog/studio migrate:deploy`) for
  local rehearsal or backfilling a dataset outside the pipeline.

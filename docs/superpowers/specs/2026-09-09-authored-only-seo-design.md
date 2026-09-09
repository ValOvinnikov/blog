# Authored-only SEO and headings

**Status:** decided, not implemented. Recorded 2026-09-09.

## Why

Every page's SEO metadata currently resolves through a fallback ladder —
`authored → content-derived → site defaults` — implemented in
`packages/service/src/shared/transformers/resolve-seo.ts`. The ladder is
invisible to editors: `seoSchema` is one shared object used by every page
type, its only affordance is the sentence "Leave empty to use the page
content", and that sentence cannot name the source because the source differs
per page. The object is also `collapsible: true, collapsed: true`, so it is
shut by default. There is no custom input, no resolved-value preview, and no
computed placeholder — nothing renders what will actually ship.

The ladder also leaked: the blog index page passed its **document `title`** as
the content-derived tier, putting an editor-facing desk label into `<title>`
and `og:title`.

The decision is to remove the guessing rather than document it. What an editor
types is what ships; what they leave empty is omitted.

## The rules

1. **A page document's own `title` never reaches the web** — not as rendered
   copy, not as metadata, not as a fallback for either. It is a desk label.
2. **`seo.metaTitle` is required**, `min(60)`, **no maximum**.
3. **`seo.metaDescription` stays optional**, with no fallback — when empty the
   description tag is omitted entirely rather than filled from anywhere.
4. **Open Graph stays optional, with no fallbacks** — `ogTitle`,
   `ogDescription` and `ogImage` are authored per page or omitted. This drops
   the site-wide `settings.defaultOgImageUrl` default and the post hero image
   fallback, and means `og:title` is no longer inherited from `metaTitle`.
5. **Fallbacks on SEO or `headingBlock` are forbidden in general.** A new case
   is surfaced to the human, not resolved by whoever meets it.

## Consequences

**`resolveSeo` collapses.** With no content tier and no settings tier, it
becomes close to a pass-through over authored values plus image-URL building.
Its `content` and `settings` parameters largely disappear, and every caller's
signature changes.

**`TSeoResolved` gains optional fields.** `description`, `ogTitle`,
`ogDescription` and `ogImageUrl` become `TMaybeUndefined<string>`;
`apps/web`'s `toMetadata` must omit each tag rather than emit an empty one.
`title` stays required, since rule 2 guarantees it.

**`headingBlock` fallbacks go.** The topic and tag pages currently resolve
`heading: headingBlock.heading ?? topic.title`. That is banned, so
`headingBlock.heading` becomes required on those pages — which in turn changes
the shape of their hero-or-heading document rule, since the referenced
entity's title is what satisfies it today.

**A backfill migration is mandatory and must land first.** Making `metaTitle`
required renders every existing document unpublishable until filled. This repo
already has a standing rule against adding `required()` to a field of an
existing type for exactly this reason. The migration has to author a
`metaTitle` of at least 60 characters for every existing page document, which
is not mechanical — a generated string that merely clears the length gate is
worse than no rule at all.

**Scope is repo-wide**, not the pages currently in flight: `page_home`,
`page_landing`, `page_blog`, `page_topic`, `page_tag`, `page_post`,
`page_topicIndex` and `page_tagIndex` all resolve SEO through the same
transformer.

## Relationship to the open work

PRs #3019 / #3020 / #3021 (issues #2977 / #2978 / #2979) removed the document
`title` from the blog index page, satisfying rule 1 there — but did it by
introducing `headingBlock.heading ?? settings.brand.name`, which rule 5 bans.
That fallback is superseded by this design rather than by a further fix to
those PRs.

Issue #3022 covers the same rule-1 violation on the landing and home pages.

## Open

- Whether `metaDescription`, being optional with no fallback, should warn at
  publish time when empty rather than silently shipping a page with no
  description.
- What the backfill migration authors for each existing document, given the
  60-character minimum.

## Work folded in from the page-refactor PRs

Two commits were written on `refactor/2977-blog-list-heading-block` and merged
down the stack, then deliberately **not pushed** — PRs #3019 / #3020 / #3021
merged without them, and their content belongs to this design instead. They
exist locally only; treat the descriptions below as the specification, not the
commits.

**1. Blog index SEO title derived from page content.** Replaced
`{ title: rawPage.title }` — the document label — with
`{ title: headingBlock.heading ?? settings.brand.name }`, and deleted the
now-unread `title` projection from `blogPageQuery`.

Superseded in direction: rule 1 (no document label) stands, but the
brand-name fallback it introduced is banned by rule 5. Under this design the
blog index page authors its own `metaTitle` like every other page, and the
projection stays deleted.

**Therefore the merged PRs still pass the document `title` into `resolveSeo`
on the blog index page.** That is a known, accepted gap for the interval
between those merges and this epic — not an oversight to re-report.

**2. Blank `headingBlock` text treated as absent.** `toHeadingBlock` normalised
an empty or whitespace-only `heading`/`supportingText` to `undefined`, via a
`presence()` helper testing `value?.trim()`. It returns real content
unchanged — the trim decides presence only, it never reformats the value.

This one is a straight bug fix and survives intact. Without it `''` and
`'   '` both pass a `??` fallback untouched and then fail the truthiness check
in `PageIntro`, so the page renders **no `<h1>` at all**. It matters more under
this design, not less: with fallbacks removed, a blank authored heading has
nothing behind it, so the normaliser is what turns "editor cleared the field"
into a validation failure rather than a silently headless page.

**Therefore the merged PRs still contain that bug** on every page reading
`headingBlock`.

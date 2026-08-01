# Surfaces & routing conventions

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §1. The surfaces table and current-status summary
> stay in `SPEC.md` itself; this file holds the routing/layout decisions and
> their history.

**Routing conventions** (decided 2026-07-14 — full rationale in
`docs/archive/superpowers/specs/2026-07-14-blog-list-pagination-design.md`):

- **One route-builder** — `routes` in `@blog/config` is the single source of
  URL truth (`routes.post(slug)`, `routes.blogIndex(page?)`, …). No inline
  path templates in `service` or `web`; the sitemap and JSON-LD consume it too.
- **Pagination** — path-based, `/x/page/N` (static `page/` segment; singular).
  Page 1 lives only at the base URL; `/x/page/1` → `permanentRedirect` (308).
  Every page self-canonicalizes (never canonical-to-page-1); no
  `rel=next/prev`; non-canonical or out-of-range page params → hard 404.
- **Slug-space safety** — Next resolves static › dynamic › catch-all, so
  section segments (`blog`, `category`, `tag`, `author`) always beat the root
  generic `/[slug]`; `RESERVED_SLUGS` (#328) stops editors creating pages those
  segments would shadow. No catch-all routes for fixed-shape paths. `tag` is in
  `RESERVED_SLUGS` (#674) so `/tag/[slug]` can never be shadowed by a generic
  page slugged `tag`; `topics` is in `RESERVED_SLUGS` (#752) so `/topics` can
  never be shadowed by a generic page slugged `topics`.
- **Tag axis** (#674) — `/tag/[slug]` (+ `/page/N`) mirrors the category
  route's pagination/canonical/404 rules exactly (`routes.tag(slug, page?)`).
  Post detail (`/blog/[slug]`) renders the post's tags as `Article.Footer`
  chips linking to `routes.tag`, plus a shared-tag-ranked "Related reading"
  section (up to 3, category-fallback when fewer than 3 share a tag) — the
  heading stays category-neutral since the tag-based match isn't
  category-scoped. Every tag also gets its own RSS feed at
  `/tag/[slug]/rss.xml`, and every tag archive URL is listed in the sitemap.
- **Post-detail layout (#902):** `/blog/[slug]`'s `<main>` splits into
  per-region widths instead of one uniform clamp — the hero region
  (`Article.Header`) spans `max-w-page` (1120px) overall. Within it, the
  category eyebrow, capped h1 title, lead paragraph, and metadata strip all
  sit in a narrower, centered heading column (`max-w-[800px]`); the cover
  image renders below that column, back at the full 1120px width (#942).
  The article body is capped at `max-w-measure` (68ch,
  tightened from the earlier `max-w-post`/760px for reading comfort — #932)
  — unless the post qualifies for the "Topics" contents rail (≥3 H2
  headings, #934), in which case the body widens to `max-w-page` and splits
  into a two-column grid: a sticky rail (desktop `≥1024px`) or a compact
  selector (below `1024px`) alongside the still-`max-w-measure`-capped
  reading column. The `max-w-measure` cap lives on each grid child
  (`content`, `rail`, `footerInRail`), not on `body` — nesting it on both double-shrank
  the reading column below `lg:` (to ~536px); capping per-child keeps it a
  consistent 68ch (~616px) at every width (#995). The rail is labelled
  **Topics**: at `≥1024px` a full vertical topic list with active-topic
  highlighting; below that, a "TOPICS" label (stacked above on mobile,
  inline-left on tablet) plus a bordered selector showing the current
  active topic (defaults to the first heading, tracks scroll) that opens
  the full list to jump (#995). With the rail present, `Article.Footer` (the tag chips)
  renders _inside_ that grid as a second row under the reading column —
  capped to `max-w-measure` and left-aligned with the body, so its top rule
  spans only the reading column rather than the full grid width — and the
  sticky rail spans both grid rows so it descends to sit beside the footer
  instead of stopping at the end of the body (#996, superseding #987's
  full-width-footer approach).
- **Choose-your-depth reading (#957, additive-only — no migration):** every
  post renders at three reader-selectable depths — `SKIM` (a 3–7 item
  takeaways panel with a "read the full article" affordance), `READ` (the
  article exactly as written, the default), `DEEP` (the `READ` body plus its
  authored `aside` blocks expanded in place, kind-labelled "Why not X" /
  "Digression" / "Context") — via a `SegmentedControl` near the title. All
  three depths ship in the same static HTML; switching is a pure CSS
  show/hide keyed off a `data-depth` attribute (`DepthProvider`, a client
  context wrapping the reading area, mirrors the theme toggle's no-flash
  pre-hydration script + `localStorage` persistence, key `reading-depth`).
  ISR, canonical URL, and SEO are unaffected — crawlers see the standard
  `READ` article; no duplicate-content risk. Graceful degradation: no
  approved `skim` → no `30s` option; no `aside` blocks (`hasAsides`) → no
  `Deep` option; a post with neither renders the control hidden entirely
  (today's default post shape, unchanged). A publish-time pipeline
  (`POST /api/generate-skim`, secret-verified — see
  [`rendering-caching-i18n.md`](./rendering-caching-i18n.md)) drafts the `skim`
  field for human approval; publishing the post **is** the approval step.
- The "Related reading" section is separated from the article by a
  `max-w-page`-width top rule (`--border-emphasis`), not a background
  fill — the page canvas itself (including the hero) is `--bg-subtle`
  (#950/#951), so a same-color fill would no longer read as distinct.
- **Page canvas elevation (#950/#951, #973):** the content canvas renders on
  `--bg-subtle`, one step darker than the site chrome (`Header`,
  `BreadcrumbBar`, both `--bg`) — three visible elevation layers: chrome
  `--bg` · canvas `--bg-subtle` · cards/cover media `--surface` (pops off
  the canvas). The tint is applied **once** on the locale layout's content
  wrapper (the region between `<Header>` and `<Footer>`, #973) — individual
  page/template roots under `[locale]/` set no background of their own and
  inherit it (home, blog index, post detail, topics, generic pages). The one
  exception is the root `not-found.tsx`, which renders _outside_ the
  `[locale]` layout (Next's not-found boundary), so it can't inherit that
  wrapper — its own template keeps `--bg-subtle` on its root to stay visually
  consistent with the rest of the site. The footer sits flush below the
  canvas on its own `--accent-muted` band.

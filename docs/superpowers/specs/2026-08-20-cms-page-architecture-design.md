# CMS page architecture — every public page is a composable document

**Status:** design approved, not yet implemented
**Supersedes:** epic #1332 and its sub-issues #1333–#1336

## Problem

The public site has eight page kinds. Only three have a CMS document behind
them, and the site runs **two unrelated post-rendering systems** that never
meet:

1. **`module_postList`** — editor-placeable, latest-N, `limit` 1–12, never
   paginated, always globally scoped.
2. **The archive grid** — hardcoded inside `BlogListPage`/`CategoryPage`/
   `TagPage`/`AuthorPage`, always paginated, always correctly scoped, with no
   editor control over position, heading, or styling.

Current state **as of this design, before E1** — E1 has since shipped, so
`blog_category`/`CategoryPage`/`/category/*` below now read `topic`,
`TopicPage` and `/topics/*`. Left in the original vocabulary because it
records the starting point the design argued from.

| Route                           | CMS document         | Post grid                            | Page size                       |
| ------------------------------- | -------------------- | ------------------------------------ | ------------------------------- |
| `/`                             | `page_home`          | `module_postList`, latest-N          | `limit` on module               |
| `/blog`, `/blog/page/N`         | `page_blog`          | hardcoded, paginated                 | `itemsPerPage` field            |
| `/{slug}`                       | `page_generic`       | none — `module_postList` not allowed | —                               |
| `/category/[slug]` (+`/page/N`) | none                 | hardcoded, paginated                 | `CATEGORY_ITEMS_PER_PAGE` const |
| `/tag/[slug]` (+`/page/N`)      | none                 | hardcoded, paginated                 | `TAG_ITEMS_PER_PAGE` const      |
| `/author/[slug]` (+`/page/N`)   | none                 | hardcoded, paginated                 | `AUTHOR_ITEMS_PER_PAGE` const   |
| `/topics`                       | none                 | category cards; copy from i18n keys  | —                               |
| `/blog/[slug]`                  | none (post document) | —                                    | —                               |

Three further symptoms of the same gap:

- Category/tag/author page size is a **web-layer constant**, not content. The
  source comments flag this directly: "no CMS-authored page-size field like
  `page_blog.itemsPerPage`".
- `/topics` is **orphaned** — the only three references in the codebase are its
  own breadcrumb, its own metadata builder, and one sitemap entry. Nothing
  links to it.
- `/topics` is functionally the category index, yet its children live at
  `/category/{slug}` — a different word _and_ not nested under the parent, so
  no breadcrumb trail can express the real hierarchy.

Epic #1332 addressed only system 1's scoping. It explicitly left the archive
grid untouched, so even after it shipped a category page would still have a
hardcoded grid plus a second, editor-added latest-N list below it.

## Approach

Every public page becomes a CMS document, and the two post-rendering systems
become two module types — a paginated archive and a latest-N teaser — each
admitted by its own kind of slot.

### Page document family

`page_home`'s required-`hero` shape is the template for all of them.

| Document          | Kind       | Required slot            | Also                 | Route                        |
| ----------------- | ---------- | ------------------------ | -------------------- | ---------------------------- |
| `page_home`       | singleton  | `hero`                   | `modules[]`          | `/`                          |
| `page_blog`       | singleton  | `postList`               | `modules[]`          | `/blog`, `/blog/page/N`      |
| `page_topicIndex` | singleton  | `taxonomyList`           | `modules[]`          | `/topics`                    |
| `page_topic`      | per-entity | `postList` + `topic` ref | `modules[]`          | `/topics/{slug}`, `…/page/N` |
| `page_tagIndex`   | singleton  | `taxonomyList`           | `modules[]`          | `/tags`                      |
| `page_tag`        | per-entity | `postList` + `tag` ref   | `modules[]`          | `/tags/{slug}`, `…/page/N`   |
| `page_generic`    | per-entity | —                        | `slug` + `modules[]` | `/{slug}`                    |

Per-entity pages take their URL slug from the **referenced taxonomy document**,
never from a slug field of their own — one source of truth, no way for the two
to drift.

Every "required slot" above is a **reference to a standalone `module_*`
document**, exactly as `page_home.hero` already references a `module_hero`.
Modules remain their own documents; only the way a page points at them changes.

### Two post-list modules, one per mode

The two legacy systems differ on exactly two axes: **scope** (which posts) and
**window** (how many). Rather than one module carrying a mode, there are two
module types, and each slot admits only one of them:

- **`module_postList`** — the paginated archive. Occupies a page's required
  `postList` field. Carries `pageSize` and the empty-state message; the route
  supplies the page number.
- **`module_postLatest`** — the latest-N teaser. An item inside `modules[]`.
  Carries `limit`. Never paginates, and needs no empty-state message: a teaser
  with nothing to show renders nothing.

Pagination is inherently a route concern — `/topics/foo/page/3` is owned by the
URL — so only the module in the required field can paginate, and because that
is a **field** rather than an array item, having two is structurally impossible
and no validation rule is needed.

Two named types rather than one ambiguous one is also what makes the choice
visible to the editor. Under a single `module_postList` whose mode followed
from its slot, the same "Post List" behaved as a teaser in the home page's
`modules[]` and as a paginated archive in a required slot, with nothing in the
Studio indicating which — and each placement carried the other's irrelevant
fields.

**Scope resolves from the parent page document, not from a runtime prop.**
`page_topic` holds a `topic` reference alongside its slot, so the GROQ
projection reads the scope from the page the module belongs to. `page_blog` and
`page_home` hold no such reference, so their lists are global. This applies to
both modules: a `module_postLatest` in `page_topic.modules[]` still scopes to
that topic. Scope is therefore a data relationship in Sanity rather than
something threaded down through the renderer.

`module_postLatest` is not permitted in `page_generic.modules[]`, and
`page_generic` has no required `postList` field for an archive to occupy — so
neither post-list module can appear on a generic page. A generic page is site
furniture, not a blog surface. Same boundary that dropped E10.

`module_taxonomyList` keeps slot inference: whether it lists topics or tags
follows from which index page's slot it occupies. It has one mode, so no
equivalent split applies.

### Vocabulary and URL alignment

`category` became `topic` end to end — `blog_category` → `blog_topic`, the
`category` reference on `blog_post` → `topic`, and `/category/{slug}` →
`/topics/{slug}`. Tags follow the same nesting: `/tags` index with
`/tags/{slug}` children, and the feed moves to `/tags/{slug}/rss.xml`.

**Shipped in #1812 / PR #1837** — 215 files across seven workspaces. Three
claims in the original estimate proved wrong and are corrected here so later
epics are not planned against them:

- **`packages/ui` was not fixture-only.** It exported three `category` props —
  `PostCardFooter.category`, `ArticleHeader.category` (plus
  `IArticleHeaderCategory`), and `PostsSection`'s `IPostCardCategoryData` /
  `IPostCardData.category`. All were renamed to `topic`; `COMPONENTS.md`
  regenerated.
- **A third vocabulary existed beyond the `_type` and the identifiers:** the
  ISR cache-tag strings passed to `isr([...])`, across 13 service loaders and
  mirrored in `apps/web`'s `REVALIDATE_TAGS`. Nothing type-checks those two
  sides against each other, so a partial rename would have silently stopped
  revalidation. Renamed to `'topic'` / `'topics'` on both sides together.
- **Raw GROQ escapes the compiler.** A `filterRaw('category._ref == …')` in
  related-posts type-checked fine and would have failed at runtime.

No Postgres involvement — "category" was not a stored value, a `pgEnum`, or a
column anywhere in `@blog/db`, so no DB migration was needed. `@blog/db` was
touched in one place: `scripts/provision-tenant/steps/starter-content.ts`.

Two stored, category-named values were deliberately left behind and are tracked
in #1835: the `categoryEmpty` voice override (stored in both Sanity and a
Postgres JSONB column) and `HERO_FIELD_MODE.POST_CATEGORY` (stored in
`module_hero` documents). Both need content migrations of their own.

Because a `_type` rename reds `type-check` until every layer lands, the rename
**cannot** be split into per-layer PRs. It ships as one PR.

### Author pages are removed

Author archives (`/author/[slug]`, `/author/[slug]/page/[page]`) are deleted
rather than converted. `blog_author` instead gains an optional reference to a
`page_generic` document, so an author's profile is an ordinary page ("About").
Bylines link there when set, and render as plain text when not.

This is low-risk — verified against the code, not assumed:

- `PostMeta`'s author `href` is **already optional**, so dropping the link
  breaks no type contract.
- JSON-LD emits `BlogPosting.author` as **name only, with no URL**, so there is
  no structured-data regression.
- RSS carries no author field at all.

Deletion surface: 2 route files, `AuthorPage`, the author metadata builder, the
author items-per-page util, `packages/service/src/features/pages/author/`, the
sitemap entries, `routes.author()`, and ~5 test files.

#### The `blog_author` schema changes too

`slug` exists solely to address the archive route, so it goes with it. This is
**not** a no-op field deletion — it is currently `required()` in the schema and
projected as `.notNull()` by **both** author fragments
(`packages/service/src/shared/fragments/author.ts`), which back every post card
and the post detail page. Removing it therefore touches:

- `apps/cms` — drop the field; retarget the `name`/`image`/`bio`/`socialLinks`
  descriptions, which all still say "author page".
- `packages/service` — drop `slug` from `authorCardFragment` and
  `authorDetailFragment`, and from the view-model types.
- `apps/web` — `blog-post-page.tsx:189` builds `author.href` from
  `routes.author(author.slug)`; it reads the `profilePage` reference instead.
- The migration — removing a field from live documents. Additive-only rules do
  not apply here.

In its place `blog_author` gains an **optional `profilePage` reference to
`page_generic`**. The fragments project the referenced page's slug so
`apps/web` can build `routes.genericPage(slug)`; when the reference is unset
the byline renders as plain text, which `PostMeta` already supports.

The reference is restricted to `page_generic` **only** — `to: [{ type:
'page_generic' }]`, so the Studio picker offers nothing else. This is
load-bearing rather than incidental: the page-document family grows from three
types to seven in this design, and an unrestricted picker would offer
`page_home`, `page_blog`, `page_topic`, `page_tag` and the two index
singletons, none of which can serve as an author profile. No `options.filter`
is needed — the `to` restriction alone gives the behaviour.

Ordering within E9: land the `profilePage` reference first, then remove `slug`,
so no intermediate commit leaves the byline unable to link.

### What else retires

The hardcoded archive grids in `BlogListPage`/`TopicPage`/`TagPage` collapse
into `module_postList`. `page_blog.itemsPerPage` and the three
`*_ITEMS_PER_PAGE` web constants retire in favour of **`pageSize`** on
`module_postList`, ranged **1–24** so the blog index keeps the page size
`itemsPerPage` already permitted.

`module_postLatest` keeps `limit` at its original 1–12 — a teaser never needs a
full page's worth. E2 widened `limit` to 1–24 on the then-single module; that
widening moves to the archive's `pageSize`, and the teaser reverts to 1–12.
Because every archive document is created fresh by the E4/E6/E8 seeding
migrations, `pageSize` can be defined as a new field with no legacy documents
to migrate.

`MODULE_PAGE_CONTEXT`'s `isPaginated` half retires with this split. The page-kind
half survives for `module_content`/`module_cta`, which still care which page
kind they render on — that is all the contract ever claimed to be for.

### Missing page documents 404

A taxonomy entry with no page document has no archive — the route 404s. The
page document is the source of truth, and no runtime fallback path exists.

Two compensating guards:

- A **Studio validation warning** on the taxonomy document when nothing
  references it, so the editor sees the problem where they would fix it.
- A **Studio validation rule** rejecting a second page document that references
  an already-covered taxonomy entry, so `/topics/{slug}` can never be
  ambiguous.

Accepted trade-off: every new tag needs its page document created, or its
archive 404s. This was chosen with the cost visible (see Migration).

## New components

- **`module_postLatest`** — a new module document for the latest-N teaser,
  carrying `limit`. Splits out of today's `module_postList`, which becomes the
  paginated archive.
- **`module_taxonomyList`** — a new module document listing taxonomy entries as
  cards. Source inferred by slot.
- **A taxonomy card + card grid in `@blog/ui`** — `/topics` currently hand-rolls
  its own list markup because `BlogPageTemplate`'s `posts` slot is built for
  post grids. Check `packages/ui/COMPONENTS.md` for something extendable before
  adding new components.

## Migration

Production holds live content, so this is **not** a clean-dataset change. The
July 2026 "clean datasets" assumption is stale — there is a
`20260724T1248-categories-to-single-category` migration precisely because
content existed by then.

Production contents: 12 `blog_post`, 15 `blog_tag`, 1 `blog_category`,
1 `blog_author`, `page_home` + `page_blog`, 1 `module_hero`,
1 `module_postList`, 4 settings singletons, 15 image assets.

Scripted `sanity/migrate` transforms, following the repo's standard workflow —
`migrate:dry` → `dataset:export` backup → **human-gated** `migrate:run`, dev
dataset first:

1. **Create `blog_topic` from `blog_category`, and repoint posts.** A
   document's `_type` is **immutable in Sanity** — it cannot be patched, and
   Sanity's own docs state there is no straightforward way to change it with
   the migration tooling. So this is not a retype: the migration
   `createIfNotExists` a `blog_topic` document carrying the category's
   `title`/`slug`/`description` under a deterministic new id, then patches
   each post's reference onto it while unsetting the old `category` field
   (which also covers renaming that field to `topic`).
2. **Delete the legacy `blog_category` documents** — a _separate_ migration,
   run only after step 1 has completed against the same dataset. A document
   with incoming strong references cannot be deleted, so running the two in
   one pass would race the repointing.
3. **Seed `page_blog`'s archive module.** Create a `module_postList`
   carrying the `pageSize` that `page_blog.itemsPerPage` currently holds, then
   patch `page_blog.postList` to reference it — before that field is flipped to
   required, per the ordering trap below.
4. **Retype the one existing `module_postList` to `module_postLatest`.** That
   single production document is a latest-N teaser on `page_home`, and under
   the split `module_postList` means the paginated archive. `_type` is
   immutable, so this is the same create → repoint → delete shape as step 1:
   `createIfNotExists` a `module_postLatest` under a deterministic id carrying
   the existing `limit` and section header, repoint `page_home.modules[]` at
   it, then delete the original in a _separate_ follow-up migration once the
   reference has moved.
5. Create `page_topic` ×1 and `page_tag` ×15, each with its own
   `module_postList`, plus the `page_topicIndex` and `page_tagIndex`
   singletons with their `module_taxonomyList`.

Steps 1–2 belong to E1 and steps 3–4 to E4. Step 5 splits four ways: the
`page_topic` seeding to E6 and `page_tag` to E8, with the `page_topicIndex`
and `page_tagIndex` singletons and their `module_taxonomyList` belonging to
the index-page epics that introduce them, E5 and E7.

**Deploy ordering:** run steps 1–2 against `production` _before_ deploying the
web code that reads `topic`, so no window exists where live documents have
neither shape populated for the code currently reading them.

Step 5 is **36 new documents** to preserve behaviour that is automatic today —
`page_tag` ×15 with their modules is 30 of them, plus `page_topic` and its
module, and the two index singletons with their `module_taxonomyList`. That
cost was weighed explicitly against auto-creating page documents via a Sanity
document action, and the seeded-migration route was chosen.

`packages/db`'s `starter-content.ts` provisions new tenants with
`blog_category` fixtures — it needs the same rename and the same page-document
seeding, or every newly provisioned tenant ships broken archives.

## Old URLs are not redirected

`/category/{slug}`, `/tag/{slug}`, `/tag/{slug}/rss.xml` and `/author/{slug}`
all simply **404** after their epics land. No redirect table, and no
`redirects()` block is added to `apps/web/next.config.ts` (which today has a
`headers()` block and no redirects).

This is a deliberate call, not an omission. Exposure is minimal: `noindex`
applies outside production (SPEC §10) and `robots.ts` advertises the sitemap
only in production, so only the production deployment was ever indexable, and
it is a personal test blog with 12 posts. The cost of being wrong is broken
inbound links, not lost ranking.

**Not to be confused with pagination canonicalisation.** The existing
`/{path}/page/1` → `/{path}` 308 redirects are a different mechanism, internal
to each archive route, and they **stay** — every new paginated page epic
carries one, matching what `/blog/page/[page]` and the category/tag routes do
today.

### `RESERVED_SLUGS` must be updated

`@blog/config`'s `RESERVED_SLUGS` guards `page_generic` slugs against colliding
with real routes. It is currently
`blog, category, tag, author, api, page, topics`.

- **Add `tags`** — the new index route. This is a config sub-issue of E7.
- **`category`, `tag` and `author` may all be released** once their routes are
  gone, since nothing occupies those paths and no redirect replaces them.
  Keeping them costs nothing and stops an editor publishing a confusingly
  named page at `/category`; releasing them is equally defensible. Either way
  it is a judgement call for the epic that removes the route, not a
  correctness issue.

## Out of scope

- Adding the new index pages to site navigation. Navigation is CMS-authored
  (`settings_navigation`); this is an editorial decision, made in Studio.
- An author index route (`/authors`). Author archives are being removed, not
  relocated.
- An editor-facing "source" or "mode" field on a post-list module. Two module
  types replace it — the type _is_ the mode.

## Decisions taken, with their rejected alternatives

| Decision                                                  | Rejected alternative                                                                                      | Why                                                                                                                                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Post list is a required slot                              | An item inside `modules[]` with a max-one validation rule                                                 | The field makes duplicates structurally impossible and a page can never render empty — no seeding fallback, no validation rule                                                                                   |
| Two module types, `module_postList` + `module_postLatest` | One module with the mode inferred by slot; or an explicit editor mode field                               | The type is the mode: impossible combinations become unrepresentable in the Studio and in TypeScript, each type carries only its own fields, and the editor picks by intent rather than by where they dropped it |
| Per-entity page documents referencing the taxonomy        | A per-kind singleton configuring all archives; or `modules[]` on the taxonomy document (#1332's approach) | Each entry gets its own composable page; the taxonomy document stays pure taxonomy rather than becoming page-shaped                                                                                              |
| Rename to `topic` everywhere                              | URL-only rename keeping `blog_category`                                                                   | A lasting vocabulary mismatch between Studio and URLs is worse than one non-splittable PR                                                                                                                        |
| Author pages removed                                      | Converting them to `page_author` documents                                                                | An author profile is an ordinary page; the byline link is already optional and JSON-LD emits no author URL                                                                                                       |
| 404 on missing page document                              | Runtime fallback to a default archive                                                                     | Keeps a single code path; guarded by two Studio validation rules                                                                                                                                                 |
| `pageSize` widened to 1–24                                | Keeping the teaser's 1–12 for both                                                                        | 12 would silently cap the blog index below the 24 `itemsPerPage` already allowed                                                                                                                                 |

## Delivery — one epic per page surface

Ten epics, each a parent issue with **one sub-issue per layer** and **one PR
per layer**, in the usual `config → cms → service → ui → web` order. No epic
reviews more than one page surface, and no PR spans more than one package
except where a hard type-level coupling makes splitting impossible — the three
such cases are named explicitly below.

Every epic must merge to `main` green on its own.

### Where splitting is impossible, and why

Two verified constraints. Both are type-level, not stylistic — the split
genuinely does not compile.

1. **A `_type` rename** reds `type-check` in every downstream package until all
   of them land. Epic 1 is therefore a single PR.
2. **Introducing any new `module_*` type** reds `apps/web`. `MODULE_MAP` is
   typed `Record<Exclude<TModuleType, 'module_hero'>, …>` and is deliberately
   exhaustive — its own doc comment states that "adding a module type without
   registering it here is a compile error". The moment the cms schema lands and
   typegen widens `TModuleType`, `apps/web` stops compiling. So the cms schema
   PR and the `apps/web` registration PR for a new module must land **together**
   (epic 5). Note that `module_taxonomyList` follows the `module_hero`
   precedent — rendered via a dedicated slot, never through `ModuleRenderer` —
   so its registration is an addition to that `Exclude`, not a new `MODULE_MAP`
   entry. Either way the same PR must carry it.

   The split moves `module_postList` the **other** way. It is a live
   `MODULE_MAP` key today because pre-split it could sit in `modules[]`; once
   it only ever occupies the required `postList` field it follows the
   `module_hero` precedent and must be **removed** from `MODULE_MAP` and added
   to that `Exclude`. Its replacement in `modules[]`, `module_postLatest`, is
   the new `MODULE_MAP` entry. Both edits land in the same PR as the schema.

A third, softer one: **a field cannot be made required before the migration
that populates it**, or the existing singleton shows as invalid in Studio.
Where an epic makes a slot required on a document that already exists, the
ordering within it is: add the field optional → run the seeding migration →
flip it to required.

### Foundation epics

**E1 — rename `category` to `topic`.** `blog_category` → `blog_topic`, the post
field, `/category/{slug}` → `/topics/{slug}`, and the rename migration. Old
`/category/*` URLs 404 — no redirects. Touches config, cms, service, web, db fixtures, ui story fixtures.
**Single PR** (constraint 1). Behaviour-neutral — no page documents yet,
archives still render from the existing hardcoded grids. First, so every later
epic is written in the final vocabulary.

**E2 — post-list module gains its paginated mode.** The slot mechanic itself,
dormant until a page uses it. Sub-issues: config (page-context contract, as
#1333 specified) → cms (`limit` widened to 1–24) → service
(`getPostList(id, context?)` scoping plus a total for pagination) → ui
(`PostsSection` pagination props, if #1807 has not already covered it) → web
(`PostListModule` renders paginated when given pagination context). Fully
splittable; every PR additive.

**Shipped as a single module with a mode.** The two-module split was decided
after E2 landed, so E4 carries the refactor: E2's paginated query, `total`, and
pager wiring all survive and move onto `module_postList`, while the page-context
plumbing it added (`isPaginated`, the pagination-href helper's unreachable
branches, the page-type label map) is deleted there.

**E3 — `module_taxonomyList` and the taxonomy card UI.** New module document
plus the `@blog/ui` card and grid that `/topics` currently hand-rolls. Check
`packages/ui/COMPONENTS.md` for something extendable first. Sub-issues: cms +
web **combined** (constraint 2) → service (taxonomy entries with post counts) →
ui (card, grid, stories). Ships before the two index-page epics that consume it.

### Page epics

**E4 — `/blog` moves to the required slot, and the post-list module splits in
two.** `page_blog` gains its required `postList` reference; `BlogListPage`'s
hardcoded grid is removed; `itemsPerPage` retires.

E4 also carries the `module_postList` / `module_postLatest` split, because it
is the first epic where both modes coexist and the one that breaks without it:
under the pre-split contract the same `BLOG` page context would have to mean
both "unpaginated `modules[]` teaser" and "paginated required slot" on the same
page. Scope moves to resolving from the parent page document, and
`MODULE_PAGE_CONTEXT` loses its `isPaginated` half.

Sub-issues: cms + web **combined** for `module_postLatest` (constraint 2 — a
new `module_*` type reds `apps/web` until `MODULE_MAP` registers it) → service
→ web, plus two migrations: seeding `page_blog`'s archive module, and the
step-4 teaser retype above. Subject to the required-field ordering rule above.
Proves the design on the one page that already has a document.

**E5 — `/topics` index page.** `page_topicIndex` singleton with its required
`taxonomyList` slot; replaces the hardcoded `TopicsPage` and moves its heading
and intro copy out of i18n keys into content. Sub-issues: cms → service → web,
plus the migration seeding the singleton and its `module_taxonomyList`
(migration step 5 above).

**E6 — `/topics/{slug}` page.** `page_topic` with its required `postList` slot
and `topic` reference; retires `CATEGORY_ITEMS_PER_PAGE` and the hardcoded
category grid; adds both Studio validation rules (uniqueness of the reference,
and the missing-page warning on the taxonomy document). Sub-issues: cms →
service → web, plus the seeding migration for the 1 existing topic.

**E7 — `/tags` index page.** `page_tagIndex` singleton, mirroring E5. New route
— nothing exists today. Sub-issues: cms → service → web, plus the same
singleton-seeding migration as E5.

**E8 — `/tags/{slug}` page.** `page_tag`, the `/tag/` → `/tags/` URL move, the
`/tags/{slug}/rss.xml` feed move, and the seeding migration for
**15 tags** (30 documents, per Migration above). Retires `TAG_ITEMS_PER_PAGE`
and the hardcoded tag grid. Sub-issues: config (routes helper) → cms → service
→ web. The largest page epic, because of the seeding.

**E9 — remove `/author/{slug}`.** Delete **both** author route files,
`AuthorPage`, the metadata builder,
`packages/service/src/features/pages/author/`, `routes.author()`,
`AUTHOR_ITEMS_PER_PAGE`, and the sitemap entries — those paths 404, with no
redirect. Add `blog_author`'s optional `profilePage` reference and point
bylines at it; then remove the now-dead `slug` field from `blog_author` and
both author fragments (see "The `blog_author` schema changes too" above — this
reaches into every post card, so it is not a local deletion). Sub-issues:
config → cms → service → web, plus a migration that drops the field.
**Independent of E2–E8** — can run in parallel at any point after E1.

**E10 — dropped 2026-08-20, closed not-planned (#1832).** It would have added
`module_postList` to `page_generic`'s allowed `modules[]` types — pre-split
vocabulary, when one module served both modes; the equivalent proposal today
would concern `module_postLatest`. The maintainer
rejected the premise: a generic page ("About", "Start here") is site furniture,
not a blog surface, so a post list does not belong on it. This spec originally
called the existing restriction "a restriction with no real justification",
framing it as an implementation accident; it is a deliberate content-model
boundary. `page_generic` already permits only `module_content` and
`module_cta`, so nothing needs undoing.

`GENERIC` remains in `MODULE_PAGE_CONTEXT` — generic pages still render their
content and CTA modules through `ModuleRenderer`, so the page kind is still
meaningful context. Only the _post-list_ module will never receive it.

### Order

`E1 → E2 → E3 → E4 → (E5, E6) → (E7, E8)`, with **E9 parallel** any time
after E1. (E10 was dropped; it was a leaf, so nothing re-orders.) E5/E6 and E7/E8 are each an index-and-children pair and are best
reviewed together in sequence, though either merges green alone.

`@blog/db`'s `starter-content.ts` is a sibling sub-issue in every epic that
changes Sanity fixtures — E1, E6, and E8.

## Board actions

- Close #1333–#1336 and epic #1332 as superseded by this design. Its
  page-context contract shipped as E2's first sub-issue and survives in reduced
  form — the page-kind half still tells `module_content`/`module_cta` which page
  they render on — but it does **not** scope post lists: that resolves from the
  parent page document, and the contract's `isPaginated` half retires with the
  two-module split. #1332's own premise (`modules[]` on the taxonomy documents,
  grid untouched) does not survive either.
- Create ten board entries for E1–E10 above (E10 has since been dropped). Gather every sub-issue's title,
  body and labels up front and dispatch `board-keeper` once per epic with the
  whole set, rather than issue by issue. Label each sub-issue with its
  `layer:*` label.
- **E1 is a flat issue, not an epic.** The per-layer-sub-issue convention
  exists to mirror per-layer PRs, and E1 deliberately has none — six
  sub-issues for one PR that can only close one of them would be noise. Its
  body carries the per-layer checklist instead.
- **Sub-issues are created just-in-time.** All ten epics exist on the board
  immediately so the programme's shape and order are visible, but only the
  unblocked ones (E2–E4) carry layer sub-issues at first. E5–E9 get theirs
  when their turn comes, written against what E2–E4 actually shipped rather
  than against a design those epics will refine.
- `SPEC.md` §6 (content model) and `docs/context/surfaces-and-routing.md`,
  `content-model.md`, `data-flow.md`, `seo-accessibility.md` all need syncing as
  each epic lands.

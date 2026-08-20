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

Current state:

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
collapse into one module whose behaviour is determined by **which slot holds
it**.

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

### Mode inferred by slot

A `module_postList` renders differently according to the slot it occupies. Not
a heuristic on page type, and not an editor-picked field:

- **In a page's required `postList` field** → paginated grid, scoped to that
  page's entity, page number supplied by the route.
- **Inside any `modules[]` array** → latest-N, scoped by page context.

This is what makes the required slot pay for itself. Pagination is inherently a
route concern — `/topics/foo/page/3` is owned by the URL — so a module can only
paginate if the route hands it the page number, and only one module per page
can be given it. Because the paginated list is a **field** rather than an array
item, having two is structurally impossible and no validation rule is needed.

The same rule governs `module_taxonomyList`: whether it lists topics or tags
follows from which index page's slot it occupies.

Page context (the contract #1333 specified) is retained for the `modules[]`
case, so a latest-N list on a topic page still scopes to that topic.

### Vocabulary and URL alignment

`category` becomes `topic` end to end — `blog_category` → `blog_topic`, the
`category` reference on `blog_post` → `topic`, and `/category/{slug}` →
`/topics/{slug}`. Tags follow the same nesting: `/tags` index with
`/tags/{slug}` children, and the feed moves to `/tags/{slug}/rss.xml`.

Rename surface: ~61 files across six workspaces, plus ~25 test/story files.
No Postgres involvement — "category" is not a stored value, a `pgEnum`, or a
column anywhere in `@blog/db`, so **no DB migration is needed**. `@blog/db` is
still touched in one place: `scripts/provision-tenant/steps/starter-content.ts`
seeds Sanity fixtures that name `blog_category`. `packages/ui` is untouched
except story fixture data; no UI component names "category"
(`PostCard.Footer`'s prop is already generic).

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

### What else retires

The hardcoded archive grids in `BlogListPage`/`CategoryPage`/`TagPage` collapse
into the single module. `page_blog.itemsPerPage` and the three
`*_ITEMS_PER_PAGE` web constants retire in favour of `limit` on the module,
whose range widens from 1–12 to **1–24** so the blog index keeps the page size
`itemsPerPage` already permitted.

`page_generic` gains `module_postList` in its allowed `modules[]` types; with
context scoping it resolves to global latest there, which is correct.

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

One scripted `sanity/migrate` transform, following the repo's standard
workflow — `migrate:dry` → `dataset:export` backup → **human-gated**
`migrate:run`, dev dataset first:

1. Retype the 1 `blog_category` document to `blog_topic`.
2. Rename the `category` field to `topic` on 12 `blog_post` documents (the
   `_ref` target is unchanged).
3. Create `page_topic` ×1 and `page_tag` ×15, each with its own
   `module_postList`, plus the `page_topicIndex` and `page_tagIndex`
   singletons with their `module_taxonomyList`.

Step 3 is **30 new documents** to preserve behaviour that is automatic today.
That cost was weighed explicitly against auto-creating page documents via a
Sanity document action, and the seeded-migration route was chosen.

`packages/db`'s `starter-content.ts` provisions new tenants with
`blog_category` fixtures — it needs the same rename and the same page-document
seeding, or every newly provisioned tenant ships broken archives.

## Redirects

Permanent (301) redirects, added regardless of whether the old URLs were ever
indexed — the table costs nothing to maintain and makes the question moot:

- `/category/{slug}` → `/topics/{slug}`
- `/category/{slug}/page/{n}` → `/topics/{slug}/page/{n}`
- `/tag/{slug}` → `/tags/{slug}`
- `/tag/{slug}/page/{n}` → `/tags/{slug}/page/{n}`
- `/tag/{slug}/rss.xml` → `/tags/{slug}/rss.xml`
- `/author/{slug}` → the author's referenced generic page, or `/blog` when unset

Note that `noindex` applies outside production (SPEC §10) and `robots.ts` only
advertises the sitemap in production, so only the production deployment was
ever indexable.

## Out of scope

- Adding the new index pages to site navigation. Navigation is CMS-authored
  (`settings_navigation`); this is an editorial decision, made in Studio.
- An author index route (`/authors`). Author archives are being removed, not
  relocated.
- An editor-facing "source" or "mode" field on `module_postList`. Inference by
  slot replaces it.

## Decisions taken, with their rejected alternatives

| Decision                                           | Rejected alternative                                                                                      | Why                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Post list is a required slot                       | An item inside `modules[]` with a max-one validation rule                                                 | The field makes duplicates structurally impossible and a page can never render empty — no seeding fallback, no validation rule  |
| Mode inferred by slot                              | Inferred from page type; or an explicit editor field                                                      | Slot inference is unambiguous; page-type inference needs a first-one-wins tie-break, and a field reintroduces wrong-choice risk |
| Per-entity page documents referencing the taxonomy | A per-kind singleton configuring all archives; or `modules[]` on the taxonomy document (#1332's approach) | Each entry gets its own composable page; the taxonomy document stays pure taxonomy rather than becoming page-shaped             |
| Rename to `topic` everywhere                       | URL-only rename keeping `blog_category`                                                                   | A lasting vocabulary mismatch between Studio and URLs is worse than one non-splittable PR                                       |
| Author pages removed                               | Converting them to `page_author` documents                                                                | An author profile is an ordinary page; the byline link is already optional and JSON-LD emits no author URL                      |
| 404 on missing page document                       | Runtime fallback to a default archive                                                                     | Keeps a single code path; guarded by two Studio validation rules                                                                |
| `limit` widened to 1–24                            | Keeping 1–12                                                                                              | 12 would silently cap the blog index below the 24 `itemsPerPage` already allowed                                                |

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

A third, softer one: **a field cannot be made required before the migration
that populates it**, or the existing singleton shows as invalid in Studio.
Where an epic makes a slot required on a document that already exists, the
ordering within it is: add the field optional → run the seeding migration →
flip it to required.

### Foundation epics

**E1 — rename `category` to `topic`.** `blog_category` → `blog_topic`, the post
field, `/category/{slug}` → `/topics/{slug}`, redirects, and the rename
migration. Touches config, cms, service, web, db fixtures, ui story fixtures.
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

**E3 — `module_taxonomyList` and the taxonomy card UI.** New module document
plus the `@blog/ui` card and grid that `/topics` currently hand-rolls. Check
`packages/ui/COMPONENTS.md` for something extendable first. Sub-issues: cms +
web **combined** (constraint 2) → service (taxonomy entries with post counts) →
ui (card, grid, stories). Ships before the two index-page epics that consume it.

### Page epics

**E4 — `/blog` moves to the required slot.** `page_blog` gains its required
`postList` reference; `BlogListPage`'s hardcoded grid is removed;
`itemsPerPage` retires. Sub-issues: cms → service → web, plus the migration
seeding `page_blog`'s module. Subject to the required-field ordering rule
above. Proves the design on the one page that already has a document.

**E5 — `/topics` index page.** `page_topicIndex` singleton with its required
`taxonomyList` slot; replaces the hardcoded `TopicsPage` and moves its heading
and intro copy out of i18n keys into content. Sub-issues: cms → service → web.

**E6 — `/topics/{slug}` page.** `page_topic` with its required `postList` slot
and `topic` reference; retires `CATEGORY_ITEMS_PER_PAGE` and the hardcoded
category grid; adds both Studio validation rules (uniqueness of the reference,
and the missing-page warning on the taxonomy document). Sub-issues: cms →
service → web, plus the seeding migration for the 1 existing topic.

**E7 — `/tags` index page.** `page_tagIndex` singleton, mirroring E5. New route
— nothing exists today. Sub-issues: cms → service → web.

**E8 — `/tags/{slug}` page.** `page_tag`, the `/tag/` → `/tags/` URL move, the
`/tags/{slug}/rss.xml` feed move, redirects, and the seeding migration for
**15 tags** (30 documents, per Migration above). Retires `TAG_ITEMS_PER_PAGE`
and the hardcoded tag grid. Sub-issues: config (routes helper) → cms → service
→ web. The largest page epic, because of the seeding.

**E9 — remove `/author/{slug}`.** Delete the author routes, `AuthorPage`, the
metadata builder, `packages/service/src/features/pages/author/`,
`routes.author()`, `AUTHOR_ITEMS_PER_PAGE`, and the sitemap entries; add
`blog_author`'s optional `page_generic` reference and point bylines at it.
Sub-issues: config → cms → service → web. **Independent of E2–E8** — can run in
parallel at any point after E1.

**E10 — `/{slug}` generic pages may host a post list.** Adds `module_postList`
to `page_generic`'s allowed `modules[]` types. Sub-issues: cms → web. Smallest
epic; depends only on E2.

### Order

`E1 → E2 → E3 → E4 → (E5, E6) → (E7, E8) → E10`, with **E9 parallel** any time
after E1. E5/E6 and E7/E8 are each an index-and-children pair and are best
reviewed together in sequence, though either merges green alone.

`@blog/db`'s `starter-content.ts` is a sibling sub-issue in every epic that
changes Sanity fixtures — E1, E6, and E8.

## Board actions

- Close #1333–#1336 and epic #1332 as superseded by this design. Its page-context
  contract survives — it is what scopes a `modules[]` post list, and it is E2's
  first sub-issue — but its premise (`modules[]` on the taxonomy documents, grid
  untouched) does not.
- Create ten parent issues, E1–E10 above, each with one sub-issue per layer.
  Gather every sub-issue's title, body and labels up front and dispatch
  `board-keeper` once per epic with the whole set, rather than issue by issue.
  Label each sub-issue with its `layer:*` label; E1's single non-splittable PR
  still gets one issue per layer for tracking, with the PR referencing all of
  them.
- `SPEC.md` §6 (content model) and `docs/context/surfaces-and-routing.md`,
  `content-model.md`, `data-flow.md`, `seo-accessibility.md` all need syncing as
  each epic lands.

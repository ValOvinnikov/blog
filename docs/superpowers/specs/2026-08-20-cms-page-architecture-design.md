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

## Delivery phasing

Too large for one epic's worth of PRs. Four phases, each merging to `main`
green on its own; within a phase the usual `config → cms → service → ui → web`
order applies.

**Phase 1 — the rename.** `blog_category` → `blog_topic`, the post field, and
the `/category/{slug}` → `/topics/{slug}` URLs, with redirects. One
non-splittable PR (a `_type` rename reds `type-check` until every layer lands),
plus its migration. Behaviour-neutral: no page documents yet, archives still
render from the existing hardcoded grids. Doing this first means every later
phase is written in the final vocabulary.

**Phase 2 — the slot mechanic.** `module_postList` gains its paginated mode and
the widened 1–24 `limit`; `page_blog` gains its required `postList` slot and
`BlogListPage`'s hardcoded grid is removed. Proves the whole design on the one
page that already has a document, before any new document types exist.

**Phase 3 — topic and tag pages.** `page_topic`, `page_tag`, `page_topicIndex`,
`page_tagIndex`, `module_taxonomyList`, the `@blog/ui` taxonomy card/grid, both
Studio validation rules, the `/tags` URL move, and the seeding migration.
Retires `CATEGORY_ITEMS_PER_PAGE` / `TAG_ITEMS_PER_PAGE` and the hardcoded
category/tag grids.

**Phase 4 — author removal.** Delete the author routes, component, metadata
builder, service feature folder, and `routes.author()`; add `blog_author`'s
optional `page_generic` reference and point bylines at it. Retires
`AUTHOR_ITEMS_PER_PAGE`. Independent of phases 2–3 — could run in parallel.

`@blog/db`'s `starter-content.ts` update is a sibling to the cms work in each
phase that changes fixtures (1 and 3).

## Board actions

- Close #1333–#1336 and epic #1332 as superseded by this design. Its page-context
  contract survives — it is what scopes a `modules[]` post list — but its
  premise (`modules[]` on the taxonomy documents, grid untouched) does not.
- `SPEC.md` §6 (content model) and `docs/context/surfaces-and-routing.md`,
  `content-model.md`, `data-flow.md`, `seo-accessibility.md` all need syncing as
  each phase lands.

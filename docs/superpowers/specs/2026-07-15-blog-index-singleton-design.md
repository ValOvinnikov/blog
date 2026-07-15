# Blog index page singleton (`page_blog`) — design

- **Issue:** #341 · **Milestone:** Phase 3 — Blog core
- **Date:** 2026-07-15
- **Layers:** `cms → service → web` (dependency order). Additive → **no migration**.

## Goal

Model the `/blog` index page in the CMS so editors control its heading, SEO,
and page size — and so it becomes a real internal-reference **nav target**
(fixing the fact that `/blog` is currently unreachable from the CMS-driven
header). Removes the hardcoded-title TODO left by #75/#344.

## Problems solved (all surfaced building #75)

1. **Hardcoded title** — `buildBlogListMetadata` + the `<h1>` use literal
   `'Blog'` / `'Blog – Page N'` (TODO in `blog-list-metadata.ts`). Home sources
   its title from `page_home` SEO; the blog index has no equivalent document.
2. **Unreachable** — the header nav (`settings_navigation` → `PrimaryNavigation`)
   links via internal references to **documents**; there is no blog-index
   document to reference, so editors cannot add a "Blog" nav item.
3. **Page size is a code constant** — `POSTS_PER_PAGE = 9` lives in the service
   layer; editors cannot tune it.

## Decisions (from brainstorm)

- **Header fields:** `heading` (the `<h1>`) + optional `supportingText` (a short
  line under it). Naming (`supportingText`) is reused for any heading-adjacent
  text, aligned with existing schema conventions.
- **`itemsPerPage`:** **required**, `initialValue: 9`, validation **1–24**.
- **Nav target:** `page_blog` is added as an internal-reference target
  (`link.internalReference.to[]`) + a `to-link` builder entry.
- **Also fix `page_home`:** it currently uses bare `titleField()` — inconsistent
  with the singleton convention (SPEC §6: singletons pass `initialValue` +
  `readOnly: true`, which is what fixes the Studio _form_ "Untitled" heading).

## Design

### cms — `page_blog` singleton (mirrors `page_home`)

`apps/cms/src/schema-types/pages/page-blog.ts`:

```ts
export const blogPageSchema = defineType({
  name: 'page_blog',
  title: 'Blog Page',
  type: 'document',
  icon: Newspaper, // lucide-react (page_home uses House)
  preview: {
    select: { title: 'title' },
    prepare: () => ({ title: 'Blog Page', subtitle: 'Blog singleton' }),
  },
  fields: [
    titleField({ initialValue: 'Blog Page', readOnly: true }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The page <h1>.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      description: 'Optional line shown under the heading.',
    }),
    defineField({
      name: 'itemsPerPage',
      title: 'Items Per Page',
      type: 'number',
      description: 'Posts shown per page.',
      initialValue: 9,
      validation: (r) => r.required().min(1).max(24).integer(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override blog-index meta title, description, and social image.',
    }),
  ],
});
```

- **Register** in `schema-types/index.ts`; add to the **desk structure** as a
  singleton under **Pages** (mirror `page_home`'s singleton wiring, incl. the
  single-instance document id).
- **Nav target:** add `{ type: 'page_blog' }` to the `link` object's
  internal-reference `to[]` array (`schema-types/objects/link.ts`).
- **Fix `page_home`:** `titleField()` → `titleField({ initialValue: 'Home Page', readOnly: true })`.
- `pnpm typegen`; commit the regenerated `packages/config/src/sanity/generated/`.
- Additive; verify with `pnpm --filter cms type-check` + `lint`.

### service

- **Fetch the singleton** — a `page_blog` view-model
  `TBlogIndexSettings = { heading: string; supportingText?: string; seo?: TSeoMeta; itemsPerPage: number }`.
  The singleton is **nullable** (may not be authored yet), so the loader
  supplies **fallbacks** (`heading: 'Blog'`, `itemsPerPage: POSTS_PER_PAGE`, no
  seo) — keeping `/blog` working before it's authored. `POSTS_PER_PAGE` stays as
  the fallback default.
- **`getIndexPage`** merges the settings with the posts window →
  `TBlogIndexPage = { heading; supportingText?; seo?; posts; currentPage; totalPages; total }`.
  The window size comes from `itemsPerPage` (fetched settings), not a constant.
- **`getIndexPageParams`** reads `itemsPerPage` from the settings for its count
  math (`toTotalPages` unchanged).
- **`to-link`:** add `page_blog: () => routes.blogIndex()` to
  `INTERNAL_HREF_BUILDERS` (the `Record` stays exhaustive over the `_type`
  union, so the new schema target is a compile-time prompt to add it).
- Tests: settings transformer (present + absent → fallbacks); `getIndexPage`
  merges heading/seo + posts; pagination still correct with a CMS `itemsPerPage`.

### web

- `BlogPageTemplate` / `BlogListPage`: `<h1>` = `heading`; render
  `supportingText` under it when present (inline in the template — extract a
  `@blog/ui` header only if a second consumer appears).
- `buildBlogListMetadata`: title/description/OG from `page_blog.seo`, falling
  back to `siteSettings` (mirrors the home route's chain) — **removes the
  hardcoded-title TODO**. The "– Page N" suffix stays app-side (i18n, #321).
- `itemsPerPage` flows through the service; no `POSTS_PER_PAGE` reachable from
  web.
- **Nav:** no new web code — once the schema target + builder exist, an editor
  adds a "Blog" item to `settings_navigation` referencing `page_blog`, and the
  existing `PrimaryNavigation` + link builder render it → `/blog` reachable.

## Migration

None. New singleton document, additive `to[]` entry, additive
`INTERNAL_HREF_BUILDERS` key, and an additive optional/defaulted service path.
The `page_home` `titleField` change is schema-only (no stored-data change). Say
so explicitly: **no content migration required.**

## Decomposition — per-layer sub-issues of #341 (dependency order)

1. **cms** — `page_blog` singleton (heading/supportingText/itemsPerPage/seo) +
   desk singleton + `link` `to[]` target + `page_home` titleField fix + typegen.
2. **service** — settings fetch + view-model with fallbacks; `itemsPerPage`
   drives `getIndexPage`/`getIndexPageParams`; `to-link` `page_blog` builder;
   extend `TBlogIndexPage`.
3. **web** — heading/supportingText render + SEO from the singleton (TODO
   removed); items-per-page flows through service.

Each merges to `main` green on its own where possible; the `getIndexPage`
view-model change (service) reds web's type-check until web consumes it, so
service+web may pair if a partial merge would break the build.

## Acceptance (rolls up #341)

- [ ] Editors set the blog-index heading, supporting text, SEO, and items-per-page in Studio
- [ ] `<h1>` + metadata come from the CMS with sensible fallbacks (TODO removed); items-per-page drives pagination
- [ ] Editors can add a "Blog" nav item referencing `page_blog` → `/blog` reachable from the header
- [ ] `page_home` uses the fixed read-only titleField (Studio form no longer "Untitled")
- [ ] typegen committed; type-check/lint/test/build green; **no migration**

# Page composition — pages are chrome, a heading and modules

**Status:** design of record for the page-composition epic #2943 (sub-issues
#2944–#2955, created from this doc). Worked example: the blog post page, which ships first.
**Supersedes:** the `PostsSection` organism and every `*-page-view.tsx` in
`apps/web/src/components/pages/`; the `PostsSection.Carousel` slot in the
carousel design (`2026-08-23-module-and-page-type-portfolio-design.md`,
"The carousel display mode"); `hasLead` on `PostsSection` from the
spotlight design (same doc, "`module_postFeatured`").

## The problem

Every page in `apps/web` is built the same way today: a Server Component
fetches the page document, then fetches, formats and pre-computes for
**every** section of the page — related posts, newsletter settings,
capability flags, breadcrumb trails, JSON-LD, share links, translated
label objects, a formatted date — and hands the lot to a "view" component
as one prop bag. `BlogPostPageView` takes 31 props. The view then
re-decides the page inside itself, and the `@blog/ui` organism it leans on
(`PostsSection`) has grown a prop for every listing variant a page ever
needed: `title`, `titleId`, `accessibleTitle`, `supportingText`, `align`,
`linkAs`, `emptyMessage`, `hasImages`, `hasLead`, `cardHeadingLevel`,
`isTinted`, `isWrapped`.

Three things are wrong with that, and they compound:

1. **Data is fetched far from where it is used.** A section's fetch, its
   error handling and its copy live in the page, so adding a section means
   editing the page, the view's props, and the view.
2. **`@blog/ui` knows what a listing needs.** `PostsSection` maps a post to
   a card, decides heading fallbacks, lays out a spotlight and renders an
   empty state — page decisions, made in the design system.
3. **Nothing on the page is authorable.** Related reading and the post-foot
   newsletter are hardcoded on the post page; the page-builder modules the
   Studio already has cannot be placed there.

## The rule

A page is three things, in order:

```
Site header            ← the layout
Page heading           ← the page (title, or the article for a post)
Modules                ← ModuleRenderer over the page document's modules[]
Site footer            ← the layout
```

And each part of a page is a Server Component that **fetches what it alone
needs**. The page fetches exactly one thing — the document that decides
whether the page exists, which `generateMetadata` needs too — and composes.
Anything two parts both need is read through a request-scoped React
`cache()` wrapper, the way `getTenantSanityContext` and `getTenantBaseUrl`
already are, so a second call in the same render is free. Every loader
keeps returning a `TResult`; each part logs its own gap once and renders
nothing on optional failure, the SPEC.md §17 stance.

Consequences, in the order they are ticketed:

- **`PostsSection` retires.** Nothing replaces it in `@blog/ui`. A listing
  is composed in web from `Section`, `Heading`, `PostGrid`, `Carousel`
  and `PostCard`, with one web component mapping a post to a card.
- **The `*-page-view.tsx` layer retires.** A page's parts are stories and
  tests on their own; the page test asserts composition.
- **The post page gains `modules[]`**, and related reading and the
  post-foot newsletter become modules on it.

## Web building blocks

### `PostCardItem` — the one post-to-card mapping

`apps/web/src/components/shared/post-card-item/`. Takes one
`IPostCardData` (which moves out of `PostsSection` into this component's
file) plus `hasImage`, `headingLevel` (default 3) and the pre-rendered
image node, and renders `PostCard` with its `Media`, `Meta`, `Title`
(`SmartLink`) and `Footer` slots. Every listing renders
`items.map((item) => <PostCardItem … />)`. `toPostListItems` and the
image helpers are unchanged.

### `PostGrid` gains `columns`

`@blog/ui`'s `PostGrid` gets a `columns: 1 | 2 | 3` variant, default 3.
Today `PostGrid` breaks to three columns at `lg` while `PostsSection`'s own
grid — every post listing on the site — breaks at `md`; the variant adopts
`PostsSection`'s `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` so the post
listings keep their breakpoints when they move onto it (the carousel's
slide widths already assume `md`), and the taxonomy list, `PostGrid`'s one
caller today, moves from `lg` to `md` with it. The spotlight's two-column
tail and any narrower listing use `columns` instead of a bespoke grid.

### The listing arrangements, in web

| Arrangement | Composition                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grid        | `<PostGrid>` of `PostCardItem`                                                                                                                                |
| Spotlight   | first item as `<PostCardItem isLead isSplit>`, then one `isSplit` item or a `<PostGrid columns={2}>` of the rest                                              |
| Carousel    | the `PostsCarousel` client leaf: `<Carousel viewportRef isEnhanced>` of `PostCardItem` slides, per the carousel design minus its `PostsSection.Carousel` slot |
| Empty       | a `<p>` with the module's or page's own empty copy                                                                                                            |

`PostCard`'s `isLead` / `isSplit` are unchanged; only the arrangement moves
out of the design system.

### `ModuleRenderer` gains a page context

```ts
interface IModuleContext {
  post?: { id: string; slug: string };
}
interface IModuleRendererProps {
  modules: TModule[];
  locale: string;
  tenant: string;
  context?: IModuleContext;
}
```

Every module component receives `context` alongside `id`, `locale` and
`tenant`; only modules that need it read it. `context.post.id` is the
`page_post` document id. `module_postRelated` renders
nothing without `context.post`, so placing it on a page that is not a post
is harmless and logs a warning once.

## The blog post page — the worked example

### `page_post` is the post

Today a post is two documents: `blog_post` holds the content and
`page_post` (title, `slug`, a required unique `post` reference,
`publishedAt`, `seo`) holds the route — a wrapper the page-architecture
programme added so that every public page would be a page document, seeded
per post by migration and guarded by a uniqueness rule. The post's content
is never placed on any other page, so the wrapper carries no payload of its
own and costs an editor two documents per post. **Decided 2026-09-08: the
post is the page.** One document, `page_post`, keeps its name and its
`PAGE_POST_TYPE` constant (the `page_*` family stays consistent) and absorbs
every `blog_post` field with its validations: `title` (the headline — the
wrapper's "… Post Page" title is overwritten), `slug`, `excerpt`,
`heroImage`, `author`, `topic`, `tags`, `publishedAt`, `body`, `featured`,
`skim`, `seo`. `blog_post` retires, and with it the `post` reference,
`validateUniquePostReference`, the "no Post Page yet" warning on the post,
and the seed migration.

`page_post` also gains `modules[]` through `defineModulesField`, allow-list
`[module_postRelated, module_newsletter, module_cta, module_content]`, and
the `validateSingleBlankHeadingPerType` rule for the types that carry a
fallback heading. Two module documents are shared by every post — one
`module_postRelated` ("Related reading") and one `module_newsletter`
(compact) — with fixed document ids, the `STARTER_DOCUMENT_IDS` pattern
from tenant provisioning; an `initialValue` on `page_post.modules`
referencing those two ids gives every new post the same foot, and an
editor removes or reorders them per post.

**`blog_post.newsletterEnabled` retires with `blog_post`.** Its job — "no
signup under this post" — is the newsletter module's absence from that
post's `modules[]`; the copy migration leaves the module out where the flag
is `false`, and the field itself is never copied.

**Because a Sanity `_type` cannot change in place, every post id changes.**
The seed migration already gave each post a `page_post` whose id is the
post's id behind a `page_post-` prefix, so the mapping is fixed and needs
no lookup table — which is what makes the one place that holds post ids
outside Sanity migratable by string rewrite: `bookmarks.post_id` in
`@blog/db`. The delete-webhook bookmark cleanup keys on the id the webhook
sends, so it follows the type switch in web. References inside Sanity —
internal links (navigation, footer and the CTA module's text; post bodies
carry only URL links), the pinned posts on the featured module, the pinned
post on both hero modules — are rewritten by the same migration. Tenant
provisioning today seeds a `blog_post` and no `page_post` at all (a fresh
tenant's welcome post has no page); the starter post becomes a `page_post`.

The desk keeps `page_post` under Pages. The blog "Content" group, left with
topics, tags and authors once the post leaves it, splits into **Taxonomy**
(topics, tags) and **People** (authors).

### `module_postRelated`

| Field             | Notes                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `title`           | `titleField()`                                                        |
| `brandVariant`    | `brandVariantField()`                                                 |
| `sectionHeader`   | `sectionHeaderField()`; blank heading falls back to "Related reading" |
| `showImages`      | `showImagesField()`                                                   |
| `limit`           | number, 1–6, initial 3                                                |
| alignment, layout | `defineAlignmentFields([])`, `layoutField`                            |

No `displayMode` — grid only; the carousel is a latest/featured option.

Service: `service.modules.postRelated.v1.getPostRelated(id, postId,
tenant)` moves `getRelatedPosts` (shared-tag rank, then same-topic
backfill, capped by `limit`) behind a module loader that also resolves the
module's own fields; `getPost` stops embedding `relatedPosts`. Cache tags:
`modules:postRelated`, `module:<id>`, `posts`, `author`, `topic`, `tag`.
View model: `TPostRelatedModule = { brandVariant; sectionHeader; posts:
TPostCard[]; layout; contentAlignment; showImages }`, structurally the
latest module's.

`module_newsletter` gains `variant` (`NEWSLETTER_VARIANT`: `FULL` |
`COMPACT`, initial `FULL`, read-time default `FULL`) so the compact
post-foot density is authored rather than implied by the page.

### The page, decomposed

```
BlogPostPage({ slug, tenant, locale })
  post = getPostPage(slug, tenant)            ← cache()-wrapped service.pages.post.v1.getPost; notFound on failure
  <BlogPostingSchema slug tenant />           ← JSON-LD; reads the cached post + getTenantBaseUrl
  <PostBreadcrumbs slug tenant />             ← trail + its JSON-LD; fetches `breadcrumbs` copy itself
  <main>
    <DepthProvider>
      <DepthToggle />                         ← labels via useTranslations inside
      <PostArticle slug tenant />             ← Article.Header / Body / Footer from the cached post
    </DepthProvider>
    <SkimPanel … />                           ← unchanged, labels inside
    <ModuleRenderer modules={page.modules} context={{ post }} locale tenant />
  </main>
  <BackToTopButton />
```

- **`PostArticle`** owns the date formatting, reading time, hero image,
  aside-kind labels, the contents rail decision (`extractPostHeadings`,
  the H2 threshold), the tags footer, and two children it composes:
  `PostShareLinks` (builds its own links and icons from `url` + `title`)
  and `BookmarkButton` (its server wrapper checks the bookmarks
  capability itself).
- **`PostBreadcrumbs`** builds its trail from the cached post's topic and
  title and emits the breadcrumb list schema; the topic page reuses it
  with a shorter trail.
- **Nothing is a view.** `blog-post-page-view.tsx` and its story and test
  are deleted; each part gets its own test, and the page test asserts the
  parts render in order and that `ModuleRenderer` receives the post
  context.

### What ships first

The user asked to see the post page first, so the web sub-issue for it is
dispatchable before the studio and service work lands. It decomposes the
page exactly as above with two self-fetching parts standing in for the
modules — `PostRelated` (reads `relatedPosts` off the cached post and
composes `Section` + `Heading` + `PostGrid` + `PostCardItem`) and
`PostNewsletter` (fetches the settings singleton, honours
`newsletterEnabled`) — placed where `ModuleRenderer` will go. The module
sub-issues then replace those two parts with the renderer, and the
`relatedPosts` embed in `getPost` goes with them.

## The other pages

Each gets one sub-issue, same recipe: delete the view, the page fetches
its document once through a `cache()` wrapper, every other concern
becomes a self-fetching part, and listings compose the arrangements above.

| Page                | Today                                      | After                                                                                                |
| ------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Blog list           | view (8 props) around `PostListModuleView` | heading part + `PostListModule` composing `Section` + `Heading` + `PostGrid` + `Pagination` directly |
| Topic               | view (9 props), hand-built breadcrumbs     | `PostBreadcrumbs` + heading part + `PostListModule`                                                  |
| Tag                 | view (7 props)                             | same as topic                                                                                        |
| Topics / Tags index | views (6 props each)                       | heading part + `TaxonomyListModule` (already composes primitives)                                    |
| Landing             | view (6 props)                             | hero slot + `ModuleRenderer` (already), view deleted                                                 |
| Home                | already `HeroSlot` + `ModuleRenderer`      | unchanged                                                                                            |

`PostListModuleView` retires with `PostsSection`: `PostListModule`,
`PostLatestModule` and `PostFeaturedModule` each compose their own section
(the three differ in source, pagination and arrangement, which is exactly
what a shared view was hiding). Bookmarks and account pages are app pages,
not CMS pages, and are out of scope.

## Sequencing and PRs

Expand, then contract, so every PR merges green alone:

1. **web · post page** (#2944) — the decomposition with the two stand-in parts,
   `PostCardItem`, the cached post loader. `PostsSection` still exists for
   the other callers. **First.**
2. **ui · `PostGrid` columns** (#2945) — independent, additive.
3. **web · listing modules** (#2946) — retire `PostListModuleView`; the three
   modules compose primitives; the spotlight arrangement in web. After 1
   and 2.
4. **ui · retire `PostsSection`** (#2947) — delete the organism, its stories,
   tests and `COMPONENTS.md` entry. After 1 and 3 (no callers remain).
5. **studio · `page_post` absorbs `blog_post`, gains `modules[]`;
   `module_postRelated`; `module_newsletter.variant`** (#2948) — the content
   fields and their validations on `page_post`; `page_post` added next to
   `blog_post` in the reference targets of `link.ts`, `module_hero`,
   `module_heroBlog` and `module_postFeatured` (until step 9); typegen; the
   copy-and-repoint migration.
6. **service · every read on `page_post`; `modules.postRelated.v1`; `getPost`
   drops `relatedPosts`** (#2949) — the 24 files that filter, fragment or
   link on `blog_post` move to `page_post`.
7. **web · modules on the post page; the post type in the webhook** (#2950) —
   `ModuleRenderer` context, `PostRelatedModule`, the newsletter module's
   compact variant, the two stand-in parts deleted; `BLOG_POST_TYPE` in the
   revalidation path derivation and the `revalidate-tags` map move to
   `page_post`, so bookmark cleanup on delete follows.

   Steps 5–7 **ship as one PR**: typegen adds `module_postRelated` to
   `TModuleType` and the content fields to the `page_post` type, and every
   service read switches with it — the `module_postFeatured` precedent with
   the type switch on top. Three sub-issues for three layer agents, one
   branch. `blog_post` stays registered and untouched until step 9.

8. **db · bookmark ids and the starter post** (#2959) — a data migration
   prefixes every `bookmarks.post_id`; the provisioning starter post becomes
   a `page_post`. Own PR, deployed together with the step 5–7 PR: the
   deploy workflow runs the Sanity and Drizzle migrations before the web
   deploy, and deploys are manual today, so one dispatch carries both.
9. **studio · retire `blog_post`** (#2960) — after 5–8 have deployed
   and both migrations have run on the dataset: the delete migration, the
   `blog_post` schema, `page_post.post` and its uniqueness rule, the seed
   migration, `blog_post` in the reference targets and in the
   `revalidate-tags` map; the desk regroup.
10. **web · one PR per remaining page** — blog list (#2951), topic (#2952),
    tag (#2953), topics and tags (#2954), landing (#2955). After 3;
    independent of each other.

The carousel epic (#2785) rebases on this: its ui PR keeps the `Carousel`
organism and drops the `PostsSection.Carousel` slot; its web leaf composes
`Carousel` of `PostCardItem` inside the latest and featured modules after
step 3. Topic-card posts (#2891) are unaffected — that view already
composes primitives.

## Migration

Three human-gated runs, in this order, each dry-run → backup → run per
`packages/studio/migrations/README.md`:

1. **Copy and repoint (Sanity, step 5).** For every `blog_post`, published
   and draft alike (`drafts.<id>` → `drafts.page_post-<id>`, so unpublished
   edits survive): write the content fields onto the matching `page_post`,
   creating it if the seed migration missed it. Where both documents hold
   a value the page's `slug`, `publishedAt` and `seo` win (the page has
   been the route's source of truth) and the post's `title` wins (the
   wrapper's "… Post Page" title was never a headline). Set `modules` to
   the two shared module ids — created first, with their fixed ids —
   omitting the newsletter module where `newsletterEnabled == false`. Then
   rewrite every `_ref` anywhere in the dataset that equals a `blog_post`
   id to the `page_post` id: `*[references($ids)]`, walking each document
   for `_ref` values, which covers `link.internalReference`,
   `module_hero.featuredPost`, `module_heroBlog.post`,
   `module_postFeatured.posts[]` and Portable Text mark definitions.
   Idempotent: a second run changes nothing.
2. **Bookmark ids (Drizzle, step 8).** `update "bookmarks" set "post_id" =
'page_post-' || "post_id" where "post_id" not like 'page_post-%'`.
3. **Delete `blog_post` (Sanity, step 9).** For each `blog_post`, assert its
   `page_post` has `body` and that `count(*[references(^._id)]) == 0`, then
   delete it and its draft. A separate migration from run 1, per the
   `_type`-immutability rule: create, repoint, delete in a later run.

Everything else is additive.

## Not in scope

- A page-level layout builder (header/footer as modules). The layout owns
  the chrome.
- Client-side data fetching anywhere; parts are Server Components.
- `displayMode` on the related-posts module.
- The account and bookmarks pages.

## Acceptance

- The post page's Server Component fetches the post once, computes
  nothing for its parts, and renders `ModuleRenderer` with the post
  context; `blog-post-page-view.tsx` is gone.
- Related reading and the post-foot newsletter are authorable per post
  through `page_post.modules[]`; an existing post renders both without an
  editor touching it.
- `page_post` is the only post document — content, route and `modules[]`
  in one; `blog_post` and the wrapper's `post` reference are gone;
  bookmarks and every Sanity reference follow the prefixed ids.
- `PostsSection` and every `*-page-view.tsx` are deleted; no `@blog/ui`
  component maps a post to a card or lays out a spotlight.
- Every listing on the site renders through `PostCardItem` and `PostGrid`,
  or `Carousel` where `displayMode` says so.

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
- **The `*-page-view.tsx` layer retires.** A page's parts are tested on
  their own and the page test asserts composition. A self-fetching part
  gets no story — it cannot render outside a request — so the story that
  used to cover a page view is not replaced. Only the pure, prop-driven
  parts are storyable, and stories for them are optional.
- **The post page gains `modules[]`**, and related reading and the
  post-foot newsletter become modules on it.

## Web building blocks

### Where a part lives

A part's directory is decided by whether it fetches, not by which page
happens to use it first:

- **`components/features/<page>/`** — parts that fetch. A part that reads
  its own data through a `cache()`-wrapped loader is bound to the page
  whose document that loader returns, so no other page can reuse it. The
  post page's `PostArticle`, `PostBreadcrumbs`, `BlogPostingSchema`,
  `PostRelated`, `PostNewsletter` and `BookmarkButtonGate` live under
  `components/features/post/`.
- **`components/shared/`** — parts that take props and nothing else.
  `PostCardItem` and `PostShareLinks` are pure mappings of their inputs
  and are reused across listings and pages.

`components/pages/` and `components/page-templates/` are unchanged. The
rule exists because "shared" had otherwise started to mean "any component
that is not a page", which is how six post-only components ended up
alongside genuinely reusable ones.

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
`tenant`; only modules that need it read it. `module_postRelated` renders
nothing without `context.post`, so placing it on a page that is not a post
is harmless and logs a warning once.

## The blog post page — the worked example

### Page document

`page_post` (today: `title`, `slug`, `post`, `publishedAt`, `seo`) gains
`modules[]` through `defineModulesField`, allow-list
`[module_postRelated, module_newsletter, module_cta, module_content]`, and
the `validateSingleBlankHeadingPerType` rule for the types that carry a
fallback heading. Two module documents are shared by every post page —
one `module_postRelated` ("Related reading") and one `module_newsletter`
(compact) — with fixed document ids, the `STARTER_DOCUMENT_IDS` pattern
from tenant provisioning. Nothing creates `page_post` documents
automatically today; an `initialValue` on `page_post.modules` referencing
those two ids gives every new post page the same foot, and an editor
removes or reorders them per post.

**`blog_post.newsletterEnabled` retires.** Its job — "no signup under this
post" — is now the module's absence from that post's page. A migration
removes the shared newsletter module from every `page_post` whose post has
`newsletterEnabled == false`, then the field goes; it is
human-gated like every production migration and ships with the studio
sub-issue.

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
5. **studio · `page_post.modules[]`, `module_postRelated`,
   `module_newsletter.variant`, retire `newsletterEnabled`** (#2948) — typegen;
   the migration.
6. **service · `modules.postRelated.v1`, `getPost` drops `relatedPosts`**
   (#2949).
7. **web · modules on the post page** (#2950) — `ModuleRenderer` context,
   `PostRelatedModule`, the newsletter module's compact variant, the two
   stand-in parts deleted.

   Steps 5–7 **ship as one PR**: typegen adds `module_postRelated` to
   `TModuleType`, which reds `MODULE_MAP` and `REVALIDATE_TAGS` until the
   web entries land — the `module_postFeatured` precedent. They are three
   sub-issues for three layer agents, one branch.

8. **web · one PR per remaining page** — blog list (#2951), topic (#2952),
   tag (#2953), topics and tags (#2954), landing (#2955). After 3; independent of each other.

The carousel epic (#2785) rebases on this: its ui PR keeps the `Carousel`
organism and drops the `PostsSection.Carousel` slot; its web leaf composes
`Carousel` of `PostCardItem` inside the latest and featured modules after
step 3. Topic-card posts (#2891) are unaffected — that view already
composes primitives.

## Migration

One, human-gated, in step 5: reference the shared related-reading and
newsletter modules from every existing `page_post`, skipping the
newsletter module where the post's `newsletterEnabled` is `false`; then
drop the field. Everything else is additive.

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
- `PostsSection` and every `*-page-view.tsx` are deleted; no `@blog/ui`
  component maps a post to a card or lays out a spotlight.
- Every listing on the site renders through `PostCardItem` and `PostGrid`,
  or `Carousel` where `displayMode` says so.

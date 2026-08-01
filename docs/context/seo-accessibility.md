# SEO & accessibility

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §10. See also the `seo-and-metadata` skill, which
> applies this as an audit checklist.

- Per-route `generateMetadata` (title, description, canonical, Open Graph,
  Twitter card) using `NEXT_PUBLIC_SITE_URL`.
- **SEO fallback resolution lives in `service`**, not the routes: a single
  `resolveSeo` transformer applies the ladder **authored `seo` →
  content-derived → site defaults** once per field, returning a fully-resolved
  `TSeoResolved`. `web` maps it to `Metadata` with one shared `toMetadata`
  helper — no `??` fallback chains in route files. Page loaders
  (`getHomePage`, `getIndexPage`, `getPage` for the generic page — #370,
  `getPost` for the post detail page — #371) fetch site settings internally
  (Next dedupes) and return `seo: TSeoResolved`. The home title is emitted
  **absolute** (it is the brand) so the layout `%s | Brand` template does not
  double-append; site settings contribute only `description` +
  `defaultOgImage` as the final rung. If no image resolves at any rung,
  `ogImageUrl` is absent and the route omits `og:image` / the twitter image
  rather than emitting an empty tag. Post detail's `toMetadata` call also
  passes `article.publishedTime`/`article.authors` (from the post
  view-model) — an opt-in extension to `toMetadata`'s options, only emitted
  for `ogType: 'article'` callers.
- Paginated lists: every page **self-canonical** (never canonical-to-page-1),
  no `rel=next/prev`, out-of-range → hard 404 (`SPEC.md` §1 routing
  conventions, [`surfaces-and-routing.md`](./surfaces-and-routing.md)).
- JSON-LD `Article`/`BlogPosting` on post pages (#94).
- **Breadcrumbs & structured data (#835):** every content route renders a
  `Breadcrumbs` trail (`@blog/ui` molecule) as page chrome, wrapped in a
  web-level `BreadcrumbBar` (#903) rendered as a true DOM sibling of
  `<main>` — immediately after `<Header>`, before `<main>`, never nested
  inside it. `BreadcrumbBar`'s outer band spans the full viewport width
  (matching `Header`'s own full-bleed `border-b`), with an inner wrapper
  constraining the trail to `max-w-page` (1120px) on every page regardless
  of that page's own content width (#937). The home page renders no bar. This is
  paired with a `BreadcrumbList` JSON-LD schema (`buildBreadcrumbListSchema`)
  built from the same trail, still co-located per page. Post pages (`/blog/{slug}`, #815) render
  `Home › Category › Post`, sitting next to the existing `BlogPosting`
  JSON-LD. Category archives (`/category/{slug}`, #836) render
  `Home › {Category}`; tag archives (`/tag/{slug}`, #837) render
  `Home › Tag: {Tag}`. Author archives (`/author/{slug}`, #838) render
  `Home › Author: {Name}`; generic pages (`/{slug}`, #839) render
  `Home › {Page title}`; the topics index (`/topics`, #840) renders
  `Home › Topics` and the blog index (`/blog`, #840) renders `Home › Blog`.
- `sitemap.ts`, `robots.ts`, RSS route (#92).
- **Per-environment indexing (#841):** gated by `NEXT_PUBLIC_SANITY_DATASET`
  (via the shared `isProductionEnvironment()` helper) — only the real
  `production` dataset is indexable. Every other environment (e.g.
  `development`, which can serve content byte-identical to production after a
  dataset refresh) gets a page-level `<meta name="robots" content="noindex,
nofollow">` from the root layout on every route, while `robots.ts` keeps
  crawling allowed (so that noindex is actually seen) but omits the sitemap.
  The blanket meta tag, not `robots.txt`, is the authoritative de-indexing
  lever — a `Disallow: /` would stop crawlers from ever fetching the page to
  see its `noindex`.
- Security headers shipped from `next.config.ts`: strict CSP (documented
  inline), HSTS, `X-Frame-Options: DENY`, referrer + permissions policies.
- Semantic HTML; card titles are heading tags; no hardcoded `aria-label`s in
  `ui` (always an `ariaLabel` prop); date formatting happens in `web` (pass
  `formattedDate` down). Target Lighthouse ≥ 95 in all categories.
- Mobile-first responsive design on Tailwind default breakpoints (`md`/`lg` as
  the two layout tiers); fluid `clamp()` tokens preferred; page width owned by
  `apps/web` (`max-w-content`), `ui` stays width-agnostic.

---
title: Page types
status: built
layers: [config, studio, service, web]
code:
  - packages/config/src/routes.ts
  - packages/studio/src/schema-types/documents/pages/home/**
  - packages/studio/src/schema-types/documents/pages/post-index/**
  - packages/studio/src/schema-types/documents/templates/**
  - packages/studio/src/schema-types/fields/template-field/**
  - packages/studio/src/schema-types/objects/page-heading-block/**
  - packages/studio/src/schema-types/validation/validate-one-per-language/**
  - packages/studio/src/schema-types/validation/validate-template-matches-default-language/**
  - packages/studio/src/schema-types/validation/validate-slug-unique-in-language/**
  - packages/studio/src/structure/sections/pages-section.ts
  - packages/studio/src/structure/sections/templates-section.ts
  - packages/service/src/features/pages/home/**
  - packages/service/src/features/pages/post-index/**
  - packages/service/src/shared/fragments/heading-block/**
  - packages/service/src/shared/transformers/heading-block/**
  - apps/web/src/app/*/*/page.tsx
  - apps/web/src/app/*/*/blog/page.tsx
  - apps/web/src/app/*/*/blog/page/**
  - apps/web/src/components/pages/home-page/**
  - apps/web/src/components/pages/post-index-page/**
  - apps/web/src/components/features/post-index/**
  - apps/web/src/components/page-templates/page-shell/**
  - apps/web/src/server/home/**
  - apps/web/src/server/post-index/**
  - apps/web/src/metadata/home-page-metadata/**
  - apps/web/src/metadata/post-index-metadata/**
  - apps/web/src/utils/guard-page-loader-result/**
  - apps/web/src/utils/redirect-missing-language-page/**
epics: [1919, 2798]
---

# Page types

## What it does

Every public page of a tenant's site is a Sanity page document of one of eight fixed types: Home, Landing, Post, Post Index, Topic, Topic Index, Tag and Tag Index. Each page document carries its own heading, SEO and (where addressable) slug; all but Post point at a shared **template** document that holds the page's hero and ordered modules. Editors build pages in the Studio; the site renders each type at a fixed route. This page covers the shared shape plus Home and Post Index; Landing, Post and the taxonomy pages have their own pages.

## Surfaces and routes

| Page document     | Template              | Route                          | Per language |
| ----------------- | --------------------- | ------------------------------ | ------------ |
| `page_home`       | `template_home`       | `/`                            | one          |
| `page_landing`    | `template_landing`    | `/{parent…}/{slug}`            | many (tree)  |
| `page_postIndex`  | `template_postIndex`  | `/blog`, `/blog/page/{n}`      | one          |
| `page_post`       | — (own `modules[]`)   | `/blog/{slug}`                 | many         |
| `page_topicIndex` | `template_topicIndex` | `/topics`                      | one          |
| `page_topic`      | `template_topic`      | `/topics/{slug}`, `…/page/{n}` | many         |
| `page_tagIndex`   | `template_tagIndex`   | `/tags`                        | one          |
| `page_tag`        | `template_tag`        | `/tags/{slug}`, `…/page/{n}`   | many         |

- Non-default languages prefix the route with the language code (see [languages](./languages.md)).
- **Studio** — the Pages sidebar section groups Home, Landing (as a page tree) and Blog (Post Index Page, Post Page, Topic Index Page, Topic Page, Tag Index Page, Tag Page — each label is the schema title). Singletons list one document per language; the others list by language. The Templates section holds one list per template type.
- No platform surface; pages are edited in the [embedded Studio](./embedded-studio.md).

## Data

- Every page document: `language`, `title` (internal Studio label), `headingBlock` (`pageHeadingBlock`: required `heading`, optional `supportingText`), `contentAlignment` (Left or Center), `seo`. Addressable types add `slug`.
- `template` — a required reference to the matching `template_*` type, excluded from translation, so one template can serve every language version of a page.
- A template carries `title`, an optional `hero` reference and a `modules` array of module references. The hero and module types each template accepts are fixed in its schema and mirrored by the page's module map in `apps/web`. Every `modules[]` accepts `module_cta` and `module_newsletter`; the list-like templates allow one `module_postList` (Post Index, Topic, Tag) or one `module_taxonomyList` (the two indexes).
- `template_home` and `template_landing` accept all three heroes and every explainer, proof and pricing module (only Landing adds `module_sectionPages`); the blog-side templates accept only `module_heroBlog` as a hero and a short set of listing and content modules: Post Index adds `module_postFeatured` and `module_content`, Topic and Tag add `module_content` and `module_faq`, and both indexes add `module_content` (see [module-system](./module-system.md)).
- **Caching** — each page loader fetches through `isr()` with tags for its page and template types (Home uses `homePage` and `template_home`). Publishing a page or template purges those tags and the whole layout; every content route also declares `revalidate = 21600` as a backstop (see [rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors create and edit every page and template in the Studio. Owners and operators reach the Studio through the platform; nothing about page types is set in the platform itself.
- Page types are not gated by plan. Capability-gated modules (newsletter) render nothing when the capability is off (see [plans-and-entitlements](./plans-and-entitlements.md)).
- [Look](./look.md) restyles every page type; there is no per-type Look setting. Fixed strings on these pages (breadcrumb labels, topic chips) are translated catalogue keys, not [Voice](./voice.md) fields.

## Constraints and invariants

- The eight types and their routes are fixed in code. `routes` and `pageHref` in `@blog/config` are the only place a page type maps to a URL; `RESERVED_SLUGS` lists the segments a top-level Landing slug may not use. It does not match the routes exactly: it reserves `category`, `tag`, `author` and `page`, which are not top-level routes, and omits the fixed `/bookmarks` and `/account` routes, so a top-level Landing page with either slug is hidden behind them.
- Home, Post Index, Topic Index and Tag Index allow one document per language (`validateOnePerLanguage`).
- Slugged types (Post, Topic, Tag) require a slug unique within their type and language; Landing slugs are unique among siblings (see [landing-tree](./landing-tree.md)).
- A page whose template differs from its default-language version's template gets a warning, not an error.
- When a template sets a hero, the hero owns the page's `<h1>` and the page's own heading block is not rendered; with no hero, `PageHeading` renders the heading block. The heading block is still required, because posts, cards, breadcrumbs and section navigation read it.
- A module type absent from a page's renderer map is skipped with a `module_renderer.unknown_module_type` warning.
- A missing Home, Post Index, Topic Index or Tag Index in a non-default language redirects to the site root. Every other missing document, and every loader failure, returns a 404 (`guardPageLoaderResult`).
- `/blog/page/1` and `/{archive}/{slug}/page/1` 308 to the unnumbered URL; a non-numeric page number 404s.
- Content routes render on first request: `generateStaticParams` returns an empty list.

## Dependencies

- Layers: `studio` (schemas, desk), `service` (`service.pages.*` loaders), `web` (routes and compositions), `config` (`routes`, generated types).
- Features: [module-system](./module-system.md), [heroes](./heroes.md), [languages](./languages.md), [seo-and-feeds](./seo-and-feeds.md), [rendering-and-caching](./rendering-and-caching.md), [errors-and-404](./errors-and-404.md), [landing-tree](./landing-tree.md), [posts](./posts.md), [topics-and-tags](./topics-and-tags.md).
- Provisioning seeds a starter `page_home` (see [tenant-provisioning](./tenant-provisioning.md)).
- Env vars: none of its own.

## Entry points

- `packages/studio/src/structure/sections/pages-section.ts`, `templates-section.ts`
- `packages/studio/src/schema-types/fields/template-field/template-field.ts`
- `packages/studio/src/schema-types/documents/templates/` (one file per template)
- `packages/service/src/features/pages/` (one feature per page type)
- `apps/web/src/components/pages/` (one composition and `*-module-renderer.tsx` per page type)
- `apps/web/src/components/page-templates/page-shell/page-shell.tsx`
- `apps/web/src/utils/guard-page-loader-result/guard-page-loader-result.ts`

## Tests and stories

- Studio: `validate-one-per-language`, `validate-template-matches-default-language`, `validate-slug-unique-in-language` tests beside each validator.
- Service: `packages/service/src/features/pages/home/**/*.test.ts`, `post-index/**/*.test.ts`.
- Web: `home-page.test.tsx`, `post-index-page.test.tsx`, each `*-module-renderer.test.tsx`, the metadata builders' tests, `post-index-breadcrumbs.test.tsx`, `post-index-topic-chips.test.tsx`.
- Stories: none for Home or Post Index; see the sibling pages for the others.

## Related

- #1919 — module and page-type portfolio (new page types land here).
- #1291 — portfolio content type and a `/work` surface.
- #2798 — site templates that seed page and template documents at tenant creation.
- #1880 — decide whether a loader failure should 404 or 500.

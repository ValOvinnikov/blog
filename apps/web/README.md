# web

> The Next.js App Router site that renders the blog for readers.

This is the only app in the monorepo that fetches from `@blog/service` and
renders through `@blog/ui` in the same place — Server Components pull typed
data from the service facade and pass plain props into design-system
components. It also owns everything framework-coupled that doesn't belong in
a pure package: routing, locale handling, metadata/SEO, feeds, and the
Server Actions behind account/bookmark/newsletter features.

## Layer contract

- **Depends on:** `@blog/ui`, `@blog/service`, `@blog/db`, `@blog/auth`,
  `@blog/config`, `@blog/utils`, `@blog/tailwind-config`
- **Consumed by:** nothing (deployable app, not a workspace dependency)
- **Never imports:** the Sanity SDKs or GROQ directly (that's
  `@blog/service`'s job), and never wraps/re-forwards a `@blog/ui`
  component's props — it composes compound slots instead

Within the app itself: Server Components by default; `'use client'` is added
only at the leaf boundary that genuinely needs browser APIs or hooks (theme
toggle, share buttons, mobile nav), never on a whole page.

## Layout

- `src/app/` — route tree. Locale-prefixed pages live under
  `src/app/[locale]/` (`blog`, `blog/[slug]`, `category/[slug]`,
  `tags/[slug]`, `author/[slug]`, `topics`, `account`, `bookmarks`, and the
  catch-all `[slug]` for standalone pages); `src/app/api/` holds Route
  Handlers (`revalidate`, `revalidate-site-config`, `auth`, `newsletter`,
  `account/export`, `generate-skim`); `sitemap.ts`, `robots.ts`,
  `rss.xml/route.ts`, `opengraph-image.tsx`, `twitter-image.tsx`, and
  `icon.tsx` are the site-wide SEO/feed surface.
- `src/components/pages/` — page-level compositions (fetch + compose) that a
  route's `page.tsx` renders directly.
- `src/components/page-templates/` — shared, data-free render shells
  consumed by more than one `pages/` component.
- `src/components/shared/` — reusable, framework-coupled pieces
  (`smart-link`, `sanity-image`, `json-ld`, `theme-toggle-button`, etc.)
  consumed from more than one place.
- `src/modules/` — renderers for CMS page-builder modules (`hero`,
  `post-list`, `content`, `cta`, `newsletter`), keyed off a discriminator
  map (`module-map.ts`) and dispatched by `module-renderer.tsx`.
- `src/metadata/` — one folder per route's `generateMetadata` builder.
- `src/utils/` — one folder per helper function (formatters, slot builders,
  the RSS/JSON-LD builders).
- `src/server/` — Server Actions and server-only code, grouped by domain
  (`account/`, `auth/`, `bookmarks/`, `email/`, `newsletter/`, `site-config/`,
  `skim/`, `tenant/`).
- `src/i18n/` — next-intl routing config and request-scoped setup.
- `src/context/`, `src/hooks/`, `src/config/` — client providers, browser
  hooks, and app-level config (fonts, inline theme/depth bootstrap scripts).
- `src/proxy.ts` — the Next.js middleware entry point (resolves the tenant
  from the request host, then hands off to next-intl's locale middleware).
- `src/testing/` — shared test setup and render helpers.
- `e2e/` — Playwright smoke specs, run against a real deployed origin, not a
  local build.

## Scripts

| Script            | Command                                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`             | `pnpm --filter web dev`                                                                                                                                                                                                                                             |
| `build`           | `pnpm --filter web build`                                                                                                                                                                                                                                           |
| `start`           | `pnpm --filter web start`                                                                                                                                                                                                                                           |
| `lint`            | `pnpm --filter web lint`                                                                                                                                                                                                                                            |
| `type-check`      | `pnpm --filter web type-check`                                                                                                                                                                                                                                      |
| `format`          | `pnpm --filter web format`                                                                                                                                                                                                                                          |
| `test`            | `pnpm --filter web test`                                                                                                                                                                                                                                            |
| `test:watch`      | `pnpm --filter web test:watch`                                                                                                                                                                                                                                      |
| `test:e2e`        | `pnpm --filter web test:e2e` — runs the Playwright specs in `e2e/` against `SMOKE_URL` (a real deployed origin, e.g. `SMOKE_URL=http://localhost:3000 pnpm --filter web test:e2e` against a locally started `dev` server); there is no local `webServer` build step |
| `storybook`       | `pnpm --filter web storybook`                                                                                                                                                                                                                                       |
| `storybook:build` | `pnpm --filter web storybook:build`                                                                                                                                                                                                                                 |

The root `pnpm type-check`, `pnpm lint`, and `pnpm test` run every
workspace, including this one, through Turborepo.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) — architecture and route inventory
- [`../../packages/ui/COMPONENTS.md`](../../packages/ui/COMPONENTS.md) —
  generated index of every `@blog/ui` component (props, compound slots)
- [`../../docs/context/surfaces-and-routing.md`](../../docs/context/surfaces-and-routing.md)
- [`../../docs/context/rendering-caching-i18n.md`](../../docs/context/rendering-caching-i18n.md)
- [`../../docs/context/seo-accessibility.md`](../../docs/context/seo-accessibility.md)
- [`../../docs/context/frontend-conventions.md`](../../docs/context/frontend-conventions.md)

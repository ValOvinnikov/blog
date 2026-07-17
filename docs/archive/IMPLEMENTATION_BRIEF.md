# AI Implementation Brief — Blog Monorepo

> **⚠️ ARCHIVED (2026-07-12).** This was the one-shot bootstrap playbook for the
> initial build, which is complete. It is kept as historical context only and is
> **no longer maintained** — versions, paths, and the content model below have
> drifted from reality. The single durable reference is [`SPEC.md`](./SPEC.md);
> when the two disagree, `SPEC.md` wins. Do not extend this file.

> **For the AI agent reading this:** This is your implementation spec. Build the project described below. Follow the dependency rules and bootstrap order exactly. Where a step says "install latest", run the official scaffolder rather than hard-coding versions — the `package.json` files in this repo are a structural skeleton, and version numbers in them should be reconciled to the latest stable on install. Ask the user for the Sanity project ID and dataset before wiring the data layer. Work top-to-bottom; do not skip the acceptance checks.
>
> **Working in this repo?** Read [`SPEC.md`](./SPEC.md) for the durable product + architecture reference, and use the scoped subagents in `.claude/agents/` (`cms`, `service`, `ui`, `web`) plus the skills in `.claude/skills/` (`develop-feature`, `add-content-type`, `ui-library-practices`, `testing-practices`, `seo-and-metadata`, `code-review-practices`).

---

## 1. Goal

A CMS-driven **blog**, structured as a **Turborepo + pnpm monorepo** with strict separation of concerns. It must demonstrate senior-level architecture: modular boundaries, a reusable design system, headless CMS, and end-to-end TypeScript type safety.

The blog publishes long-form articles with rich text, code blocks, author bylines, categories/tags, and full SEO. The architecture is the point: clean layering, typed data flow, and a publishable design system.

**Stack:** Next.js 15 (App Router, TS strict) · Sanity v4 Studio · Tailwind CSS v4 · Atomic Design · Vitest + Testing Library.
**Hosting:** Vercel Hobby (web) + Sanity-hosted Studio (cms). Both free.

---

## 2. Workspaces

| Workspace | Path               | Package name    | Responsibility                                                                     |
| --------- | ------------------ | --------------- | ---------------------------------------------------------------------------------- |
| cms       | `apps/cms`         | `cms`           | Sanity Studio: schema definitions, content modelling, editorial UI, typegen source |
| web       | `apps/web`         | `web`           | Next.js frontend: routes, SEO, composition of ui + service                         |
| service   | `packages/service` | `@blog/service` | Data access: Sanity client, GROQ queries, typed fetch functions                    |
| ui        | `packages/ui`      | `@blog/ui`      | Atomic Design component library: pure, presentational, prop-driven                 |
| types     | `packages/types`   | `@blog/types`   | Generated Sanity types + shared content shapes                                     |
| config    | `packages/config`  | `@blog/config`  | Shared tsconfig, Tailwind preset, eslint config, Vitest preset                     |

---

## 3. Dependency rules (HARD CONSTRAINTS — do not violate)

```
web → ui, service, types
service → types
ui → types        (types only; no Sanity, no data fetching)
cms → types       (cms generates the types via typegen)
config → consumed by all
```

- **`ui` must never import from `service` or from `sanity`/`next-sanity`.** It receives plain typed props. It must stay portable enough to publish to npm later.
- **`service` must never import React.** It exposes async functions returning typed data.
- **`web` is the only place ui and service meet.** Server Components fetch via `service`, pass results as props into `ui`.
- The graph must stay **acyclic**.

Internal packages use the **Just-in-Time pattern**: export raw TypeScript (`"exports": { ".": "./src/index.ts" }`), no per-package build step. The web app transpiles them via `transpilePackages: ["@blog/ui", "@blog/service", "@blog/types"]` in `next.config.ts`.

---

## 4. Bootstrap order

Run these in sequence. Reconcile any version mismatch toward the latest stable.

1. **Install workspace deps:** at repo root run `pnpm install`.
2. **config package:** ensure `tsconfig/base.json`, `tailwind/preset.ts`, `eslint/index.js`, and `vitest/preset.ts` exist. Every other package's `tsconfig.json` extends `@blog/config/tsconfig/base.json`.
3. **cms (Sanity v4):** scaffold with `pnpm create sanity@latest` (TypeScript, the existing project ID/dataset). Place it under `apps/cms`. Define the schemas in §6. Requires **Node 20.19+**.
4. **typegen → types:** create `apps/cms/sanity-typegen.json` so generated output lands in the shared types package:
   ```json
   {
     "path": "./schemaTypes/**/*.{ts,tsx}",
     "generates": "../../packages/types/src/sanity.types.ts"
   }
   ```
   Run `pnpm --filter cms typegen`. Re-export from `packages/types/src/index.ts`.
5. **service:** configure the Sanity client (`next-sanity`), write GROQ queries, and expose typed functions: `getPosts()`, `getPost(slug)`, `getPostsByCategory(slug)`, `getCategories()`, `getAuthor(slug)`, `getPage(slug)`, `getSiteSettings()`. Import result types from `@blog/types`.
6. **ui:** build bottom-up — tokens → atoms → molecules → organisms → templates (§7). Pure components only. Co-locate a `*.test.tsx` with each component.
7. **web:** scaffold with `pnpm create next-app@latest` (App Router, TS, Tailwind) under `apps/web`. Wire `transpilePackages`, Tailwind v4 `@source` (§5), routes, SEO, sitemap, RSS feed. Compose ui + service.
8. **Verify:** `pnpm type-check`, `pnpm test`, and `pnpm build` pass from root. Then deploy (§8).

---

## 5. Cross-cutting requirements

**Tailwind v4 across packages.** The `ui` package's class names live outside the web app and will be purged unless scanned. In the web app's global stylesheet:

```css
@import 'tailwindcss';
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

Both `ui` and `web` must consume the same tokens from `@blog/tailwind-config/theme.css`.

**Type sync.** Generated Sanity types are only as fresh as the last typegen run. `turbo.json` already declares `build.dependsOn: ["typegen"]` — keep it that way so types regenerate before builds.

**Environment variables** (see `.env.example` files):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=        # canonical origin for SEO/sitemap/RSS
SANITY_API_READ_TOKEN=       # drafts/preview only
SANITY_REVALIDATE_SECRET=    # on-demand ISR webhook
```

**CORS:** add `http://localhost:3000` (and the deployed web origin) to the Sanity project's CORS origins in manage.sanity.io.

**Rendering:** use ISR via `client.fetch(query, params, { next: { revalidate: 3600 } })`. Add `app/api/revalidate/route.ts` (verifies `SANITY_REVALIDATE_SECRET`, calls `revalidatePath`/`revalidateTag`) wired to a Sanity webhook so new posts publish without a redeploy.

---

## 6. Content model (Sanity schemas in `apps/cms/schemaTypes`)

**`post`**

- `title` (string, required)
- `slug` (slug, source: title, required)
- `excerpt` (text, required) — summary for cards, meta description, RSS
- `mainImage` (image, with hotspot + required `alt`)
- `author` (reference → `author`, required)
- `categories` (array of reference → `category`)
- `tags` (array of string)
- `publishedAt` (datetime, required)
- `body` (array → block + image + code; Portable Text) — `@sanity/code-input` for code blocks
- `featured` (boolean), `seo` (object `{ metaTitle, metaDescription, ogImage }`)

**`author`** — `name` (required), `slug`, `image`, `bio` (Portable Text), `role`, `socialLinks` (array `{ platform, url }`).

**`category`** — `title` (required), `slug`, `description`.

**`page`** — `title`, `slug`, `body` (Portable Text). For About / generic pages.

**`siteSettings`** (singleton) — `title`, `description`, `tagline`, `logo`, `ogImage`, `navigation` (array `{ label, href }`), `socialLinks` (array `{ platform, url }`).

---

## 7. UI library structure (`packages/ui/src`)

```
atoms/      Button, Tag, Heading, Avatar, Icon, Badge, Prose
molecules/  PostCard (composes Heading + Tag + Avatar + date), AuthorByline,
            SocialLinks, CategoryPill, ShareButtons
organisms/  Hero, PostGrid, Header, Footer, PostMeta, Pagination
templates/  PageLayout, PostLayout (renders Portable Text body), HomeLayout
styles/     tokens.css
index.ts    barrel export
```

Rules: components are typed and prop-driven; no data fetching, no Sanity imports. Document each with JSDoc (makes adding Storybook trivial later). Render Portable Text in `templates`, not `web`. Co-locate unit tests (`Button.test.tsx`) next to components. See the `ui-library-practices` skill.

---

## 8. Deployment

| Workspace | Target                             | Command / setup                                                                                                                         |
| --------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| web       | Vercel (Hobby, free, personal use) | Import repo → set **Root Directory = `apps/web`**. Vercel auto-detects Turborepo and builds `types`/`service`/`ui` first. Add env vars. |
| cms       | Sanity-hosted (free)               | `pnpm --filter cms deploy` → served at `your-project.sanity.studio`                                                                     |

Custom domain on Vercel is the only cost (~£10/yr at the registrar). Hobby has hard caps and no overage billing; blog traffic stays well within them.

---

## 9. Definition of done (acceptance checklist)

- [ ] `pnpm install` succeeds; `pnpm type-check`, `pnpm test`, and `pnpm build` pass from root.
- [ ] Dependency graph is acyclic; `ui` imports no Sanity/`service` code; `service` imports no React.
- [ ] Schema changes flow to `@blog/types` via `pnpm typegen`; `service` functions are fully typed end-to-end.
- [ ] Home page lists posts from Sanity; `/blog/[slug]` renders a post with Portable Text body (incl. code blocks); `/category/[slug]` filters posts.
- [ ] Tailwind classes from `ui` render in `web` (no purge); shared tokens applied in both.
- [ ] ISR works; on-demand revalidation webhook verified.
- [ ] `ui` components have co-located unit tests; `service` query mappers are tested; CI runs `pnpm test`.
- [ ] Lighthouse ≥ 95 across categories; `sitemap.ts` + `robots.ts` + `rss.xml` + per-route metadata present.
- [ ] web deployed to Vercel; cms deployed to `*.sanity.studio`.

---

## 10. Conventions

- TypeScript `strict: true` everywhere; no `any`. Prefer `unknown` + narrowing.
- Server Components by default; `"use client"` only where interaction requires it.
- Keep business/data logic in `service`; keep presentation in `ui`; keep composition in `web`.
- Commit the generated `sanity.types.ts`; regenerate on schema change.
- Conventional commits; one concern per PR/commit. Run the `code-review-practices` skill before opening a PR.

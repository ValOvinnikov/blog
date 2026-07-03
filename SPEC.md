# Blog — Product & Architecture Spec

> Durable reference for the project. The [`IMPLEMENTATION_BRIEF.md`](./IMPLEMENTATION_BRIEF.md) is the build playbook (ordered steps + acceptance gates); this document is the _why_ and the long-lived contract between workspaces. Keep it in sync when architecture changes.

## 1. Product summary

A headless-CMS blog: editors author long-form articles in a Sanity Studio; readers browse a fast, statically-rendered Next.js site. Content is fully typed end-to-end — a schema change in the CMS surfaces as a TypeScript error in the frontend if a consumer is out of date.

**Primary surfaces**

- **Home** — featured + latest posts.
- **Post** (`/blog/[slug]`) — Portable Text article with code blocks, author byline, categories, share links, SEO + structured data.
- **Category** (`/category/[slug]`) — posts filtered by category.
- **Page** (`/[slug]`) — standalone pages (About, etc.).
- **Feeds** — `sitemap.xml`, `robots.txt`, `rss.xml`.

## 2. Architecture principles

1. **Strict layering.** Presentation (`ui`), data (`service`), and composition (`web`) never blur. The dependency graph is acyclic and enforced by the rules in the brief §3.
2. **One source of truth for types.** Sanity schemas generate `@blog/types`; every other package consumes them. No hand-redeclared content shapes.
3. **Portable design system.** `ui` is pure, prop-driven, and free of any Sanity/Next coupling, so it could be extracted to its own npm package without edits.
4. **Server-first.** React Server Components by default; client components only for genuine interactivity (theme toggle, share buttons, mobile nav).
5. **Static + ISR.** Pages are statically generated and revalidated on a timer and on-demand via webhook — no server round-trip on the hot path.

## 3. Layer contracts

| Layer           | Imports                  | Exposes                                                                                                                                                                                                                                                    | Must never                                             |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `@blog/types`   | —                        | Generated Sanity types + shared shapes (`NavLink`, etc.)                                                                                                                                                                                                   | depend on any sibling                                  |
| `@blog/service` | `types`                  | Async typed functions: `getPosts`, `getPost`, `getPostsByCategory`, `getCategories`, `getAuthor`, `getPage`, `getSiteSettings`, `urlForImage`                                                                                                              | import React, return raw Sanity docs                   |
| `@blog/ui`      | `types`                  | Atomic-design components up to organisms (pure, prop-driven). No template layer — page composition belongs in `web`.                                                                                                                                       | import `service`, `sanity`, or fetch data              |
| `web`           | `ui`, `service`, `types` | Routes, metadata, feeds, page composition via Next.js App Router layouts and Server Components. Owns `PortableTextRenderer` — a generic component that maps Sanity block types to `@blog/ui` atoms/molecules via `@portabletext/react` component mappings. | put data logic in components or presentation in routes |
| `@blog/config`  | —                        | tsconfig base, Tailwind preset, eslint config, Vitest preset                                                                                                                                                                                               | contain app logic                                      |

## 4. Data flow

```
Sanity Studio (cms)
      │  schema → typegen
      ▼
@blog/types  ──► @blog/service ──► web (Server Component)
                                     │ fetches typed data
                                     ▼
                                 @blog/ui (props in, markup out)
```

A Server Component calls a `service` function, receives a typed object, and passes plain props to `ui` components. `ui` renders. No layer skips a step.

## 5. Rendering & caching

- **Default:** static generation with `generateStaticParams` for posts/categories.
- **Revalidation:** `fetch(..., { next: { revalidate: 3600, tags: [...] } })` for time-based; `app/api/revalidate` (secret-verified) calls `revalidateTag`/`revalidatePath` from a Sanity publish webhook.
- **Preview/drafts:** `SANITY_API_READ_TOKEN` + Next.js Draft Mode for editor previews (optional, post-MVP).

## 6. SEO & accessibility

- Per-route `generateMetadata` (title, description, canonical, Open Graph, Twitter card).
- `JSON-LD` `Article`/`BlogPosting` structured data on post pages.
- `sitemap.ts`, `robots.ts`, RSS route.
- Semantic HTML, focus states, `alt` text required on `mainImage`, color-contrast tokens. Target Lighthouse ≥ 95 in all categories.

## 7. Quality bar

- TypeScript `strict`, `noUncheckedIndexedAccess`; no `any`.
- Unit tests co-located in `ui` (component rendering/behaviour) and `service` (GROQ result mapping, image URL building) with Vitest + Testing Library.
- ESLint (shared config) + Prettier; CI runs `type-check`, `lint`, `test`, `build`.
- Conventional commits, one concern per PR.

## 8. Tooling: agents & skills

The repo ships Claude Code configuration so contributors (human or AI) stay inside the layer contracts:

- **Subagents** (`.claude/agents/`): `cms`, `service`, `ui`, `web` — each scoped to one workspace and primed with that layer's rules.
- **Skills** (`.claude/skills/`): `develop-feature` (lifecycle + delegation), `add-content-type` (cross-layer recipe), `ui-library-practices`, `testing-practices`, `seo-and-metadata`, `code-review-practices`.
- **Settings** (`.claude/settings.json`): permission allowlist for the project's standard commands (pnpm, turbo, sanity, git, vitest).

## 9. Out of scope (for now)

Comments, search, newsletter signup, i18n, multi-author dashboards, and analytics beyond Vercel's built-in. Each can be layered on without violating the contracts above.

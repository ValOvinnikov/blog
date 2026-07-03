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

| Layer           | Imports                  | Exposes                                                                                                                                       | Must never                                             |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `@blog/types`   | —                        | Generated Sanity types + shared shapes (`NavLink`, etc.)                                                                                      | depend on any sibling                                  |
| `@blog/service` | `types`                  | Async typed functions: `getPosts`, `getPost`, `getPostsByCategory`, `getCategories`, `getAuthor`, `getPage`, `getSiteSettings`, `urlForImage` | import React, return raw Sanity docs                   |
| `@blog/ui`      | `types`                  | Atomic-design components (pure, prop-driven)                                                                                                  | import `service`, `sanity`, or fetch data              |
| `web`           | `ui`, `service`, `types` | Routes, metadata, feeds, composition                                                                                                          | put data logic in components or presentation in routes |
| `@blog/config`  | —                        | tsconfig base, Tailwind preset, eslint config, Vitest preset                                                                                  | contain app logic                                      |

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

## 10. Visual design system — "Console" (Direction A: azure · serif)

> Source of truth: `design-reference/`. That folder is scaffolding — once the design is fully implemented in tokens and components, it can be deleted.

### Identity

| Property       | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Name           | Console                                                            |
| Accent         | Azure — `oklch(0.58 0.17 250)` light / `oklch(0.70 0.16 250)` dark |
| Display / UI   | Space Grotesk 500                                                  |
| Long-form body | Newsreader (serif, italics for blockquotes)                        |
| Chrome / code  | JetBrains Mono                                                     |

Fonts are loaded via `next/font/google` in the web root layout and exposed as CSS custom properties (`--font-display`, `--font-body`, `--font-mono`) on `<html>`. `@blog/ui` references them as Tailwind utilities (`font-display`, `font-body`, `font-mono`).

### Token architecture

Tokens live in two files:

| File                                 | Owned by       | Contains                                                                                                         |
| ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/styles/tokens.css`  | `@blog/ui`     | CSS custom property _values_ — `:root` (light) and `.dark` (dark) blocks                                         |
| `packages/config/tailwind/theme.css` | `@blog/config` | Tailwind v4 `@theme inline` mapping vars → utilities; `@custom-variant dark`; static values (radius, type scale) |

Import order in `apps/web/app/globals.css`:

```css
@import 'tailwindcss';
@import '@blog/config/tailwind/theme.css';
@import '@blog/ui/styles/tokens.css';
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

#### Colour tokens (OKLCH, WCAG AA verified)

| Token                                       | Role                               |
| ------------------------------------------- | ---------------------------------- |
| `--bg` / `--bg-subtle`                      | Page backgrounds                   |
| `--surface` / `--surface-2`                 | Cards / nested / code backgrounds  |
| `--border` / `--border-strong`              | Hairline / emphasis                |
| `--text` / `--text-muted` / `--text-subtle` | Primary / secondary / metadata ink |
| `--accent` / `--accent-hover`               | Links and interactive elements     |
| `--accent-muted`                            | Tint / selection highlight         |
| `--accent-contrast`                         | Text colour on accent backgrounds  |
| `--ring`                                    | Focus ring (= `--accent`)          |

#### Layout & motion tokens

```
--measure: 68ch          prose column width
--gutter: clamp(1rem, 5vw, 2.5rem)
--content-max: 72rem
--section-gap: clamp(3rem, 8vw, 6rem)
--ease: cubic-bezier(0.2, 0, 0, 1)
--dur-fast: 120ms  --dur: 200ms  --dur-slow: 360ms
```

### Dark mode strategy

Dark mode is toggled by adding `.dark` to `<html>` (not `prefers-color-scheme`). This enables instant, persisted switching without a flash.

- `ThemeToggle` (`@blog/ui`, `"use client"`) reads/writes `localStorage.theme` and toggles the class + `colorScheme` on `document.documentElement`.
- A no-flash inline `<script>` in `apps/web/app/layout.tsx` applies the saved preference before React hydrates.
- Tailwind: `@custom-variant dark (&:where(.dark, .dark *))` — variant is `.dark` ancestor, not media query.

### Component visual rules (from design reference)

| Component              | Key visual rules                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button — primary**   | `bg-accent text-accent-contrast`, radius-sm (3 px), Space Grotesk 500 14 px                                                                                                                        |
| **Button — ghost**     | `border-border-strong text-text`                                                                                                                                                                   |
| **Button — link**      | `text-accent underline`, no background                                                                                                                                                             |
| **Tag / CategoryPill** | JetBrains Mono, uppercase, `text-xs`; active: `bg-accent-muted text-accent border-transparent`                                                                                                     |
| **Spec line**          | JetBrains Mono `text-xs`, separators `·`, category link in `text-accent`                                                                                                                           |
| **Prose**              | Newsreader body at `text-base` (1.0625 rem / 1.7 lh), 68 ch max-width; links `text-accent underline`; inline code `bg-surface-2 rounded-sm`; blockquotes left-border `border-accent-muted`, italic |
| **Code block**         | `bg-surface-2 border-border`; filename + copy header in `text-subtle`; syntax via **Shiki** (dual-theme — one theme per colour scheme)                                                             |
| **Post card**          | `bg-surface border-border rounded`; mono metadata line; category in `text-accent`; title Space Grotesk 500                                                                                         |
| **Header brand**       | `val` in Space Grotesk + `.dev` in JetBrains Mono `text-accent`                                                                                                                                    |
| **Nav links**          | JetBrains Mono `text-xs text-subtle`                                                                                                                                                               |

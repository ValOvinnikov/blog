# ROADMAP — Phased Build Plan

> **For the AI agent:** This is the execution plan. Work **one phase at a time, top to bottom**. Do not start a phase until the previous phase's **Acceptance gate** is fully checked. Tick each `- [ ]` to `- [x]` as you complete it and **commit the roadmap change in the same PR** as the work it tracks. If a task can't pass its gate, stop and report rather than proceeding.
>
> **Companion docs:** [`SPEC.md`](./SPEC.md) is the durable _why_ + layer contracts; [`IMPLEMENTATION_BRIEF.md`](./IMPLEMENTATION_BRIEF.md) is the bootstrap detail. This file is the _when_ and the progress ledger. Where they conflict, SPEC wins on architecture, this file wins on ordering.
>
> **Ownership:** each phase names the scoped subagent in `.claude/agents/` that should drive it (`cms`, `service`, `ui`, `web`) plus the relevant skill in `.claude/skills/`.

---

## How to track progress

This file **is** the tracker. The plan and its status live together so there is a single source of truth, reviewable in git history.

- Status legend: `- [ ]` not started · `- [~]` in progress · `- [x]` done · `- [!]` blocked (add a one-line note).
- One concern per commit/PR (matches SPEC §7). When a PR closes a task, flip its box in the same diff.
- A phase is "done" only when every box under its **Acceptance gate** is `- [x]`.
- Optional automation layer (MCP) is described in [Appendix C](#appendix-c--recommended-mcp-servers). If the GitHub MCP is connected, mirror each unchecked task as an Issue and each phase as a milestone; this markdown remains the source of truth.

---

## Hard constraints (never violate — restated from SPEC §3)

```
web → ui, service, db, config
service → config                (Sanity reads; never imports React)
db → config                     (Drizzle/Neon; never imports React or Sanity)
ui → config                     (pure, prop-driven; never imports service, db, or sanity)
cms → config                    (generates types via typegen)
config → consumed by all        (holds generated Sanity types + shared tooling config)
```

> **Note:** the former `@blog/types` package was dissolved into **`@blog/config`** (it now
> holds the generated `sanity.types.ts` alongside the tsconfig/tailwind/eslint/vitest/prettier
> presets). Anywhere older docs say `@blog/types`, read `@blog/config`.

- `ui` is the only publishable package — keep it free of Sanity, Drizzle, Auth, and data fetching.
- `web` is the sole composition point where content (`service`) and engagement (`db`) meet.
- The dependency graph stays **acyclic**. Internal packages use the Just-in-Time pattern (raw TS exports, transpiled by `web`).

---

## Phase summary

| Phase | Outcome                                               | Owner        | Gate in one line                                                   |
| ----- | ----------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| 0 ✅  | Monorepo + tooling foundation                         | web          | `pnpm install / type-check / build` green from root                |
| 1 ✅  | Content core (Sanity → types → service)               | cms, service | Typed posts returned from a GROQ query                             |
| 2 🔄  | Design-system **foundation** (shared primitives only) | ui           | Cross-page atoms built, tested, Sanity-free                        |
| 3     | **Web MVP — ship a live blog, page by page**          | ui + web     | Home → Blog → Post → Category shipped as vertical slices, deployed |
| 4     | Modular pages (page builder)                          | cms, web     | Editor-composed pages render via `<PageBuilder>`                   |
| 5     | Engagement: auth + comments + ratings                 | db, web, ui  | Logged-in users comment & rate; spam controls live                 |
| 6     | Enhancements (search, AI, OG, Storybook)              | all          | Chosen features shipped without breaking contracts                 |

**Execution model for Phases 2–3:** foundation primitives are built once in Phase 2;
everything else is built **just-in-time inside the page slice that first needs it** (Phase 3).
No component is built without a page consuming it. This replaces the old "build the entire
design system, then build the entire web app" ordering.

---

## Phase 0 — Foundation ✅

**Owner:** `web` · **Skill:** `develop-feature` · **Prereq:** none.

- [x] Initialise Turborepo + pnpm workspaces; create `apps/*` and `packages/*` per IMPLEMENTATION_BRIEF §2.
- [x] Build `@blog/config`: `tsconfig/base.json` (`strict: true`, `noUncheckedIndexedAccess`), `tailwind/preset.ts`, `eslint/index.js`, `vitest/preset.ts`.
- [x] Every package's `tsconfig.json` extends `@blog/config/tsconfig/base.json`.
- [x] `turbo.json` pipeline: `build.dependsOn: ["^build", "typegen"]`, plus `type-check`, `lint`, `test`.
- [x] Add `.claude/agents/` (cms, service, ui, web) and `.claude/skills/` per SPEC §8; add `.claude/settings.json` allowlist (pnpm, turbo, sanity, git, vitest, drizzle-kit).
- [x] CI workflow running `type-check`, `lint`, `test`, `build` on PRs.

**Acceptance gate**

- [x] `pnpm install` succeeds; `pnpm type-check` and `pnpm build` pass from root.
- [x] CI is green on an empty/first PR.

---

## Phase 1 — Content core ✅

**Owner:** `cms`, then `service` · **Skill:** `add-content-type` · **Prereq:** Phase 0.

- [x] Scaffold Sanity v4 Studio in `apps/cms` (`pnpm create sanity@latest`, TS). Register `@sanity/code-input`.
- [x] Define schemas (IMPLEMENTATION_BRIEF §6): `post`, `author`, `category`, `siteSettings`. (Modular `page` is Phase 4.)
- [x] Configure typegen → `packages/config/src/sanity/generated/types.ts`; run `pnpm --filter cms typegen`; re-export from `@blog/config`. Commit the generated file.
- [x] Add CORS origins (`http://localhost:3000` + deploy origin) in manage.sanity.io.
- [x] Build `@blog/service`: Sanity client (`next-sanity`), `urlForImage`, GROQ queries + typed functions: `getPosts`, `getPost(slug)`, `getPostsByCategory(slug)`, `getCategories`, `getAuthor(slug)`, `getPage(slug)`, `getSiteSettings`. ISR via `{ next: { revalidate: 3600, tags: [...] } }`.
- [ ] Seed 3–5 real posts + authors + categories in the Studio.

**Acceptance gate**

- [x] Schema changes flow to `@blog/config` via `typegen`; `service` functions are typed end-to-end (no `any`).
- [x] `service` query mappers/`urlForImage` have Vitest tests.
- [x] `service` imports no React.

---

## Phase 2 — Design-system foundation (`@blog/ui`) 🔄

**Owner:** `ui` · **Skill:** `ui-library-practices`, `testing-practices` · **Prereq:** Phase 1 (types only).

Build **only the cross-page primitives** here — the atoms every page reuses. Molecules and
organisms are _not_ built up front; they are built just-in-time inside the Phase 3 page slice
that first needs them (see the execution model above). **There is no template layer in `@blog/ui`**
— page composition is owned by the Next.js App Router, and `PortableTextRenderer` lives in `apps/web`
(the template issues #57–59 were closed for this reason; see SPEC).

- [x] `styles/tokens.css` consuming `@blog/tailwind-config/theme.css` (colours, spacing, type scale, contrast-safe).
- [x] Shared `Size` constant + `TValueOf`/`TSize` types in `@blog/config` (no repeated size string literals).
- [ ] Foundation atoms:
  - [x] `Button`
  - [x] `Tag`
  - [x] `Heading`
  - [x] `Avatar`
  - [x] `ThemeToggle`
  - [ ] `Badge`
  - [ ] `Prose`
- [ ] JSDoc on every component; co-located `*.test.tsx` (render + behaviour).
- [x] Barrel `index.ts` (atoms).

> `Icon` was dropped — use `lucide-react` directly (matches how `ThemeToggle` already consumes icons).

**Acceptance gate**

- [x] `@blog/ui` imports nothing from `service`/`db`/`sanity` (grep + lint rule).
- [ ] All foundation atoms are prop-driven, tested, and exported from the barrel.
- [ ] Unit tests pass; coverage on interactive components.

---

## Phase 3 — Web MVP (ship a live blog, page by page) ⭐

**Owner:** `ui` + `web` · **Skill:** `develop-feature`, `ui-library-practices`, `seo-and-metadata` · **Prereq:** Phases 1–2.

This is the milestone with a public URL. It ships as **vertical slices**: each slice builds the
`ui` components that page needs (in dependency order `atom → molecule → organism`), then integrates
the route in `web` and its metadata. Later slices **reuse** components built by earlier ones and add
only what's new. Deploy happens once, at the end (3e).

**Composition rule (every slice):** Server Components fetch via `service`, pass plain props into
`ui`. No GROQ or data logic inside components. `ui` stays Sanity-free.

### 3.0 — Web app scaffold (once)

- [ ] Scaffold `apps/web` (`pnpm create next-app@latest`, App Router, TS, Tailwind) — if not already present. Wire `transpilePackages: ["@blog/ui","@blog/service","@blog/config"]`.
- [ ] Tailwind v4 `@source "../../../packages/ui/src/**/*.{ts,tsx}"` in the global stylesheet so `ui` classes aren't purged; both `web` and `ui` consume the shared preset.

### 3a — Home page (`/`)

- [ ] `ui` components (build only if missing): `NavLink` (atom), `Header` (organism, nav + `ThemeToggle`), `Footer` (organism), `PostCard` (molecule), `PostGrid` (organism), `Hero` (organism).
- [ ] `web`: `app/page.tsx` — featured + latest, fetched via `service`, composed from the above.
- [ ] Per-route `generateMetadata` (canonical, OG, Twitter).

### 3b — Blog list (`/blog`)

- [ ] `ui`: `Pagination` (organism). Reuse `PostGrid` + `PostCard`.
- [ ] `web`: `app/blog/page.tsx` — paginated list; `generateMetadata`.

### 3c — Post detail (`/blog/[slug]`)

- [ ] `ui`: `PostMeta` (molecule — author, date, reading time), `AuthorByline` (molecule), `ShareButtons` (molecule), `Prose` (atom if not already built).
- [ ] `web`: `PortableTextRenderer` (generic component in `apps/web`, maps Sanity blocks → `ui` + code blocks), `app/blog/[slug]/page.tsx`; `generateStaticParams`; `Article`/`BlogPosting` JSON-LD.

### 3d — Category (`/category/[slug]`)

- [ ] Reuse `PostGrid` + `PostCard` + `Pagination` (expect zero new components).
- [ ] `web`: `app/category/[slug]/page.tsx` — filtered; `generateStaticParams`; `generateMetadata`.
- [ ] `/[slug]` placeholder route reserved for Phase 4.

### 3e — Ship (SEO surface + ISR + deploy)

- [ ] Site-wide SEO: `sitemap.ts`, `robots.ts`, `rss.xml`.
- [ ] ISR + on-demand `app/api/revalidate/route.ts` (verify `SANITY_REVALIDATE_SECRET`, `revalidateTag`/`revalidatePath`) wired to a Sanity publish webhook.
- [ ] Deploy `web` to Vercel (Root Directory `apps/web`, env vars); deploy Studio via `pnpm --filter cms deploy`. _(human-gated)_

**Acceptance gate**

- [ ] Home/list/detail/category render real Sanity content; code blocks render.
- [ ] Every new `ui` component from a slice is prop-driven, tested, and barrel-exported; `ui` stays Sanity-free.
- [ ] ISR works; revalidation webhook verified (publish → live without redeploy).
- [ ] Lighthouse ≥ 95 across categories; feeds + per-route metadata present.
- [ ] `web` live on Vercel; Studio live on `*.sanity.studio`.

---

## Phase 4 — Modular pages (page builder)

**Owner:** `cms`, then `web` · **Skill:** `add-content-type` · **Prereq:** Phase 3.

Uses the schemas already drafted (`apps/cms/schemaTypes/objects/pageModules.ts`, `documents/page.ts`) and the renderer (`apps/web/components/page-builder.tsx`).

- [ ] Register `page` + `...pageModules` in `apps/cms/schemaTypes/index.ts`; rerun `typegen`; commit types.
- [ ] Confirm modules in Studio: hero, richText, featureGrid, cta, postsList, gallery, faq, newsletter — with insert-menu previews.
- [ ] `service`: add `getPage(slug)` enrichment that resolves `module.postsList` references into `resolvedPosts` (latest/featured/category/manual). Keep GROQ in `service`.
- [ ] `@blog/ui`: add the section components the renderer maps to (`FeatureGrid`, `CtaBanner`, `Gallery`, `Faq`, `NewsletterSignup`) — still pure/prop-driven.
- [ ] `web`: catch-all `app/[slug]/page.tsx` reads `page.template` (`default`/`landing`/`wide`) to pick a **web-side layout** (App Router layout or a local wrapper — _not_ a `@blog/ui` template) and renders `<PageBuilder>`; add `generateStaticParams` + metadata from `page.seo`.
- [ ] Author an About page and one landing page from modules to prove the flow.

**Acceptance gate**

- [ ] Editors compose a page from modules; it renders with correct template/layout.
- [ ] `postsList` posts are resolved server-side (no fetching in components).
- [ ] New section components have tests; layering intact (`ui` Sanity-free).

---

## Phase 5 — Engagement: auth + comments + ratings (Drizzle + Neon)

**Owner:** `db` (new package), then `web`, then `ui` · **Skill:** `develop-feature`, `testing-practices` · **Prereq:** Phase 3 (Phase 4 optional).

New data domain. Sanity stays the read path; relational engagement data lives in **Neon Postgres** via **Drizzle**, in a new `packages/db` that obeys the same contract as `service` (typed async fns, no React, no Sanity). Post pages stay static; comments/ratings load as a **dynamic island**.

### 5a — Database layer (`packages/db`)

- [ ] Create Neon project (or via Neon MCP — see Appendix C); add `DATABASE_URL` (pooled) + `DATABASE_URL_UNPOOLED` (direct, for migrations).
- [ ] Scaffold `packages/db`: deps `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`; client via `drizzle-orm/neon-http`.
- [ ] `schema.ts`:
  - Auth.js adapter tables: `users`, `accounts`, `sessions`, `verificationTokens`.
  - `comments`: id, `postId` (Sanity `_id`, string — cross-store ref, not FK), `userId`, `body`, `status` (`pending`|`approved`|`spam`), `parentId` (nullable, threads), `createdAt`.
  - `ratings`: `userId` + `postId` with a **composite unique constraint** (one rating per user per post), `value` (1–5), `createdAt`.
- [ ] `queries.ts` typed fns: `getComments(postId)` (approved only, threaded), `addComment(...)`, `setStatus(...)`, `getRatingSummary(postId)` (avg + count via SQL aggregate), `setRating(...)` (upsert on the unique key).
- [ ] `drizzle.config.ts` → Neon (unpooled DSN); generate + run first migration (`drizzle-kit generate` → `drizzle-kit migrate`). Commit migration SQL.

### 5b — Auth (`web`)

- [ ] Add Auth.js (NextAuth v5) + `@auth/drizzle-adapter` pointed at `packages/db`; providers GitHub + Google; `AUTH_SECRET` set; sessions in Neon.
- [ ] Login/logout UI in `Header`; gate comment + rating actions behind a session.

### 5c — API + UI

- [ ] Route Handlers (or server actions): `POST /api/comments`, `GET /api/comments?postId=`, `POST /api/ratings` — all require a session; validate + length-cap input.
- [ ] Rate limiting on write endpoints (Upstash Redis free tier; `UPSTASH_REDIS_REST_URL/TOKEN`).
- [ ] `@blog/ui` (pure, callback-driven): `CommentList`, `CommentForm`, `RatingStars` — data + `onSubmit`/`onRate` props only.
- [ ] `web`: mount comments/ratings as a client island on `/blog/[slug]`; keep the article statically rendered. Cache the rating **aggregate** with a tag and `revalidateTag` on write.
- [ ] Moderation: new comments default to `pending`; surface an approval queue (simple `/admin` behind auth, or a Sanity-side note) → flip to `approved`.

### Spam/abuse controls (cheapest first)

- [ ] Login required (kills anonymous spam).
- [ ] DB unique `(userId, postId)` on ratings.
- [ ] Endpoint rate limiting.
- [ ] Server-side validation + length caps; `pending` default.
- [ ] (Optional) Akismet or Perspective toxicity check before insert.

**Acceptance gate**

- [ ] Logged-in user can comment and rate; logged-out cannot.
- [ ] One rating per user per post enforced at the DB level.
- [ ] `packages/db` imports no React/Sanity; queries are typed; mappers tested.
- [ ] Article remains statically generated; only the engagement island is dynamic.
- [ ] Rate limiting + moderation status verified.

---

## Phase 6 — Enhancements (pick by portfolio value)

**Owner:** varies · **Prereq:** Phase 3+ (each independent).

- [ ] **AI: semantic search / related posts** — embed post bodies, store vectors in Neon `pgvector`, serve NL search + "related articles". (Highest-signal; doubles as the AI feature.)
- [ ] **Publish `@blog/ui` to npm + Storybook** — JSDoc already in place; standalone design-system artifact.
- [ ] **Sanity Presentation / visual editing + Draft Mode** — live editor preview.
- [ ] **Dynamic OG images** via `@vercel/og` (per-post social cards).
- [ ] **Reading time + auto table of contents** from Portable Text headings.
- [ ] **Newsletter** (Resend + `subscribers` table — reuses Phase 5 infra).
- [ ] **Lighthouse CI + visual regression** (Playwright/Chromatic) in CI.
- [ ] **Bookmarks/likes** tied to the same auth.

**Acceptance gate (per feature)**

- [ ] Ships without violating the dependency graph; tests added; CI green.

---

## Appendix A — Environment variables (extends IMPLEMENTATION_BRIEF §5)

```
# Content (Phase 1+)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=
SANITY_API_READ_TOKEN=          # drafts/preview only
SANITY_REVALIDATE_SECRET=       # on-demand ISR webhook

# Engagement (Phase 5)
DATABASE_URL=                   # Neon pooled
DATABASE_URL_UNPOOLED=          # Neon direct (migrations)
AUTH_SECRET=                    # Auth.js
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
UPSTASH_REDIS_REST_URL=         # rate limiting (optional)
UPSTASH_REDIS_REST_TOKEN=
```

## Appendix B — Definition of done (whole project)

- [ ] `pnpm install / type-check / lint / test / build` pass from root; CI enforces all.
- [ ] Acyclic graph; `ui` Sanity/db-free; `service` + `db` React-free.
- [ ] Static blog (home/list/detail/category) live; modular pages live; comments + ratings behind auth live.
- [ ] Lighthouse ≥ 95; sitemap/robots/RSS + per-route metadata + JSON-LD present.
- [ ] `web` on Vercel; `cms` on `*.sanity.studio`; Neon connected.

## Appendix C — Recommended MCP servers (optional automation)

These let Claude Code drive tracking and DB ops from the CLI. The markdown checkboxes above remain the source of truth.

- **GitHub MCP** (`github/github-mcp-server`, official) — create/close Issues, manage PRs and project boards from the terminal, tied to commits. Simplest add (Claude Code, HTTP transport):
  ```
  claude mcp add -s user --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer <PAT>"
  ```
  Then mirror phases → milestones and tasks → issues.
- **Neon MCP** (`neondatabase/mcp-server-neon`, official) — create the project, branch per phase/preview, and run Drizzle migrations safely (prepare on a temp branch → test → commit). Quick add: `npx neonctl@latest init`, or the remote OAuth server.
- Keep both **project-scoped** in `.mcp.json` where shared, or `--scope user` for personal use. Add allowlist entries in `.claude/settings.json`.

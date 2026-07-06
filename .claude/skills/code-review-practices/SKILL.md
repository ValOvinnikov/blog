---
name: code-review-practices
description: >-
  Project-specific code-review checklist for this blog monorepo. Use before
  opening a PR or when reviewing a diff — to verify layer boundaries, type
  safety, the Sanity→types→service→ui→web data flow, SEO, accessibility, and
  test coverage. Apply when reviewing or self-reviewing changes in this repo.
---

# Code review practices

Review against the contracts in `SPEC.md` and `IMPLEMENTATION_BRIEF.md`. The
architecture is the deliverable, so boundary violations are blocking, not nits.

## 1. Layer boundaries (blocking)

- `@blog/ui` imports **no** `service`, `sanity`, `next-sanity`, or `fetch`. Pure
  props in, markup out.
- `@blog/service` imports **no** React and nothing from `@blog/ui`. It is the
  only package importing the Sanity SDKs.
- `apps/web` is the only place `ui` and `service` meet: Server Components fetch
  via `service`, pass typed props to `ui`. No GROQ or raw Sanity client in `web`.
- Dependency graph stays acyclic: `web → ui/service/types`, `service → types`,
  `ui → config`, `cms → types (via typegen)`.

## 2. Type safety (blocking)

- No `any`; `unknown` is narrowed. `strict` + `noUncheckedIndexedAccess` honoured.
- `@blog/service` uses generated types from `sanity.types.ts` — no hand-redeclared
  content shapes. `@blog/ui` defines its own prop types; it does not import from
  `@blog/service` or depend on service view-models.
- If schemas changed, `sanity.types.ts` was regenerated (`pnpm typegen`) and
  committed, and downstream `service` types updated.
- Every field the CMS schema marks `.required()` has `.notNull()` in the
  corresponding `service` groqd projection. Optional fields use plain
  `sub.field()` with no fallback sentinel.

## 3. Rendering & data

- Server Components by default; `"use client"` only where interaction needs it.
- ISR present (`next: { revalidate, tags }`); revalidate route verifies the
  secret. No accidental fully-dynamic rendering of static content.
- Queries project only needed fields; no over-fetching.

## 4. SEO & accessibility

- Per-route `generateMetadata` (canonical, OG, Twitter); JSON-LD on posts.
- `sitemap.ts` / `robots.ts` / RSS still valid after route changes.
- Semantic HTML, image `alt`, focus-visible, color contrast via tokens.

## 5. Styling

- Token utilities from the shared preset, not raw hex. Dark mode intact.
- New `ui` class names are reachable by the web app's `@source` glob.
- No raw Tailwind class strings inline in JSX — in `@blog/ui` **and**
  `apps/web` alike. Classes live in a co-located `{component}-variants.ts`
  via `tv()` from `tailwind-variants`. No standalone `clsx` or `tailwind-merge`
  usage. Exception: `next/font` variable class names in `layout.tsx`.
- Responsive classes are mobile-first, using only `md:`/`lg:` as the primary
  tiers (no custom `--breakpoint-*`).

## 6. Tests & stories

- New/changed `ui` components have a co-located `*.test.tsx` and a Storybook
  story (follow `ui-storybook` skill). Both are required, not optional.
- New/changed `service` functions have a co-located `*.test.ts`.
- Bug fixes include a regression test that failed before the fix.
- `pnpm test` green.

## 7. Hygiene

- Conventional commit, one concern per PR. No stray `console.log`, no committed
  secrets/`.env`. `pnpm type-check`, `lint`, `test`, `build` pass from root.

## How to run a review here

1. `git diff` the branch; map each changed file to its layer.
2. Walk sections 1–7; flag boundary/type issues first (blocking) then quality.
3. For deeper automated passes, the built-in `/code-review` skill complements
   this checklist — this one encodes _our_ boundaries; that one finds general
   correctness bugs.

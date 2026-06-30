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
  `ui → types`, `cms → types (via typegen)`.

## 2. Type safety (blocking)
- No `any`; `unknown` is narrowed. `strict` + `noUncheckedIndexedAccess` honoured.
- Content shapes come from `@blog/types` (generated). No hand-redeclared shapes.
- If schemas changed, `sanity.types.ts` was regenerated (`pnpm typegen`) and
  committed, and downstream `service` types updated.

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

## 6. Tests
- New/changed `ui` components and `service` functions have co-located tests.
- Bug fixes include a regression test. `pnpm test` green.

## 7. Hygiene
- Conventional commit, one concern per PR. No stray `console.log`, no committed
  secrets/`.env`. `pnpm type-check`, `lint`, `test`, `build` pass from root.

## How to run a review here
1. `git diff` the branch; map each changed file to its layer.
2. Walk sections 1–7; flag boundary/type issues first (blocking) then quality.
3. For deeper automated passes, the built-in `/code-review` skill complements
   this checklist — this one encodes *our* boundaries; that one finds general
   correctness bugs.

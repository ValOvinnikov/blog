---
name: add-content-type
description: >-
  End-to-end recipe for adding or extending a content type across every layer of
  this blog monorepo — Sanity schema → typegen → @blog/types → @blog/service
  query → @blog/ui component → apps/web route. Use whenever a feature touches
  more than one workspace, so boundaries and the type flow stay intact.
---

# Add a content type (end-to-end)

This is the cross-layer recipe. It's the procedure most likely to leak a boundary
(fetching in `ui`, hand-writing a type, GROQ in `web`), so follow the order and
let each layer's agent own its step. Architecture rules live in `SPEC.md` /
`IMPLEMENTATION_BRIEF.md`.

## The flow (always this direction)

```
cms (schema) ──typegen──► @blog/types ──► @blog/service ──► apps/web ──props──► @blog/ui
```

Build in dependency order. Never skip a layer; never reverse the arrows.

## Step 1 — Schema (`apps/cms`)  · agent: `cms`
- Define/extend the type in `apps/cms/schemaTypes` with `defineType`/`defineField`.
- Add `validation: rule => rule.required()` on any field consumers will assume;
  images get `options: { hotspot: true }` + a required `alt`.
- Register it in the schema index (and desk structure if it's a singleton).
- If any `defineType`/`defineField`/`defineArrayMember` option or the typegen
  workflow is uncertain, use the `use-context7` skill to fetch Sanity v4 docs
  before writing schema code.

## Step 2 — Typegen (`apps/cms`)  · agent: `cms`
- Run `pnpm --filter cms typegen`. Confirm the shape appears in
  `packages/types/src/sanity.types.ts`. **Commit the generated file.**
- Re-export from `packages/types/src/index.ts` if you expose a named shape.
- Do not hand-write the content type anywhere — typegen is the source of truth.

## Step 3 — Data access (`packages/service`)  · agent: `service`
- Add a GROQ query (`defineQuery`) projecting only the needed fields, and a typed
  async function exported from `src/index.ts`.
- Return types derive from `@blog/types`; no `any`. **No React import.**
- Use `client.fetch(query, params, { next: { revalidate, tags } })` for ISR.
- Add a co-located `*.test.ts` (node env) mocking the client.

## Step 4 — Presentation (`packages/ui`)  · agent: `ui`
- Build the component(s) at the right Atomic layer; pure and prop-driven.
- **No `service`/`sanity`/`fetch` imports** — accept plain typed props from
  `@blog/types`. Render Portable Text in `templates`.
- Token utilities only; forward `className`; JSDoc; co-locate a `*.test.tsx`.
- Export from the `src/index.ts` barrel.

## Step 5 — Composition (`apps/web`)  · agent: `web`
- Add/extend the route. The Server Component calls the `service` function and
  passes plain props into the `@blog/ui` component. **No GROQ, no Sanity client,
  no inline presentation here.**
- `generateStaticParams` + `generateMetadata` for new routes; update
  `sitemap.ts` / RSS if the content is publicly listed.
- If a new field affects published content, ensure the revalidate webhook covers
  it (right tag/path).

## Step 6 — Verify
- `pnpm typegen` (clean), then from root: `pnpm type-check`, `pnpm lint`,
  `pnpm test`, `pnpm build`. All green.
- Run the `code-review-practices` skill over the diff before opening the PR.

## Boundary checklist (the whole point)
- [ ] Type came from typegen, not hand-written.
- [ ] `service` has no React; `ui` has no `service`/`sanity`/`fetch`.
- [ ] `web` has no GROQ/Sanity client and no presentation that belongs in `ui`.
- [ ] Tests added at the `service` and `ui` layers; metadata/feeds updated.

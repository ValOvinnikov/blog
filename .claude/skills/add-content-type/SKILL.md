---
name: add-content-type
description: >-
  Use when a change spans more than one workspace — above all adding or
  extending a Sanity document, module or object whose shape has to reach
  @blog/config typegen, @blog/service, @blog/ui and apps/web.
---

# Add a content type (end-to-end)

The cross-layer procedure most likely to leak a boundary — a fetch in `ui`, a
hand-written type, GROQ in `web`. Each layer's agent owns its step; this file
says what each step hands the next. The lifecycle around it is
`develop-feature`; data flow is `SPEC.md` §5, the content model §6.

```
studio (schema) ──typegen──► @blog/config ──► @blog/service ──► apps/web ──props──► @blog/ui
```

- Never reverse an arrow. Build order is `studio → service → ui → web`,
  skipping untouched layers; a new stored-value constant is a `config`
  dispatch first. One PR per layer, merged before the next starts → CLAUDE.md
  "One layer at a time".
- The plan carries Copy and Manual test (CLAUDE.md "Say what it touches before
  starting"). The content-model change updates or creates its `docs/features/`
  page (CLAUDE.md "Feature docs"), plus any `SPEC.md` §6 entry for that shape
  ("Spec sync").

## 1. Schema + typegen — `packages/studio` · `studio`

- **Migration check first** → CLAUDE.md "Check for migrations": an existing
  shape changing needs a plan put to the user; additive optional-only needs
  none — say so.
- Conventions → `.claude/agents/studio.md`, `studio-schema-practices`. Most
  often missed: registering the type in its group's `index.ts`, and its desk
  entry — a `{ schema }` in `src/structure/sections/<section>-section.ts` for a
  document, or one entry in `src/structure/module-kinds/module-kinds.ts` for a
  module (heroes: the Heroes group in `sections/modules-section.ts`) →
  studio.md "The desk". A module missing from `module-kinds.ts` is also
  missing from `modulesField`'s insert menu.
- **The studio PR for a new `module_*` carries these, or `type-check` reds:**
  its `REVALIDATE_TAGS` key in
  `apps/web/src/utils/revalidate-tags/revalidate-tags.ts` (exhaustive over
  module types → `SPEC.md` §6, `docs/context/content-model.md`), and — when a
  template's `modulesField({ extend })` or `heroField({ allow })` (or
  `page_post`'s `modulesField`) admits it — that page's assertion in
  `packages/config/src/types/page-module.test.ts`.
- When the schema is done, `pnpm --filter @blog/studio typegen` once, re-run
  until the diff is minimal, and commit
  `packages/config/src/sanity/generated/` with it.

## 2. Data access — `packages/service` · `service`

- `src/features/<domain>/<name>/`: groqd query with explicit `sub.field()`
  projections, thin loader, transformer to a view-model with no faked
  defaults, a `{ v1: { … } }` action in `safeAsync` on the `src/index.ts`
  facade → `.claude/agents/service.md`. Types derive from the generated types
  or `InferResultType`; no React.
- `runQuery(query, { parameters, tenant, ...isr(tags, tenant.projectId) })`
  tags every `_type` the query reads, dereferenced ones included (`isr()`'s
  doc comment). A tag absent from `REVALIDATE_TAGS`' values fails
  `pnpm check:revalidate-tags-sync`, but that check only proves the tag exists
  somewhere.
- **A new cached document `_type` gets its own `REVALIDATE_TAGS` key and a
  `TCachedDocumentType` entry** in the PR that first tags it. Nothing fails
  without them, and an unmapped type purges nothing on publish.

## 3. Presentation — `packages/ui` · `ui`

- Pure and prop-driven at the right Atomic level: no
  `service`/`sanity`/`fetch`/`next/*`, plain typed props the web view-model
  satisfies structurally. Portable Text is composed in `apps/web`
  (`@web/components/shared/portable-text`), never here.
- `react-component-practices`, then `ui-library-practices`. The folder's
  `index.ts` exports the component and its props type; consumers import
  `@blog/ui/components/<level>/<name>` (no root barrel). Every new or changed
  component gets a story (`ui-storybook`).

## 4. Composition — `apps/web` · `web`

- A module: `src/modules/<name>/` (`<name>-module.tsx` fetches,
  `<name>-module-view.tsx` renders) plus an entry in the map of every allowing
  `<page>-module-renderer.tsx` — the maps are `Partial`, so a missing entry
  compiles and renders nothing — dispatched by `renderModules` /
  `renderHeroModule`. A routed document: a route under
  `src/app/[tenant]/[locale]/`. → `.claude/agents/web.md`.
- The Server Component calls `service.<domain>.<name>.v1.*`, checks
  `ok && data`, passes plain props to `@blog/ui`. No GROQ, no Sanity client.
- `dataTestId` on each `@blog/ui` component an E2E test targets: stable
  kebab-case scoped to the page or section (`post-article-header`).
- A new route: `generateMetadata`, plus `sitemap.ts` and RSS when publicly
  listed → `seo-and-metadata`.

## 5. Test, verify, review

`develop-feature` §4–6: `test-writer` covers each layer's new code after
implementation; the orchestrator runs `pnpm typegen`, then dispatches
`verify-runner` with `pnpm verify`; `reviewer` (`code-review-practices`), plus
`a11y-reviewer` for ui/web components and `seo-auditor` for a new route,
metadata or feed.

## Boundary checklist

- [ ] Type from typegen, generated files committed; nothing hand-written.
- [ ] Existing-shape change has a migration plan (dry-run → backup →
      human-gated run).
- [ ] Every new `module_*` and cached document `_type` has its
      `REVALIDATE_TAGS` key (a document: its `TCachedDocumentType` entry too).
- [ ] `service` has no React; `ui` has no `service`/`sanity`/`fetch`/`next/*`;
      `web` has no GROQ, Sanity client or presentation that belongs in `ui`.
- [ ] Metadata, sitemap and feeds updated; manual-test issue filed; feature
      doc updated or created; `SPEC.md` §6 synced.

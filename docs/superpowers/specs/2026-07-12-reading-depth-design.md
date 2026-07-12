# Choose-Your-Depth Reading — Design Spec

**Status:** Approved design (not yet implemented).
**Date:** 2026-07-12
**Related:** backlog M3.3 (`docs/BACKLOG.md`), #76/#90 (post detail route —
hard prerequisite), M1 deploy milestone + M1.4 revalidation webhook (pipeline
prerequisite), `cms-schema-practices` skill (quality bar), M3.2 (publish-time
generation — this spec implements its first slice).

## Goal

Every post renders at three reader-selectable depths — **30s skim / standard
read / deep dive** — as a persistent control on the post page. This is the
blog's flagship differentiator: no mainstream blog has it, it showcases the
content architecture (purpose: engineering showcase), and skim-ability +
"come back for the deep dive" serve return visits (purpose: audience growth).

Decisions locked during brainstorming:

1. **Flagship:** depth toggle (agent-native MCP, living posts, generative
   identity stay in the backlog behind it).
2. **Content source:** AI drafts the skim at publish; a human edits/approves
   in Studio before it goes live. Deep-dive asides are fully authored (AI
   aside-suggestions are V1.1, out of scope here).
3. **Data model:** one portable-text body with inline `aside` blocks +
   a post-level generated `skim` field — **additive only, no migration**.

## Non-goals (V1)

- Aside suggestions from AI (V1.1).
- Backfill automation for existing posts (V1.1 — the endpoint will support
  it; the batch script is later).
- Per-section skim, reader-lens variants, or extending `modules[]` to posts.
- Any AI call on the reader path — depths are fully static.

## Reader experience

- A three-state segmented control — `30s / Read / Deep` — near the post
  title. `READ` is the default and is exactly the article as written.
- `SKIM`: replaces the body with a takeaways panel (3–7 bullets, reading-time
  note, a "read the full article" affordance that switches to `READ`).
- `DEEP`: the `READ` body plus inline asides expanded in place, visually
  distinct and kind-labelled ("Why not X" / "Digression" / "Context").
- Choice persists across posts via `localStorage` (same pattern as the theme
  toggle; no flash — a `data-depth` attribute is applied by the provider).
- All three depths ship in the same static HTML; switching is client-side
  show/hide. ISR, canonical URL, and SEO are untouched — crawlers see the
  standard article; no duplicate-content risk.
- **Graceful degradation:** no approved skim → no `30s` option; no asides →
  no `Deep` option; a post with neither renders exactly as today (the toggle
  hides entirely).

## Content model (`apps/cms` — additive, no migration)

New shared object **`aside`** (registered as a block type in the post body's
portable-text array; authored inline where it belongs):

| Field  | Type        | Rules                                     |
| ------ | ----------- | ----------------------------------------- |
| `kind` | string      | required; radio; values from `ASIDE_KIND` |
| `body` | `blockText` | required                                  |

Preview: kind label + first words of body.

New optional field on **`post`** — **`skim`** (object):

| Field         | Type       | Rules                                    |
| ------------- | ---------- | ---------------------------------------- |
| `takeaways`   | `string[]` | 3–7 items, each ≤ 160 chars              |
| `generatedAt` | datetime   | set by the pipeline; read-only in Studio |
| `model`       | string     | set by the pipeline; read-only in Studio |

Publishing the post **is** the approval step for `skim` — the pipeline only
ever writes to the draft.

New constants in `@blog/config` (`constants/`), UPPERCASE key/value per
convention (new stored values, so the rule applies cleanly):

```ts
export const DEPTH = { SKIM: 'SKIM', READ: 'READ', DEEP: 'DEEP' } as const;
export const ASIDE_KIND = {
  WHY_NOT: 'WHY_NOT',
  DIGRESSION: 'DIGRESSION',
  CONTEXT: 'CONTEXT',
} as const;
```

Schema `options.list`, the renderer, and the pipeline all import these — no
repeated literals (`cms-schema-practices`). Additive/optional-only change:
**no content migration needed** (state this in the PR).

## Generation pipeline (skim only)

```
Sanity webhook (post publish)
  → POST /api/generate-skim   (apps/web route handler, secret-verified —
     same pattern as the M1.4 revalidate route)
  → fetch the published post body (service read path)
  → Claude claude-haiku-4-5 → 3–7 takeaways (zod-validated JSON)
  → patch `skim` onto the post's *draft* via a scoped Sanity write token
  → editor edits/approves in Studio → publishes → normal revalidate
```

- The Anthropic call lives behind one small module (`apps/web/src/server/…`)
  so tests can mock it; the route handler stays thin.
- Regeneration: manual re-trigger (re-publish, or a Studio document action —
  optional nicety, not required for V1).
- Idempotency: re-running overwrites only the draft `skim` field; it never
  touches published content or other fields.
- Cost: fractions of a cent per post; zero runtime cost for readers.

### Env (server-only; declare in turbo.json `env` + the t3 env schema)

| Variable                 | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `ANTHROPIC_API_KEY`      | skim generation                               |
| `SANITY_API_WRITE_TOKEN` | draft patch (scoped robot token)              |
| `SANITY_GENERATE_SECRET` | webhook verification for `/api/generate-skim` |

All optional in the env schema: absent → the pipeline route returns 503 and
the site is unaffected (feature-flag-by-absence, same stance as
`SANITY_REVALIDATE_SECRET`).

## Layer responsibilities

- **`@blog/config`:** `DEPTH`, `ASIDE_KIND` constants; regenerated types pick
  up `aside` + `skim`.
- **`cms`:** `aside` object + `skim` field + Studio previews. Additive only.
- **`@blog/service`:** project `skim` (optional field) and `body[]` as today
  (asides are just PT blocks). View-model adds `TPostDetail.skim?: string[]`
  and `TPostDetail.hasAsides: boolean` — `hasAsides` computed in the
  transformer so `web`/`ui` never scan the body. No faked defaults.
- **`@blog/ui`** (pure, no `'use client'`): `SegmentedControl` atom (fully
  prop-driven — options, value, and change affordance owned by the caller)
  and `Aside` molecule (kind label + children, tokens only). Stories + tests
  per `ui-storybook`/`testing-practices`.
- **`apps/web`** (owns all interactivity): `DepthProvider` (client;
  `localStorage`; sets `data-depth` on a wrapper), `DepthToggle` client leaf
  composing `SegmentedControl`, skim panel section, one new
  `PortableTextRenderer` mapping (`aside` → deep-only wrapper rendering the
  `Aside` molecule), `/api/generate-skim` route. The `frontend-design` skill
  drives the toggle's and asides' visual treatment.

## Error handling

- Generation failure (API error, malformed output): zod-reject, log, leave
  the draft untouched; the post publishes without skim. Non-blocking always.
- Invalid/missing webhook secret → 401; missing env → 503.
- Renderer treats unknown `aside.kind` values as `CONTEXT` (forward-compat).

## Testing

- **service:** transformer tests for `skim` passthrough and `hasAsides`.
- **web:** renderer shows/hides asides per depth; toggle persists and
  restores; skim panel hidden when `skim` absent; `generate-skim` route unit
  tests (mock Anthropic + Sanity write client; 401 on bad secret; 503 on
  missing env; draft-only patch asserted; re-run idempotent).
- **ui:** `SegmentedControl` + `Aside` component tests + stories.

## Rollout order

1. **Render path first** (config → cms/typegen → service → ui → web): the
   feature is fully usable with hand-written skim + asides before any AI
   infra exists — it demos immediately.
2. **Pipeline second** (route + webhook + tokens): needs M1 deploy for the
   webhook; can be exercised locally via curl before that.

Prerequisite sequencing overall: Phase-3 post route (#76/#90) → this spec's
step 1 → M1 deploy → this spec's step 2.

## V1.1 (explicitly deferred)

Aside suggestions drafted by AI at publish; backfill script batch-calling
`/api/generate-skim` for existing posts; Studio "regenerate skim" document
action.

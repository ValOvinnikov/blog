# Phase 5 — Page template + `modules[]` + `module_hero` — Plan

> Part of #242 · sub-issue **#250** · master plan
> `docs/superpowers/plans/2026-07-10-cms-schema-restructure-plan.md`.

**Goal:** Restructure `homePage`'s flat hero + latest-posts fields (and the
generic `page` body) into an ordered `modules[]` array of `module_*` blocks,
migrating existing content — **without changing the rendered output**.

## Key architectural decision — preserve the view-model

The service **resolves the home modules back into the existing `THomePage`
view-model** (`hero` + `latestPostsTitle` + `latestPosts` + `seo`). So this phase
is a **cms authoring/storage restructure + service re-projection**; `@blog/ui`
and `apps/web` are **unchanged** (same trick as Phase 2 / Phase 3's view-models).
Generic "web iterates `modules[]` and renders each block" (the full page builder)
is **deferred** — the generic `page` stays schema-only with no route (per the
earlier decision), so nothing renders its modules yet.

`module_hero` is a **verbatim relocation** of the existing hero fields into an
object (the mode/custom radios + `featuredPost` + `secondaryAction` move as-is) —
not a redesign.

## Migration check

🔴 **Migration required.** Wraps `homePage`'s flat hero/latest-posts fields into
`modules[]`, and `page.body` into a `module_content`. Live data must move.

## Layer sequence

`config` (none) → `cms` (+typegen) → **migration** → `service` (+tests) → verify.
`ui`/`web` **not invoked** (view-model preserved).

---

## Task 1 — CMS: module objects + `modules[]`

**New module objects** (`apps/cms/src/schema-types/modules/`), each `type:'object'`,
`name: 'module_*'`, registered in `modules/index.ts` (currently the empty
Phase-4 placeholder), and re-exported into `schemaTypes`.

- **`module_hero`** — the current homePage hero fields verbatim: `featuredPost`
  (ref post), `heroEyebrowMode`/`heroEyebrow`, `heroTitleMode`/`heroTitle`,
  `heroSubtitleMode`/`heroSubtitle`, `heroImageMode`/`heroImage`,
  `primaryActionLabel`, `secondaryAction` (`link`). Move the `isMode`/`hidden`/
  `validation` helpers into the module (callbacks read `parent`, the module).
- **`module_postList`** — `title` (was `latestPostsTitle`, required max 40),
  `limit` (was `latestPostsLimit`, required int 1–12).
- **`module_content`** — `body` (`portableText`, required) — the generic page body.
- **`module_cta`** — scaffold for the builder palette: `heading` (string, req),
  `body` (`blockText`), `actions` (`link[]`). Available to add, no data yet.

**Documents**

- `homePage`: replace the flat hero + latestPosts fields with
  `modules: array of [module_hero, module_postList, module_cta]`. Keep `title`
  and `seo`. (Drop the `hero`/`latestPosts` fieldsets + the flat fields; `isMode`
  helper moves into `module_hero`.) Seed `initialValue` with a `module_hero` +
  `module_postList`.
- `page`: replace `body` with `modules: array of [module_content, module_cta]`.
  Keep `title`, `slug`, `seo`.
- Regenerate types.

## Task 2 — Migration `apps/cms/migrations/pages-to-modules/index.ts`

- `homePage`: build `modules = [ { _type:'module_hero', _key, ...all hero
fields... }, { _type:'module_postList', _key, title: latestPostsTitle, limit:
latestPostsLimit } ]`; `set('modules', …)`; `unset` every moved flat field
  (featuredPost, hero*, primaryActionLabel, secondaryAction, latestPostsTitle,
  latestPostsLimit).
- `page`: `modules = [ { _type:'module_content', _key, body } ]`; `unset('body')`.
- Per-document patches only (no cross-doc deref) — straightforward. Generate
  `_key`s (stable string). Human-gated (dry → backup → run).

## Task 3 — Service: re-project home from `modules[]`, same output

**Files:** `packages/service/src/features/pages/home/adaptor/{query,transformer}.ts`
(+ fixtures/tests). `types.ts` (`THomePage`) is **unchanged**.

- `query.ts`: project `modules[]` with per-type conditional projections, e.g.
  `modules[]{ _type, _type == "module_hero" => { featuredPost->{…}, heroEyebrowMode,
…, secondaryAction{…} }, _type == "module_postList" => { title, limit } }`
  (groqd conditional-by-`_type` projection). Keep the `homePagePostsQuery`.
- `transformer.ts`: find the `module_hero` and `module_postList` entries in
  `modules[]`; build the **exact same** `THomePage` (`hero` from the hero module
  using the existing mode-resolution logic; `latestPostsTitle`/`latestPosts` from
  the postList module + posts; `seo`). Same defaults/fallbacks as today.
- **`THomePage`, `@blog/ui`, `apps/web` are unchanged** — assert the home page's
  rendered output/metadata is identical.

## Task 4 — Verify + gates

- `pnpm typegen && type-check && lint && test`; grep-confirm no `apps/web`/`@blog/ui`
  changes needed. `web build` needs env → CI.
- Human-gated migration: `migrate:track pages-to-modules` → `dataset:export` →
  `migrate:dry` → `migrate:run`.
- Commit (config/cms/service split) → push → PR `refactor(cms): page template
with modules[] + module_hero (#242 P5)`, `Closes #250`. Set #250 → Code Review.

## Self-review

- Spec coverage: module_hero/postList/content/cta ✔; homePage hero→modules ✔;
  page modular body (schema-only) ✔; migration ✔. `_type` renames stay Phase 6.
- The view-model preservation keeps ui/web out of scope; the only risk is the
  `modules[]` conditional projection + transformer faithfully reproducing the
  current hero resolution — covered by keeping the transformer logic identical,
  just sourced from the hero module instead of flat fields.

## Deferred

- Generic `modules[]` rendering in `apps/web` (the real page builder) — a later
  phase, once the generic `page` gets a route.

## ⚠️ Deploy ordering (as before)

Run `pages-to-modules` on production before deploying.

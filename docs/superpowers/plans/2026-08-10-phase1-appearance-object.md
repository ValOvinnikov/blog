# Phase 1 — Section Appearance Object — Implementation Plan

> **For agentic workers:** execute task-by-task via
> `superpowers:subagent-driven-development`. **This repo delegates every layer
> file to its owning subagent** (`config`/`cms`/`service`/`ui`/`web`, +
> `test-writer`) — so each task below is a **dispatch** with exact files,
> contracts, and acceptance tests, **not** pre-authored code the orchestrator
> writes to disk. Follow `develop-feature` for the gate sequence.

**Goal:** Give every page-builder module an optional, additive `appearance`
object (background tone, spacing, container width, alignment, divider) that a
pure `@blog/ui` `Section` wrapper maps to token-backed classes — the styling
spine Phases 2–5 inherit for free.

**Architecture:** New UPPERCASE consts in `@blog/config` → a shared Sanity
`appearance` object added to every `module_*` document via a `withAppearance()`
helper → each `service.modules.<type>.v1` projects `appearance` into its
view-model (`TAppearance | undefined`, no faked defaults) → a pure `Section`
component maps those props to Tailwind token classes → each `apps/web` module
component wraps its organism in `Section`. `@blog/ui` never learns the data
came from Sanity.

**Tech Stack:** `@blog/config` consts + generated Sanity types; Sanity v6 schema

- typegen; groqd projections in `@blog/service`; `@blog/ui` +
  `tailwind-variants`; Next.js RSC module components; Vitest + Testing Library.

## Global Constraints

_(Inherited from the rollout plan's Global Constraints — layer order,
delegation, per-layer PRs, additive = no migration, typegen after schema,
verify+review gates, push/PR human-gated. Repeated highlights:)_

- **Additive & optional only → no content migration.** State this explicitly in
  the PR body. Unset `appearance` must render byte-identical to today.
- **`@blog/ui` stays pure** — token names only, no `'use client'`, no date/aria
  literals; `ariaLabel` via prop if ever needed.
- **UPPERCASE key/value consts**, `as const`, unions via
  `(typeof C)[keyof typeof C]`, in `@blog/config`.
- After the schema change: `pnpm typegen` (orchestrator runs it in-session),
  commit regenerated `packages/config/src/sanity/generated/`.
- Co-locate `*.test.ts(x)`; `pnpm test` + `pnpm type-check` + `pnpm lint` pass.

## Contracts (locked here; every task uses these exact names)

**Consts — `packages/config/src/constants/appearance.ts`:**

```
BACKGROUND_TONE = { DEFAULT, SUBTLE, SURFACE, ACCENT_TINT, INVERSE }
SPACING_SCALE   = { NONE, SM, MD, LG, XL }
CONTAINER_WIDTH = { NARROW, WIDE, FULL }
ALIGN           = { START, CENTER }
```

(each key === its UPPERCASE string value, `as const`; exported union types
`TBackgroundTone`, `TSpacingScale`, `TContainerWidth`, `TAlign`.)

**View-model type — `TAppearance` (exported from `@blog/config` or the service
view-model barrel, matching where module view-models already live):**

```
TAppearance = {
  background?: TBackgroundTone;
  spacingTop?: TSpacingScale;
  spacingBottom?: TSpacingScale;
  containerWidth?: TContainerWidth;
  align?: TAlign;
  divider?: boolean;
}
```

(Fields are individually optional — corrected 2026-08-10 per #1305: every Sanity
sub-field is itself optional with no `initialValue`, so a partially-authored
`appearance` object is possible. `service` maps each field literally with no
faked defaults; `Section` applies its default table per-field, not only when
the whole object is absent.)

Service returns `TAppearance | undefined` (undefined when the Sanity field is
unset — no faked defaults). `Section` supplies the rendering defaults.

**`Section` props (`@blog/ui`):** `appearance?: TAppearance` plus
`children: ReactNode` and the polymorphic `as?` already used by `@blog/ui`
wrappers. Rendering defaults when `appearance` is undefined:
`background=DEFAULT, spacingTop=MD, spacingBottom=MD, containerWidth=WIDE,
align=START, divider=false` (chosen so today's output is unchanged — verified in
Task 5).

**Token mapping (`Section` internal, via `tailwind-variants`):**

- `background`: `DEFAULT→bg-bg`, `SUBTLE→bg-bg-subtle`, `SURFACE→bg-surface`,
  `ACCENT_TINT→bg-accent-muted`, `INVERSE→inverted neutrals (bg-text text-bg)`.
- `spacingTop/Bottom`: `NONE→pt-0/pb-0 … XL→pt-24/pb-24` (map to the existing
  spacing scale used by current sections — confirm exact step values against a
  current module during Task 4).
- `containerWidth`: `NARROW→max-w-prose`, `WIDE→max-w-5xl`, `FULL→max-w-none`
  (confirm against the current container widths in use).
- `align`: `START→items-start text-left`, `CENTER→items-center text-center`.
- `divider`: true → a hairline top border `border-t border-border`.

---

### Task 1: `@blog/config` — appearance consts + `TAppearance`

**Dispatch:** `config` subagent.

**Files:**

- Create: `packages/config/src/constants/appearance.ts`
- Modify: `packages/config/src/index.ts` (barrel export) — or the constants
  barrel the repo uses; the agent follows the existing export pattern.
- Test: none new (per repo convention, simple UPPERCASE const-pair files skip a
  dedicated test — TypeScript covers them; see the "no tests for const-pairs"
  norm). The `TAppearance` type is exercised by later tasks' tests.

**Interfaces — Produces:** `BACKGROUND_TONE`, `SPACING_SCALE`,
`CONTAINER_WIDTH`, `ALIGN` consts + `TBackgroundTone/TSpacingScale/
TContainerWidth/TAlign` unions + the `TAppearance` type, all from `@blog/config`.

- [ ] **Step 1:** Dispatch `config` to create `appearance.ts` with the four
      UPPERCASE consts (exact keys/values from Contracts), their derived union
      types, and the `TAppearance` object type; wire the barrel export.
- [ ] **Step 2:** Verify: `pnpm --filter @blog/config type-check` passes; the
      post-edit lint hook reports clean (no boundary violation).
- [ ] **Step 3:** Commit (`feat(config): add appearance consts and TAppearance`).

---

### Task 2: `apps/cms` — `appearance` object + `withAppearance()` + attach to modules

**Dispatch:** `cms` subagent. **Then orchestrator runs `pnpm typegen`.**

**Files:**

- Create: `apps/cms/src/schema-types/objects/appearance.ts` (the `appearance`
  object schema — fields backed by the `BACKGROUND_TONE`/… values as
  `options.list`).
- Create: `apps/cms/src/schema-types/helpers/with-appearance.ts` (a helper that
  appends the optional `appearance` field to a document's field array, mirroring
  `titleField`/`defineModulesField`).
- Modify: every `module_*` document schema
  (`apps/cms/src/schema-types/documents/modules/*`) to apply `withAppearance()`.
- Register the new object in the schema type list.

**Interfaces — Consumes:** the const _values_ from Task 1 (the stored strings).
**Produces:** an `appearance` field on every `module_*` document; after typegen,
the generated types gain the optional `appearance` shape that Task 3 projects.

- [ ] **Step 1:** Dispatch `cms` to add the `appearance` object schema (each
      field's `options.list` uses the UPPERCASE stored values from Task 1;
      `divider` boolean; all fields optional) + `withAppearance()` helper +
      apply it to all `module_*` documents + register the object.
- [ ] **Step 2:** Orchestrator runs `pnpm typegen`; re-run until the diff is
      minimal; commit `packages/config/src/sanity/generated/`.
- [ ] **Step 3:** Verify: `pnpm --filter @blog/cms type-check` (or the CMS
      extract) passes; the generated `AllSanitySchemaTypes` now carries the
      optional `appearance` on each `module_*` type.
- [ ] **Step 4:** Commit (`feat(cms): add optional appearance object to all
modules`). **PR body states: additive/optional — no content migration.**

---

### Task 3: `@blog/service` — project `appearance` into each module view-model

**Dispatch:** `service` subagent, then `test-writer` for the mapper tests.

**Files:**

- Modify: each `packages/service/src/features/modules/<type>/…` query +
  transformer + view-model to project `appearance` (explicit `sub.field()`
  projection per service conventions) and map it to `TAppearance | undefined`.
- Test: co-located mapper tests asserting present-vs-absent appearance.

**Interfaces — Consumes:** the generated `appearance` shape (Task 2) +
`TAppearance` (Task 1). **Produces:** each `service.modules.<type>.v1`
view-model now has `appearance: TAppearance | undefined`.

- [ ] **Step 1 (test-writer, failing test):** for one module mapper, add a test:
      given a raw doc with a full `appearance`, the view-model's `appearance`
      deep-equals it; given a raw doc with no `appearance`, it is `undefined`.
- [ ] **Step 2:** Run it — Expected: FAIL (mapper doesn't project appearance yet).
- [ ] **Step 3 (service):** dispatch `service` to add the `appearance`
      projection + view-model mapping to **every** module fetcher (no faked
      defaults; `undefined` when absent).
- [ ] **Step 4:** Run the mapper tests — Expected: PASS. Extend the test to a
      second module to confirm the pattern is applied uniformly.
- [ ] **Step 5:** Verify `pnpm --filter @blog/service type-check` + tests;
      commit (`feat(service): project appearance into module view-models`).

---

### Task 4: `@blog/ui` — the pure `Section` wrapper

**Dispatch:** `ui` subagent, then `test-writer` + `ui-storybook` story.

**Files:**

- Create: `packages/ui/src/<atoms|molecules>/section/section.tsx` +
  `section-variants.ts` (the `tailwind-variants` token map from Contracts).
- Create: `section.stories.tsx` (per `ui-storybook`) covering each background
  tone + a divider + a centered variant.
- Test: `section.test.tsx`.
- Regenerate `packages/ui/COMPONENTS.md` (pre-commit hook / `pnpm
gen:ui-index`).

**Interfaces — Consumes:** `TAppearance` (Task 1). **Produces:** `Section`
(default export from `@blog/ui`) accepting `appearance?: TAppearance`, `as?`,
`children`, applying the Contract's token classes; undefined `appearance` →
the Contract's rendering defaults.

- [ ] **Step 1 (failing test):** `section.test.tsx` — rendering `<Section>` with
      no `appearance` produces the default container classes; with
      `background: SURFACE` it includes `bg-surface`; with `divider: true` it
      includes `border-t`; with `align: CENTER` it includes `text-center`.
- [ ] **Step 2:** Run — Expected: FAIL (no `Section`).
- [ ] **Step 3 (ui):** dispatch `ui` to implement `Section` + `section-variants`
      per the Contract token map, pure and prop-driven (no `'use client'`).
- [ ] **Step 4:** Run tests — Expected: PASS. Add the story; regenerate
      `COMPONENTS.md`.
- [ ] **Step 5:** Verify `pnpm --filter @blog/ui type-check` + test + `pnpm
gen:ui-index:check`; commit (`feat(ui): add Section appearance wrapper`).

---

### Task 5: `apps/web` — wrap each module component in `Section`

**Dispatch:** `web` subagent, then `test-writer`.

**Files:**

- Modify: each `apps/web/src/modules/<type>/<type>-module.tsx` to read its
  view-model's `appearance` and render its organism inside `<Section
appearance={appearance}>`.
- Test: a module-renderer / component test asserting the wrapper is applied and
  that an **unset** appearance yields the current output (regression guard).

**Interfaces — Consumes:** `service.modules.<type>.v1` view-model `appearance`
(Task 3) + `Section` (Task 4).

- [ ] **Step 1 (failing test):** for one module component, assert its rendered
      output is wrapped by `Section` and that with `appearance: undefined` the
      DOM matches the pre-change snapshot (no visual change).
- [ ] **Step 2:** Run — Expected: FAIL (not yet wrapped).
- [ ] **Step 3 (web):** dispatch `web` to wrap every MODULE_MAP-rendered module
      component in `Section`, passing its `appearance`. **Note `module_hero`:**
      it renders via the dedicated home template slot, not `MODULE_MAP`; wrap it
      in `Section` there only if it carries an `appearance` — otherwise leave its
      bespoke rendering unchanged and note it in the PR.
- [ ] **Step 4:** Run tests — Expected: PASS. Confirm the unset-appearance
      regression guard passes for a second module.
- [ ] **Step 5:** Verify `pnpm --filter web type-check` + test; commit
      (`feat(web): render modules inside Section appearance wrapper`).

---

### Task 6: Integration verify + review + docs

- [ ] **Step 1:** `verify-runner` (synchronous): `pnpm type-check && pnpm lint &&
pnpm test` from root — all green.
- [ ] **Step 2:** `reviewer` over the full diff → fix blocking findings → re-run
      until `APPROVE`. `a11y-reviewer` too (ui/web touched).
- [ ] **Step 3:** Update `SPEC.md` §6 (content model — the appearance object) and
      `docs/context/content-model.md` in the same PR.
- [ ] **Step 4:** Commit; **ask to push** (human gate); **ask to open PR** (human
      gate); on PR → board → `ci-watcher` → sweep worktrees.

## Self-review (plan ↔ spec)

- Feature 1 content model (background/spacing/container/align/divider) → Tasks
  1–2. ✔
- Service `TAppearance | undefined`, no faked defaults → Task 3. ✔
- Pure `Section` wrapper, every organism inside it → Tasks 4–5. ✔
- Additive, no migration → stated in Tasks 2 & 6. ✔
- `module_hero` special-casing called out → Task 5. ✔
- No placeholder steps; every task names exact files, contract, and a concrete
  failing test.

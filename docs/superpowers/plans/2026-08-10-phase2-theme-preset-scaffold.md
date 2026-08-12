# Phase 2 — Theme-as-Content + Preset Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. **This repo delegates every layer file to its owning subagent** (`config`/`cms`/`service`/`ui`/`web`, + `test-writer`) — so each task below is a **dispatch** with exact files, contracts, and acceptance tests, **not** pre-authored code the orchestrator writes to disk. Follow `develop-feature` for the gate sequence. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every tenant a code-owned `PRESET` registry (`console`/`editorial`) driving the **look** axis — accent color, fonts, radius, density, logo, chrome visibility — resolved through the tenant-CMS-override → preset-default → neutral-base ladder. `console` must reproduce today's site pixel-for-pixel; `editorial` proves de-consoling works end-to-end with zero `@blog/ui` edits beyond two named ones.

**Architecture:** `config` owns the `PRESET` registry + look-axis consts + a new shared OKLCH color-derivation utility → `cms` gets a `settings_theme` singleton (preset selector + accent hue + font/radius/density overrides) and a `logo` field on `settings_site` → `service` resolves preset + overrides into concrete token values (deriving the accent ramp from `accentHue` at fixed lightness/chroma) → `ui` gets a `BrandMark` image variant and swaps hardwired `font-mono` for a themeable `--font-ui` token in three chrome components → `web` injects the resolved tokens as a server-rendered `<style>` block (`:root {…}` + `.dark {…}`), wires `next/font` for the chosen fonts, and renders the logo (uploaded vs. fallback). Along the way, this phase also resolves issue #568 (open spike): the new OKLCH utility becomes the single source of truth, and the two existing hand-duplicated hex-derivation consumers (`brand-icon-svg.ts`, `default-social-image.tsx`) are refactored onto it.

**Tech Stack:** `@blog/config` consts + a new `culori` dependency in `@blog/utils` for OKLCH↔hex color math; Sanity v6 schema + typegen; groqd projections in `@blog/service`; `@blog/ui` + `tailwind-variants`; `next/font`; Next.js Server Components; Vitest + Testing Library.

## Global Constraints

_(Inherited from the rollout plan's Global Constraints — layer order, delegation, per-layer PRs, additive = no migration, typegen after schema, verify+review gates, push/PR human-gated. Repeated highlights:)_

- **Additive & optional only → no content migration.** `settings_theme` is a new singleton; the `logo` field on `settings_site` is optional. State this explicitly in every PR body.
- **`console` is the safety net.** Applying it must reproduce today's site exactly — this phase must be provably non-regressive for the existing deployment. A tenant with **no** `settings_theme` document renders the neutral base (same as `console`'s values, since `console` preserves today's look).
- **`@blog/ui` stays pure** — token names only, no `'use client'`, no data fetching, no knowledge that a value came from a preset or a tenant override. The **only** `@blog/ui` edits this phase makes are (a) `BrandMark`'s image variant and (b) the `font-mono` → `--font-ui` swap in three chrome components' variants files.
- **UPPERCASE key/value consts**, `as const`, unions via `(typeof C)[keyof typeof C]`, in `@blog/config`.
- **Secrets never move to content** (D8, non-negotiable, applies repo-wide even though Phase 2 doesn't touch feature flags directly).
- After the schema change: `pnpm typegen` (orchestrator runs it in-session), commit regenerated `packages/config/src/sanity/generated/`.
- Co-locate `*.test.ts(x)`; `pnpm test` + `pnpm type-check` + `pnpm lint` pass.
- Confirm the new `<style>` block against the app's CSP (`apps/web/next.config.ts`) when implementing Task 7 — `style-src` already allows `'unsafe-inline'` per existing config, but re-verify rather than assume.

## Contracts (locked here; every task uses these exact names)

**Consts — `packages/config/src/constants/preset.ts`:**

```
PRESET_ID       = { CONSOLE, EDITORIAL }
FONT_CHOICE     = { SPACE_GROTESK, NEWSREADER, JETBRAINS_MONO, <editorial serif/sans picks — Task 3 confirms exact next/font/google names> }
RADIUS_SCALE    = { SM, MD, LG, XL }          # mirrors --radius-sm/--radius/--radius-lg/--radius-xl
DENSITY         = { DEFAULT, COMPACT }
```

(each key === its UPPERCASE string value, `as const`; exported union types `TPresetId`, `TFontChoice`, `TRadiusScale`, `TDensity`.)

**`--font-ui` is a new CSS custom property name** (not yet in `configs/tailwind/theme.css`) — Task 1 doesn't add it to `theme.css` itself (that's `web`'s injector, Task 7), but every layer references the literal string `--font-ui` consistently. Task 5 (ui) consumes it as a Tailwind arbitrary-property utility or an existing token-utility pattern — confirm against how `--font-mono-family` is currently consumed (`font-mono` utility) and pick the equivalent approach for consistency.

**`TThemeTokens` (exported from `@blog/config`, alongside `PRESET_ID`):**

```
TThemeTokens = {
  accentHue: number;          // 0–360, degrees — OKLCH hue channel (drives --brand-primary*)
  logoHue?: number;           // 0–360, degrees — OKLCH hue channel for --logo-1/2/3 only; defaults to accentHue when unset
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  chromeOn: boolean;          // true = WindowChrome/Toast/TerminalChip/TerminalTyping render; false = editorial's chrome-free look
}
```

**`logoHue` added 2026-08-12** (see "Design decision: retiring the Console/Indigo brand-variant axis" below) — the button/UI accent and the logo mark are independently tunable; when a preset or tenant override doesn't set `logoHue`, it inherits `accentHue` (today's `console`/`editorial` behavior — logo and accent share one hue). `console`/`editorial`'s `PRESET_REGISTRY` entries leave `logoHue` unset.

**`TPresetBundle` + `PRESET_REGISTRY` (mirrors the `Record<TKey, TBundle>` pattern already used by `packages/config/src/constants/spec-line.ts`'s `SPEC_LINE_SEPARATOR_CHARS`):**

```
TPresetBundle = {
  themeTokens: TThemeTokens;        // fully populated this phase
  voicePack: Record<string, never>; // placeholder — populated Phase 3 (#B). Do not overbuild this shape now; Phase 3's own plan will revisit it.
  featureDefaults: Record<string, never>; // placeholder — populated Phase 4 (#C). Same caveat.
}

PRESET_REGISTRY: Record<TPresetId, TPresetBundle>
```

`console`'s `themeTokens` must reproduce today's literal values (`accentHue: 250` — see below, `headingFont`/`bodyFont` matching the current `spaceGrotesk`/`newsreader` picks, `radiusScale` matching the current flat `--radius`/`--radius-lg` usage, `density: DEFAULT`, `chromeOn: true`). `editorial`'s values are a real de-consoled alternative (serif/neutral fonts, `chromeOn: false`) — exact font picks confirmed in Task 3 against actual `next/font/google` availability.

**Resolved in Task 3 (#1319, implemented 2026-08-12):** `editorial`'s final `themeTokens` — `headingFont: FRAUNCES` (distinctive display serif, structural inversion of console's sans-display/serif-body pairing), `bodyFont: INTER` (neutral, highly-legible UI sans, no mono/technical association), `accentHue: 28` (warm amber/terracotta, clearly distinct from console's blue-indigo `250`; WCAG contrast against `--text` still to be verified by Task 5's resolver per the guard below), `radiusScale: SM`, `density: COMPACT` (tighter, more restrained/print-editorial feel vs. console's default chrome-window look), `chromeOn: false`.

**Accent OKLCH derivation contract (locked from `configs/tailwind/theme.css` lines 237–249, 350–374 — console's fixed hue is `250`):**

Every accent-family token keeps its **lightness (L)** and **chroma (C)** fixed; only **hue (H)** varies with the tenant's `accentHue`:

```
--brand-primary          = oklch(0.53 0.17 <hue>)
--brand-primary-hover    = oklch(0.47 0.17 <hue>)
--brand-primary-muted    = oklch(0.95 0.03 <hue>)
--brand-primary-contrast = oklch(0.99 0    0)      # achromatic — never varies with hue
--brand-primary-solid    = oklch(0.55 0.17 <hue>)
--brand-primary-solid-hover = oklch(0.49 0.17 <hue>)
```

(Corrected 2026-08-12, post-review on #1319: this section originally named these tokens `--accent*` — that name was never real. The actual `configs/tailwind/theme.css` custom properties are `--brand-primary*`, as above.)

Dark-mode values are a **separate** fixed L/C set at the same hue — read the exact dark-mode numbers from `theme.css`'s `.dark` block directly when implementing (not reproduced here to avoid transcription drift; copy them verbatim from the source file).

**Neutral surfaces are brand-agnostic — only the accent family varies with hue (locked constraint).** The page/ink neutrals — `--primary`, `--primary-subtle`, `--secondary`, `--surface`, `--surface-2`, `--border`/`--border-strong`/`--border-emphasis`, and `--text`/`--text-muted`/`--text-subtle` — are near-achromatic (hue 250, chroma ≤ 0.01) and carry **no brand meaning**. A preset **must not** redefine them, and the resolver **must not** derive them from `accentHue`. They stay byte-identical across every preset, exactly as `.indigo` in `theme.css` today overrides only the `--brand-primary*`/`--logo*` tokens and leaves every neutral untouched. This keeps the site's structural surfaces stable while the brand hue moves — the only axis a "preset"/brand variant should shift.

(Corrected 2026-08-12: the paragraph originally here described a `BACKGROUND_TONE`/`ACCENT_TINT` model from `packages/config/src/constants/appearance.ts` — that file and const no longer exist. The Layout & SectionHeader redesign (epic #1370) and the earlier brand-variant epic replaced it: every `module_*` document now carries a required `brandVariant` field (`@blog/config`'s `BRAND_VARIANT` const — `PRIMARY`/`SECONDARY`/`BRAND_PRIMARY`), consumed by `apps/web`'s `Section` component (`section-variants.ts`). `BRAND_VARIANT.PRIMARY` → `bg-primary`, `SECONDARY` → `bg-secondary` (both neutral, byte-identical across every preset), `BRAND_PRIMARY` → `bg-brand-primary-muted` — the one variant that tracks the brand, since `--brand-primary-muted` is an accent-family token and varies with `accentHue` per the table above. Same "neutral structural backgrounds + a single brand-tinted variant" model the original paragraph described, just via `brandVariant` rather than a separate background-tone axis.)

**WCAG guard on the derived tint (blocking):** because a preset only rotates hue at fixed L/C, hue-rotation alone does **not** guarantee the tint stays legible. `--text` on `--brand-primary-muted` is already borderline at console/indigo's hues (~4.51:1, just over the 4.5:1 AA floor — see `theme.css`'s `.indigo` comment), so the resolver (Task 5, service) **must contrast-check each derived `--brand-primary-muted` against `--text`** in both light and dark and reject/adjust any `accentHue` that drops the pairing below AA — it cannot assume the fixed-L/C recipe preserves the ratio at every hue. This is the one background-related contrast check a new preset genuinely needs; the neutrals were verified once and don't move.

**Shared OKLCH utility — `packages/utils/src/color/oklch.ts`** (new folder, mirrors the existing `async/`/`pagination/`/`primitives/`/`reading-time/` one-folder-per-domain layout):

```ts
export const oklchToHex = (l: number, c: number, h: number): string => ...
```

Built on the `culori` package (new runtime dependency for `@blog/utils` — currently has zero runtime deps, only dev tooling ones; flag this addition clearly in the PR body). `culori` has first-class OKLCH support and is actively maintained — confirm current version via `pnpm add culori --filter @blog/utils` rather than hand-pinning a version number here.

## Sequencing note

Tasks 1–2 (config utility + #568 refactor) have no CMS/schema dependency and can land as their own early PR. Tasks 3 (cms) → 4 (service) → 5–6 (ui) → 7 (web) follow the usual dependency order. Task 6 (chrome font swap) has no dependency on Tasks 3–5 and could run in parallel with them if useful — it only touches `packages/ui` variants files.

## Design decision: retiring the Console/Indigo brand-variant axis (added 2026-08-12, mid-Task-3)

**The gap found:** this repo already ships a tenant-configurable "site look" toggle — `siteSettings.brand.variant` (`BRAND_VARIANTS.CONSOLE`/`BRAND_VARIANTS.INDIGO`, `packages/config/src/constants/brand.ts`), applied as a `.indigo` CSS class (`configs/tailwind/theme.css`) that overrides the accent + logo tokens. Left alone, `settings_theme.accentHue` would become a _second_, unrelated "change the accent color" axis — confusing to author and to reason about.

**Decision:** retire `siteSettings.brand.variant` / `BRAND_VARIANTS` / the `.indigo` CSS class entirely. "Indigo" becomes expressible purely as a `settings_theme` document: `{ preset: CONSOLE, accentHue: 65, logoHue: 274 }` — reproducing today's `.indigo` class exactly (its `--brand-primary`/`--brand-primary-solid` use `--logo-alt-accent` = `oklch(0.54 0.15 65)`, hue 65; its `--logo-1/2/3` use `--logo-alt-1/2/3`, hue 274 — two genuinely different, independently WCAG-verified hues, not one — see `theme.css`'s `.indigo` comment, epics #494/#515/#563). This is why `TThemeTokens` gained the optional `logoHue` field above rather than reusing `accentHue` for both.

**Migration required:** any existing document with `siteSettings.brand.variant: INDIGO` needs migrating to a `settings_theme` singleton with `{ preset: CONSOLE, accentHue: 65, logoHue: 274 }` before `brand.variant` is removed from the schema — a genuine content-shape change, human-gated per this repo's migration workflow (`apps/cms/migrations/README.md`: dry-run → `dataset:export` backup → human-approved run). Sequence this migration **after** Task 4's `settings_theme` schema lands and **before** Task 4 removes the `brand.variant` field (i.e., as the second half of Task 4, not a separate task — the schema needs both shapes to exist simultaneously for the migration transform to read one and write the other).

**Task scope changes (all folded into already-planned tasks, not new standalone tasks):**

- **Task 4 (cms):** in addition to the `settings_theme` singleton + `logo` field on `settings_site`, this task now also (a) writes the `brand.variant → settings_theme` migration described above, and (b) removes the `variant` field from `apps/cms/src/schema-types/objects/brand.ts` (and its `BRAND_VARIANTS` import) once the migration is written. Sequence: add `settings_theme` schema → write + dry-run the migration → orchestrator runs the human-gated `migrate:run` → remove `brand.variant` field → typegen.
- **Task 5 (service):** the `site-settings` fetcher's existing `variant` field (query/transformer/types) is dropped — `settings_site`'s view-model no longer carries a brand variant; the resolved `accentHue`/`logoHue` come only from `service.settings.theme.v1.getTheme()`.
- **Task 8 (web):** in addition to the `<style>` injector/fonts/logo-slot work, this task now also (a) removes `apps/web/src/utils/root-html-class-name.ts`'s Indigo branch (and its test) since there's no more `.indigo` class to toggle, (b) removes the `.indigo` block from `configs/tailwind/theme.css` (its verified color values are preserved by moving them into `console`'s `PRESET_REGISTRY`-adjacent reference, not deleted outright — they're now reachable only via a tenant's `accentHue: 65`/`logoHue: 274` override, not a static class), and (c) refactors `apps/web/src/utils/brand-icon-svg.ts` + `apps/web/src/app/icon.tsx` to derive `LOGO_PALETTES` dynamically from the resolved theme's `logoHue` (via `oklchToHex`, Task 1) instead of the static `BRAND_VARIANTS`-keyed table — this changes what Task 2 (#1318) shipped (which kept the Console/Indigo split, just replaced hand-computed hex with computed hex) to be theme-driven instead of variant-driven.
- **Cleanup (fold into Task 8's dispatch, not a separate task):** once nothing references `BRAND_VARIANTS`/`TBrandVariants`, remove `packages/config/src/constants/brand.ts` and update `packages/ui/.storybook/preview.ts`'s brand-variant toolbar decorator (currently derives its options from `BRAND_VARIANTS` — either remove the toolbar or repoint it at something meaningful for the new preset system, implementer's call, state the reasoning in the report).

---

### Task 1: `@blog/utils` — shared OKLCH→hex derivation utility

**Dispatch:** `config` subagent (owns `packages/utils`).

**Files:**

- Create: `packages/utils/src/color/oklch.ts` — `oklchToHex(l, c, h): string`, using `culori`.
- Modify: `packages/utils/package.json` — add `culori` as a runtime dependency.
- Modify: `packages/utils/src/index.ts` (or wherever the barrel lives) — export the new function.
- Test: `packages/utils/src/color/oklch.test.ts` — assert `oklchToHex` reproduces the **known-correct** hex values already hand-computed in `apps/web/src/utils/brand-icon-svg.ts`'s `LOGO_PALETTES` for at least 2–3 sample OKLCH triples (this is the cross-check that proves the utility is correct before Task 2 relies on it to replace those hand-computed values).

**Interfaces — Produces:** `oklchToHex(l: number, c: number, h: number): string` from `@blog/utils`.

- [ ] **Step 1:** Dispatch `config` to add `culori` to `packages/utils/package.json`, run `pnpm install`.
- [ ] **Step 2 (failing test):** Write `oklch.test.ts` asserting `oklchToHex(...)` against 2–3 known hex values from `brand-icon-svg.ts`'s existing hand-computed `LOGO_PALETTES` (same L/C/H triples that produced those hex strings, read directly from the OKLCH source comments in `theme.css`).
- [ ] **Step 3:** Run it — Expected: FAIL (`oklchToHex` doesn't exist yet).
- [ ] **Step 4:** Implement `oklchToHex` using `culori`'s `oklch`/`formatHex` (or equivalent current API — check `culori`'s docs via `use-context7` if the exact function names aren't obvious from a quick look at its exports).
- [ ] **Step 5:** Run the test — Expected: PASS, hex values match the hand-computed ones exactly (or within a documented, justified rounding tolerance if `culori`'s rounding differs slightly from the original hand-conversion — if so, note this in the PR and confirm the tiny delta is visually imperceptible).
- [ ] **Step 6:** Verify `pnpm --filter @blog/utils type-check` / `test` / `lint`.
- [ ] **Step 7:** Commit (`feat(config): add shared OKLCH color derivation utility`).

---

### Task 2: `apps/web` — resolve #568 by refactoring the two hand-duplicated consumers

**Dispatch:** `web` subagent.

**Files:**

- Modify: `apps/web/src/utils/brand-icon-svg.ts` — replace the hand-computed `LOGO_PALETTES` hex values with `oklchToHex(...)` calls reading the same L/C/H triples currently documented in the file's comments (which themselves originate from `theme.css`'s `--logo-1/2/3`/`--logo-alt-1/2/3`).
- Modify: `apps/web/src/metadata/default-social-image/default-social-image.tsx` — same treatment for its `COLORS` object.
- Test: existing tests for both files (if any) must still pass unchanged — this is a refactor, not a behavior change, so no new test cases are needed beyond confirming the existing dynamic favicon / OG image output is byte-identical.

**Interfaces — Consumes:** `oklchToHex` (Task 1).

- [ ] **Step 1:** Dispatch `web` to replace each hand-duplicated hex literal in both files with an `oklchToHex(l, c, h)` call using the exact L/C/H values already documented in each file's comments (read from `theme.css`'s `--logo-*` custom properties directly — do not re-derive by hand).
- [ ] **Step 2:** Run existing tests for both files (or manually verify the dynamic favicon route / OG image renders identically) — Expected: PASS, output unchanged.
- [ ] **Step 3:** Verify `pnpm --filter web type-check` / `test` / `lint`.
- [ ] **Step 4:** Commit (`refactor(web): derive logo/OG colors from shared OKLCH utility, closes #568`).

This closes #568 with an implementation (not just the spike's written recommendation) — the PR body should say so explicitly and link #568.

---

### Task 3: `@blog/config` — `PRESET` registry + look-axis consts

**Dispatch:** `config` subagent.

**Files:**

- Create: `packages/config/src/constants/preset.ts` — `PRESET_ID`, `FONT_CHOICE`, `RADIUS_SCALE`, `DENSITY` consts + derived union types + `TThemeTokens` + `TPresetBundle` + `PRESET_REGISTRY: Record<TPresetId, TPresetBundle>`, populated per the Contracts section above.
- Modify: `packages/config/src/constants/index.ts` (or the barrel the repo uses) — wire the export.
- Test: none new, per the "no tests for const-pairs" convention — `PRESET_REGISTRY`'s correctness (console reproducing today's values) is verified by Task 7's integration/visual check, not a unit test here.

**Interfaces — Consumes:** nothing new (self-contained consts).
**Produces:** `PRESET_ID`, `FONT_CHOICE`, `RADIUS_SCALE`, `DENSITY`, `TThemeTokens`, `TPresetBundle`, `PRESET_REGISTRY` from `@blog/config`.

- [ ] **Step 1:** Dispatch `config` to create `preset.ts` with the exact consts/types from Contracts. For `FONT_CHOICE`'s editorial-preset members, pick 1–2 concrete `next/font/google` serif/sans font names now (even though Task 5 does the actual `next/font` wiring) so the const values are stable for downstream tasks — note the choice needs no design-system sign-off beyond "reads as serif/neutral, contrasts clearly with console's mono/display pairing."
- [ ] **Step 2:** Verify `pnpm --filter @blog/config type-check`; the post-edit lint hook reports clean.
- [ ] **Step 3:** Commit (`feat(config): add PRESET registry and look-axis consts`).

---

### Task 4: `apps/cms` — `settings_theme` singleton + `logo` field on `settings_site` + retire `brand.variant`

**Dispatch:** `cms` subagent. **Then orchestrator runs `pnpm typegen`. Then orchestrator runs the human-gated migration.**

**Scope note (added 2026-08-12):** this task now has two halves — see "Design decision: retiring the Console/Indigo brand-variant axis" above for the full rationale. Half A (schema addition) is purely additive, no migration. Half B (retiring `brand.variant`) is a real content-shape change and needs the migrate → human-gate → schema-removal sequence below, in that order — do not remove the `brand.variant` field until the migration has actually run.

**Files:**

- Create: `apps/cms/src/schema-types/documents/settings/theme.ts` — `settings_theme` singleton, following the exact pattern in `apps/cms/src/schema-types/documents/settings/site-settings.ts` (`defineType`, `titleField()`, `preview.prepare`). Fields: `preset` (string, `options.list` from `PRESET_ID` values — mirror the `link.ts`/`layout.ts` `options.list` pattern), `accentHue` (number, 0–360, optional — validation `rule.min(0).max(360)`), `logoHue` (number, 0–360, optional, same validation — defaults to `accentHue` when unset per the Contracts section), `headingFont`/`bodyFont` (string, `options.list` from `FONT_CHOICE`), `radiusScale` (string, `options.list` from `RADIUS_SCALE`), `density` (string, `options.list` from `DENSITY`). All fields except `preset` optional (unset = use the selected preset's own default).
- Modify: `apps/cms/src/schema-types/documents/settings/site-settings.ts` — add a `logo` field (image type, following the exact `defaultOgImage` field's pattern at the end of that file: `type: imageWithAltSchema.name`, optional — not `.required()`, since D7 says upload-or-fallback).
- Register `settings_theme` in the schema type list (same place `settings_newsletter`/other settings singletons are registered — check `apps/cms/src/schema-types/index.ts` or wherever the document list lives).
- **Migration** (new, `apps/cms/migrations/`, follow `README.md`'s `migrate:new` scaffold): for every `siteSettings` document with `brand.variant === 'INDIGO'`, create/update the `settings_theme` singleton to `{ _id: 'settings_theme', _type: 'settings_theme', preset: 'CONSOLE', accentHue: 65, logoHue: 274 }` (the exact values that reproduce today's `.indigo` CSS class — see the Design decision section). Documents with `brand.variant === 'CONSOLE'` (or unset) need no `settings_theme` write — the no-document-means-console fallback already covers them.
- Modify: `apps/cms/src/schema-types/objects/brand.ts` — remove the `variant` field and its `BRAND_VARIANTS` import. **Only after the migration above has actually run** (dry-run → `dataset:export` backup → orchestrator prompts for human-gated `migrate:run`, same as any other content migration) — removing the field before the migration runs orphans any `INDIGO`-variant document's intent with no way to recover it.

**Interfaces — Consumes:** `PRESET_ID`, `FONT_CHOICE`, `RADIUS_SCALE`, `DENSITY` values (Task 3).
**Produces:** after typegen, `SettingsTheme` in the generated types; `SettingsSite` gains an optional `logo` field; `SettingsSite.brand` loses its `variant` field.

- [ ] **Step 1:** Dispatch `cms` to add the `settings_theme` singleton schema + the `logo` field on `settings_site`, each field's `options.list` sourced from the Task 3 consts, register the new document type.
- [ ] **Step 2:** Orchestrator runs `pnpm typegen`; re-run until the diff is minimal; commit `packages/config/src/sanity/generated/`.
- [ ] **Step 3:** Verify `pnpm --filter cms type-check`; confirm the generated `SettingsTheme` type and `SettingsSite.logo` appear correctly.
- [ ] **Step 4:** Commit (`feat(cms): add settings_theme singleton and logo field on settings_site`). This half is additive/optional — no migration needed yet, state so in the PR body. This can land and merge as its own PR before the migration/removal half below.
- [ ] **Step 5:** Dispatch `cms` to write the `brand.variant → settings_theme` migration per `apps/cms/migrations/README.md`'s scaffold (`migrate:new`). Dry-run it (`migrate:dry`) against a dataset with at least one `INDIGO`-variant `siteSettings` document (or a fixture) to confirm the transform produces the exact `{ preset: CONSOLE, accentHue: 65, logoHue: 274 }` shape.
- [ ] **Step 6:** Orchestrator: run `dataset:export` (backup), present the migration's dry-run output to the user, get explicit approval, then run `migrate:run` against the live dataset(s) — human-gated, same as any content migration or deploy.
- [ ] **Step 7:** Dispatch `cms` to remove `brand.variant`/`BRAND_VARIANTS` from `apps/cms/src/schema-types/objects/brand.ts` now that the migration has run. Orchestrator re-runs `pnpm typegen`.
- [ ] **Step 8:** Verify `pnpm --filter cms type-check`; commit (`feat(cms): retire brand.variant, migrated to settings_theme`). Separate PR from Step 4's, since this half genuinely needs the migration gate in between.

---

### Task 5: `@blog/service` — resolve preset + overrides into concrete theme tokens

**Dispatch:** `service` subagent, then `test-writer` for the resolver tests.

**Files:**

- Create: `packages/service/src/features/global/theme-settings/` — mirror the exact directory structure of an existing settings fetcher (e.g. `packages/service/src/features/global/newsletter-settings/`, or `site-settings/` for the `logo` field addition): `adaptor/query.ts` (groqd query against `settings_theme`, all fields `.nullable(true)` since the whole document may not exist), `adaptor/transformer.ts`, `adaptor/types.ts`, `application/service.ts` exporting `createThemeSettingsService() → { v1: { getTheme: safeAsync(...) } }`.
- Modify: `packages/service/src/features/global/site-settings/` (or wherever `settings_site` is currently fetched) — extend the existing fetcher's query/transformer/types to include `logo` (following the exact pattern `defaultOgImage` already uses there, since both are `imageWithAltSchema`-typed fields); **remove** the existing `variant` field from this fetcher's query/transformer/types (Task 4 Step 7 dropped it from the schema — the resolved `accentHue`/`logoHue` now come only from `getTheme()` below, not from `settings_site`).
- The resolver logic: `getTheme()` reads the `settings_theme` document (if any), determines the effective `preset` (document's `preset` field, or `PRESET_ID.CONSOLE` if no document exists — the neutral-base-equals-console fallback), looks up `PRESET_REGISTRY[preset].themeTokens` as the base, and layers the document's own optional overrides (`accentHue`, `logoHue`, `headingFont`, `bodyFont`, `radiusScale`, `density`) on top where present. If `logoHue` ends up unset after layering (neither the preset nor the document set it), resolve it to the final `accentHue` value (the default-to-accentHue rule from the Contracts section) — so the returned `TThemeTokens.logoHue` is **always** a concrete number, never `undefined`, same "fully resolved" guarantee as every other field. Returns a fully-resolved `TThemeTokens` (never partial — this is the one point in the ladder where "preset default" fills every gap, so downstream consumers get a complete object).
- Test: cases for (a) no `settings_theme` document → console preset's tokens returned unchanged (including `logoHue` resolving to `accentHue`'s value, 250), (b) document exists with `preset: EDITORIAL`, no overrides → editorial preset's tokens returned unchanged, (c) document exists with `preset: EDITORIAL` + `accentHue` override → editorial's tokens with just that one field overridden, (d) document exists with `preset: CONSOLE`, `accentHue: 65`, `logoHue: 274` (the "Indigo" reproduction case) → both hues returned independently, not one defaulting to the other.

**Interfaces — Consumes:** `PRESET_REGISTRY`, `TThemeTokens` (Task 3); the generated `SettingsTheme` type + `SettingsSite.logo` (Task 4).
**Produces:** `service.settings.theme.v1.getTheme(): Promise<Result<TThemeTokens>>` (fully-resolved, never partial). `service.settings.site.v1.getSiteSettings()`'s existing view-model gains `logo: TImageWithAlt | undefined`.

- [ ] **Step 1 (test-writer, failing tests):** Write the three resolver test cases above against a not-yet-implemented `getTheme()`.
- [ ] **Step 2:** Run — Expected: FAIL.
- [ ] **Step 3 (service):** Dispatch `service` to implement the query/transformer/resolver per the pattern above, plus the `site-settings` fetcher's `logo` extension.
- [ ] **Step 4:** Run the tests — Expected: PASS.
- [ ] **Step 5:** Verify `pnpm --filter @blog/service type-check` + tests; commit (`feat(service): resolve theme preset and overrides into concrete tokens`).

---

### Task 6: `@blog/ui` — `BrandMark` image variant

**Dispatch:** `ui` subagent, then `test-writer` + `ui-storybook` story update.

**Files:**

- Modify: `packages/ui/src/atoms/brand-mark/brand-mark.tsx` — add an optional `src?: string` prop (image source). When present, render an `<img>` (or `next/image`-compatible plain `<img>`, since `@blog/ui` avoids `next/image` unless passed in as a prop/slot per the Purity rules) instead of the three-polygon SVG mark. When absent, render the existing polygon mark unchanged (D7's fallback). Follow this repo's "compose primitives directly, don't force a compound-slot pattern for simple prop-driven variation" convention (memory: `feedback_web_sections_compose_primitives_directly`) — a plain conditional prop, not a new compound component.
- Modify: `packages/ui/src/atoms/brand-mark/brand-mark-variants.ts` if the image variant needs its own sizing classes (check whether the existing `Size.SM/MD/LG` slots can apply to an `<img>` the same way they size the `<svg>`, or need a parallel set).
- Test: `brand-mark.test.tsx` — add cases for `src` present (renders an `<img>` with that `src`) vs. absent (renders the polygon `<svg>` unchanged, existing tests should still pass).
- Story: add a `WithImageSource` story alongside the existing ones.

**Interfaces — Consumes:** nothing new from other layers (self-contained prop addition).
**Produces:** `BrandMark` accepting an optional `src?: string` prop.

- [ ] **Step 1 (failing test):** `brand-mark.test.tsx` — assert `<BrandMark src="/logo.svg">` renders an `<img src="/logo.svg">`, not the polygon SVG.
- [ ] **Step 2:** Run — Expected: FAIL.
- [ ] **Step 3 (ui):** Dispatch `ui` to implement the `src` prop + conditional render.
- [ ] **Step 4:** Run — Expected: PASS. Confirm existing no-`src` tests still pass unchanged (D7's fallback guarantee). Add the story; regenerate `COMPONENTS.md`.
- [ ] **Step 5:** Verify `pnpm --filter @blog/ui type-check` + test + `pnpm gen:ui-index:check`; commit (`feat(ui): add BrandMark image-source variant`).

---

### Task 7: `@blog/ui` — swap hardwired `font-mono` for `--font-ui` in chrome components

**Dispatch:** `ui` subagent (can run in parallel with Tasks 3–6 — no dependency on them).

**Files:**

- Modify: `packages/ui/src/molecules/window-chrome/components/bar/window-chrome-bar-variants.ts` — replace `font-mono` in the base classes with the `--font-ui` token utility (confirm the exact Tailwind syntax for consuming an arbitrary custom property as a font-family utility — likely `font-[family-name:var(--font-ui)]` or an equivalent `@theme`-registered utility name; check how `--font-mono-family` currently becomes the `font-mono` utility in `theme.css`'s `@theme inline` block and mirror that registration approach for `--font-ui` too, rather than inventing a different mechanism).
- Modify: `packages/ui/src/molecules/toast/toast-variants.ts` — same swap on the `bar` and `action` slots (2 occurrences).
- Modify: `packages/ui/src/molecules/terminal-chip/terminal-chip-variants.ts` — same swap on the `root` slot.
- Test: existing tests for all three components should still pass unchanged (no `toHaveClass` assertions on font utilities exist per this repo's testing conventions, so this is a low-risk visual-only change from a test-coverage perspective — confirm by running the existing suites).

**Interfaces — Consumes:** the `--font-ui` custom property name (Contract, defined but not yet backed by a real value until Task 8 registers it in the injector).

- [ ] **Step 1:** Dispatch `ui` to replace all 4 `font-mono` occurrences across the three files with the `--font-ui`-consuming utility.
- [ ] **Step 2:** Run `pnpm --filter @blog/ui test` for all three components — Expected: PASS unchanged (no class-string assertions to break).
- [ ] **Step 3:** Verify `pnpm --filter @blog/ui type-check` + lint.
- [ ] **Step 4:** Commit (`refactor(ui): make chrome components' font themeable via --font-ui`).

Note: until Task 8 actually defines `--font-ui` in `theme.css`/the injector, this value falls back to the browser default per normal CSS custom-property behavior — verify this doesn't visually break `console`'s current mono look before Task 8 lands (if it does regress visually in isolation, sequence Task 7 to land together with or after Task 8 instead of standalone).

---

### Task 8: `apps/web` — theme `<style>` injector, `next/font` wiring, logo rendering + retire the `.indigo` class

**Dispatch:** `web` subagent.

**Scope note (added 2026-08-12):** in addition to the injector/fonts/logo work, this task also finishes retiring the Console/Indigo brand-variant axis (see "Design decision" above, and Task 4/5's matching scope additions) — the `.indigo` CSS class and its `apps/web` consumers become dead code once the theme injector resolves `accentHue`/`logoHue` from `settings_theme` directly.

**Files:**

- Modify: the root layout (`apps/web/src/app/[locale]/layout.tsx` or `apps/web/src/app/layout.tsx` — confirm which one currently renders `<head>`) — add a server-rendered `<style>` block (via `dangerouslySetInnerHTML`, same mechanism the existing `themeBootstrapScript` `<script>` tag already uses in this exact spot, per `apps/web/src/config/theme-script.ts`) declaring the resolved CSS custom properties under **both** `:root { … }` and `.dark { … }` — not inline `style` on `<html>`, which carries only one scope and breaks dark mode. Include `--font-ui`'s resolved value here (backing Task 7's new token), and derive `--brand-primary*` from the resolved `accentHue` and `--logo-1/2/3` from the resolved `logoHue` **independently** (they're no longer always the same hue — see Design decision). Fetch the resolved tokens via `service.settings.theme.v1.getTheme()` (Task 5).
- Modify: `apps/web/src/config/fonts.ts` — extend the current hardcoded single-font-per-role wiring to select between `FONT_CHOICE` options based on the resolved `headingFont`/`bodyFont` (add the `next/font/google` imports for whatever editorial font(s) Task 3 named).
- Modify: wherever `BrandMark` is currently rendered in `apps/web` (likely `Header`'s brand slot composition) — pass `src` from `service.settings.site.v1.getSiteSettings()`'s new `logo` field (Task 5) when present, omitting it (falling back to the polygon mark) when absent.
- Modify: `apps/web/src/utils/brand-icon-svg.ts` — replace the static `BRAND_VARIANTS`-keyed `LOGO_PALETTES` table with palette derivation from the resolved theme's `logoHue` (via `oklchToHex`, Task 1) — light/dark only, no more per-variant branching. `apps/web/src/app/icon.tsx` (the route consuming this) needs to fetch `service.settings.theme.v1.getTheme()` to get the hue to derive from.
- Modify: `apps/web/src/metadata/default-social-image/default-social-image.tsx` — same treatment if it still branches on `BRAND_VARIANTS` anywhere (check; per Task 2/#1318 it was already Console-only, so this may need no further change beyond confirming its hardcoded hue still matches console's resolved `logoHue`).
- Delete the branching logic in `apps/web/src/utils/root-html-class-name.ts` (and its test) — no more `.indigo` class to toggle; `buildRootHtmlClassName` either goes away entirely (if nothing else calls it) or collapses to just the font-variable base classes, implementer's call once all call sites are checked.
- Modify: `configs/tailwind/theme.css` — remove the `.indigo { … }` block (its hand-verified values are preserved by copying them into the migration's literal `accentHue: 65`/`logoHue: 274` in Task 4, not deleted from history — just no longer expressed as a static CSS class).
- Delete: `packages/config/src/constants/brand.ts` (`BRAND_VARIANTS`/`TBrandVariants`) once nothing imports it — re-check `packages/ui/.storybook/preview.ts`'s brand-variant toolbar decorator first (see Design decision's Cleanup note) and either remove it or repoint it, whichever the implementer judges makes more sense for exercising the new preset system in Storybook; state the reasoning in the report.
- Test: a page/layout-level test asserting the injected `<style>` block contains the expected `--brand-primary`/`--logo-1/2/3`/`--font-ui`/etc. values for at least the `console` case (no `settings_theme` document → today's exact values), matching the "console reproduces today's site pixel-for-pixel" acceptance criterion. Also a case confirming a document with distinct `accentHue`/`logoHue` values (the "Indigo" reproduction) injects both independently.

**Interfaces — Consumes:** `service.settings.theme.v1.getTheme()`, `service.settings.site.v1.getSiteSettings()`'s `logo` field (Task 5); `oklchToHex` (Task 1, for converting the resolved `TThemeTokens.accentHue` into the actual `oklch(...)` CSS values — or emit `oklch(l c h)` as a raw CSS value directly, since modern browsers support the `oklch()` CSS function natively and this avoids a hex-conversion round-trip; **confirm during implementation whether raw `oklch()` CSS or `oklchToHex`-derived hex is the right call** — raw CSS `oklch()` is likely simpler and more correct for the injector specifically, whereas `oklchToHex` exists for contexts that _can't_ read CSS custom properties, like `brand-icon-svg.ts`'s SVG route and Satori's OG image renderer, which is a different constraint than this task's).
**Produces:** the fully working preset pipeline, end-to-end.

- [ ] **Step 1 (failing test):** Layout/page test asserting the rendered `<style>` block's content for the no-`settings_theme`-document case matches today's known `--brand-primary`/etc. values.
- [ ] **Step 2:** Run — Expected: FAIL.
- [ ] **Step 3 (web):** Dispatch `web` to implement the `<style>` injector, `next/font` selection wiring, and logo rendering.
- [ ] **Step 4:** Run — Expected: PASS. Add an `editorial`-preset test case too (mocked `settings_theme` document) confirming the injected values differ correctly.
- [ ] **Step 5:** Verify `pnpm --filter web type-check` + test; confirm the CSP (`apps/web/next.config.ts`) actually permits the new `<style>` tag (re-check, don't assume the existing `'unsafe-inline'` allowance is still sufficient once this is added).
- [ ] **Step 6:** Commit (`feat(web): inject resolved theme tokens, wire fonts and logo rendering`).

---

### Task 9: Integration verify + review + docs

- [ ] **Step 1:** `verify-runner` (synchronous): `pnpm type-check && pnpm lint && pnpm test` from root — all green.
- [ ] **Step 2:** `reviewer` over the full diff → fix blocking findings → re-run until `APPROVE`. `a11y-reviewer` too (ui/web touched). `seo-auditor` if the layout/metadata surface changed beyond the `<style>` injection.
- [ ] **Step 3:** Manually verify (or have `web` verify) both acceptance criteria empirically: `console` preset pixel-for-pixel vs. today's deployed site; `editorial` preset renders chrome-free serif/neutral with dark mode intact.
- [ ] **Step 4:** Update `SPEC.md` (content model — `settings_theme`, the `PRESET` registry, the theme-injection mechanism) and `docs/context/content-model.md`.
- [ ] **Step 5:** Commit; **ask to push** (human gate); **ask to open PR** (human gate); on PR → board → `ci-watcher` → sweep worktrees.

Given the scope, prefer **per-layer PRs** for Tasks 1–2 (config/web, standalone), 3 (config), 4 (cms), 5 (service), 6+7 (ui, can combine since both are small `packages/ui` changes), 8 (web) — each merges to `main` green on its own since every change here is additive. Task 9's SPEC.md sync lands in whichever PR completes the phase (likely Task 8's).

## Self-review (plan ↔ spec)

- `PRESET` registry, code-owned, `{ themeTokens, voicePack, featureDefaults, chromeOn }` shape (D3) → Task 3. ✔ (`chromeOn` folded into `themeTokens` rather than a sibling key — see note below.)
- `settings_theme` singleton + `preset` selector + curated overrides (accent/fonts/radius/density) → Task 4. ✔
- Logo: CMS image/SVG upload with polygon fallback (D7) → Tasks 4 (schema), 5 (fetch), 6 (ui), 8 (render). ✔
- `<style>` injector under both `:root`/`.dark`, not inline `html` style → Task 8. ✔
- `--font-ui` themeable chrome font, chrome components stay opt-in exports → Task 7 (swap) + Task 3 (`chromeOn` flag, consumed by whichever `web` composition decides to render/omit the chrome components — noting this composition-level "omit chrome when `chromeOn: false`" wiring isn't explicitly a task above; **flag for Task 8 or a follow-up:** the plan covers making chrome themeable font-wise, but the actual _omission_ of `WindowChrome`/`Toast`/`TerminalChip`/`TerminalTyping` instances when `editorial` is active is a `web`-composition decision (which components currently render them, and gating that on `chromeOn`) not yet mapped to exact files — **this needs a fresh `explore` pass at Task 8 implementation time** to find every call site.
- `console` preserved exactly / safety net (D6) → Contracts section's exact OKLCH values, Task 3/5/8's "no `settings_theme` document → console defaults" fallback chain.
- Migration: **Task 4 now needs one** (`brand.variant → settings_theme`, added 2026-08-12 mid-Task-3 per the "Design decision" section) — the rest of the phase stays additive/migration-free, stated per-task.
- #568 resolution folded in as Tasks 1–2, per the user's explicit decision this session. ✔
- Retiring the existing Console/Indigo `brand.variant` axis in favor of `settings_theme.accentHue`/`logoHue` (added 2026-08-12, mid-Task-3, user-approved) → Task 4 (schema + migration), Task 5 (drop `variant` from site-settings, resolve `logoHue`), Task 8 (drop the `.indigo` CSS class and its `apps/web` consumers). `TThemeTokens` gained `logoHue?: number` to faithfully reproduce Indigo's independently-tuned button/logo hues (65/274) — this required amending Task 3's already-open PR (#1388) before merge.
- No placeholder steps; every task names exact files, contract, and a concrete failing test — except Task 8's "explore chrome call sites" gap noted above, which is a legitimate scope discovery for that task's own dispatch, not a placeholder in this plan.

**Deviation from the plan's own "no placeholders" rule, disclosed:** `voicePack`/`featureDefaults` in `TPresetBundle` are typed as `Record<string, never>` placeholders in Task 3, not empty objects with no type — this is intentional (Phases 3/4 aren't planned yet, and their real shape shouldn't be guessed here), not an oversight. Phase 3's own plan will change this type when it lands.

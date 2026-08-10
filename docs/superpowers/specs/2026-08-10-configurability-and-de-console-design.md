# Configurability & De-console — Design

**Status:** Design / brainstorm pass — **approved 2026-08-10**. No code in this
doc; output feeds per-sub-project `superpowers:writing-plans` passes and
`board-keeper` ticketing. **Supersedes Feature 2 (theme-as-content) of
[`2026-08-07-flexible-theming-and-page-builder-design.md`](./2026-08-07-flexible-theming-and-page-builder-design.md)**,
which is absorbed into sub-projects A + D below.
**Date:** 2026-08-10
**Scope:** Generalise "theme-as-content" into a full **per-tenant
configurability layer** across three axes — **look, voice, behavior** — each
resolved through one uniform override ladder, delivered as **two presets**
(`console`, the current identity preserved; `editorial`, a de-consoled
alternative), and consumed unchanged by the multi-tenant work. The through-line:
today the terminal/console identity is baked into code across all three axes; a
non-technical client must be able to opt out of every part of it — CSS **and**
copy **and** behavior — without a fork.

**Related / dependencies:**

- **Feature 1 (appearance object)** of the theming doc — independent styling
  spine; ships first, this builds on it.
- **Feature 2 (theme-as-content)** of the theming doc — **subsumed here** (sub-
  project A + D). The theming doc's Feature 2 section now points at this doc.
- **Multi-tenant doc**
  ([`2026-08-07-multi-tenant-architecture-design.md`](./2026-08-07-multi-tenant-architecture-design.md))
  — a **hard consumer**: per-tenant look/voice/behavior _is_ this layer, stored
  in each tenant's own Sanity project. Its "zero `@blog/ui` change / theme per
  tenant" premise depends on this landing first.
- **`en.json` / next-intl** (`apps/web/src/i18n/messages/en.json`) — the code-
  owned microcopy catalogue sub-project B restructures.
- **`BRAND_VARIANTS`** (`packages/config/src/constants/brand.ts`, today
  `CONSOLE`/`INDIGO`) + the existing `settings_*` singletons (`settings_site`,
  `settings_navigation`, `settings_footer`, `settings_newsletter`) — the
  foundation this generalises.
- **Design tokens** (`configs/tailwind/theme.css`) + **`next/font`**
  (`apps/web/src/config/fonts.ts`) — the value sources presets drive.

---

## The core model — one override ladder, three layers

Every configurable value resolves through the **same three-tier ladder**,
applied uniformly to look, voice, and behavior:

```
tenant CMS override   →   preset default   →   neutral base (code)
```

- **Presets are code-owned** in `@blog/config` — a `PRESET` registry mapping a
  preset key (`CONSOLE` / `EDITORIAL`, UPPERCASE per convention) to a bundle:
  `{ themeTokens, voicePack, featureDefaults, chromeOn }`. Type-safe,
  reviewable, zero per-tenant maintenance.
- **The tenant picks one preset** via a single enum field in CMS, then overrides
  only a **curated** set of fields on top (accent hue, fonts, logo, a small set
  of brand-voice strings, feature toggles). Not every value is exposed — the
  curation _is_ the design (the "hybrid" ambition: presets + curated overrides,
  not full per-field control).
- **`web` resolves at render:** read `preset` + overrides from CMS → load the
  preset bundle from `@blog/config` → layer the overrides on top → inject. The
  **neutral base is always the floor**, so a tenant with zero configuration
  renders a clean generic site, never a broken one.

**`@blog/ui` never learns any of this exists.** It keeps referencing token
_names_ and receiving resolved props; all three ladders resolve `web`-side.
This is the same invariant the multi-tenant doc leans on ("zero `@blog/ui`
change") — which is exactly why this layer is its prerequisite.

---

## Sub-project A — Look (extends Feature 2 of the theming doc)

Generalises the accent/font/radius/density theming Feature 2 already designed,
and closes the two structural gaps the 2026-08-10 audit found.

- **`config`** — the `PRESET` registry; `FONT_CHOICE`, `RADIUS_SCALE`,
  `DENSITY` consts (as Feature 2); a new **`--font-ui`** token concept so UI
  chrome font is themeable, not hardwired.
- **`cms`** — `settings_theme` singleton (`preset` selector + `accentHue` +
  `headingFont`/`bodyFont` + `radiusScale` + `density`, per Feature 2); a
  **logo asset field** on `settings_site` (Sanity image/file).
- **`ui`** —
  - `BrandMark` gains a variant that accepts an **image source**; when a tenant
    uploads a mark it renders that, otherwise it falls back to the existing
    three-polygon `BrandMark` recoloured from `--logo-1/2/3`
    (`packages/ui/src/atoms/brand-mark/brand-mark.tsx`). This is the **only**
    genuinely shape-locked item today.
  - **Replace the hardwired `font-mono`** in the engagement chrome components
    (`window-chrome-bar-variants.ts`, `toast-variants.ts`,
    `terminal-chip-variants.ts`) with the themeable `--font-ui` token, so the
    `editorial` preset isn't stuck monospace. The chrome components themselves
    (`WindowChrome`, `Toast`, `TerminalChip`, `TerminalTyping`) are already
    discrete **opt-in** exports — a preset simply omits or includes them.
- **`web`** — the theme injector: a server-rendered `<style>` block declaring
  the resolved CSS variables under **both** `:root { … }` and `.dark { … }`
  (not inline `style` on `<html>`, which carries only one scope and breaks dark
  mode); `next/font` wiring for the chosen fonts; logo rendering (uploaded vs.
  fallback). Confirm the `<style>` block against the app's CSP when
  implementing.

**Migration.** None — `settings_theme` is a new additive singleton and the logo
field is optional; absent = current hardcoded defaults.

---

## Sub-project B — Voice (new; preservation is Step 0)

The terminal _voice_ lives in `apps/web/src/i18n/messages/en.json` as ~100+
`t()` strings — most neutral, a subset carrying console identity (`~$`,
`ls ~/bookmarks -l`, `whoami`, `auth login`, `command not found`,
`stashed to ~/bookmarks`). De-consoling a tenant must change its _copy_, not
just its CSS.

- **Step 0 — preserve (non-negotiable, runs first).** Inventory and **extract
  every console-voiced string** out of `en.json` into a canonical `console`
  voice-pack file. This file is the **source of truth** for the console
  identity; verify against the current `en.json` that nothing is lost before any
  neutralisation. _Then_ neutralise the `en.json` base to generic wording
  (e.g. "Saved to bookmarks", "Page not found").
- **The overlay mechanism.** next-intl messages are resolved through the ladder
  by merging catalogues: `neutral base (en.json) ← preset voice-pack ← tenant
CMS overrides`. The active preset selects its pack; the merged result is what
  `t()` reads. Packs are code-owned (type-safe, per-locale, no per-tenant ×
  per-locale explosion).
- **`cms`** — a **curated** set of overridable brand-voice keys (toast messages,
  404 copy, prompt labels, empty-state text) surfaced on a settings document,
  **seeded from the packs** — so the `console` voice is _represented in CMS_ and
  cannot be silently lost, per the explicit preservation requirement. Non-brand
  structural strings (pagination "Previous/Next", breadcrumbs) stay code-only;
  they carry no voice and don't need per-tenant control.

**Migration.** None on the Sanity side (new optional fields). The `en.json`
restructure is a code change guarded by Step 0's completeness check.

---

## Sub-project C — Behavior (new)

Feature availability, limits, and layout thresholds are today **env-var / build-
time or hardcoded**; a tenant can't currently turn comments off or widen a
limit as content.

- **`config`** — feature-flag keys + limit consts (UPPERCASE).
- **`cms`** — a `settings_features` singleton: capability toggles
  (comments / ratings / bookmarks / newsletter / analytics), validation limits
  (e.g. excerpt length, max tags, items-per-page), and layout thresholds (e.g.
  `MIN_H2_HEADINGS_FOR_RAIL`, today hardcoded in
  `apps/web/src/components/pages/blog-post-page/blog-post-page.tsx`). The preset
  supplies the defaults; the tenant overrides.
- **`service` / `web`** — fetch the features document; gate rendering on it.

**Caveat — secret-gated capabilities stay in env.** Auth providers (toggled by
`AUTH_*` presence, `apps/web/src/utils/env/env.ts`), the skim pipeline
(`ANTHROPIC_API_KEY`), and the revalidate webhook (`SANITY_REVALIDATE_SECRET`)
remain env-driven. A CMS toggle may control **"show this capability,"** but
**never** the secret itself — secrets never move to content. The doc names which
flags are CMS-eligible vs. env-locked at plan time.

**Migration.** None — new additive singleton; absent = current code defaults.

---

## Sub-project D — Presets (the glue)

The bundling layer that makes A/B/C a single choice rather than 30 knobs:

- The `PRESET` registry (`@blog/config`) binding each preset key to its
  `{ themeTokens, voicePack, featureDefaults, chromeOn }`.
- The `preset` selector field in CMS and the `web`-side **merge/resolution**
  logic (the ladder for all three axes).
- Ships **`console`** (the current identity preserved bit-for-bit — mono,
  window-chrome, terminal voice, current tokens) and **`editorial`** (serif/
  neutral, no chrome, plain professional voice), proving de-consoling works
  end-to-end with one clean contrast.

`console` is the safety net: applying it must reproduce today's site exactly, so
the whole refactor is provably non-regressive for the existing deployment.

---

## How it composes — layer flow

```
config  →  PRESET registry + FONT_CHOICE/RADIUS/DENSITY consts + feature-flag/limit consts + --font-ui token
cms     →  settings_theme (preset + accent/fonts/radius/density) + logo field on settings_site
           + curated voice-override keys + settings_features (toggles/limits/thresholds)
service →  theme fetcher (resolves preset+overrides)   features fetcher
ui      →  BrandMark image variant (+ polygon fallback) + --font-ui swap in chrome components (all still pure)
web     →  three-axis resolver → <style> injector (:root + .dark) + next/font + next-intl pack merge + feature gating
```

`@blog/ui` stays pure and prop-driven; `web` is the only place preset/override
resolution meets the components; the graph stays acyclic.

---

## Decision log

- **D1 — Ambition is _hybrid_: presets + curated overrides.** Not full per-field
  control (too large a surface, and copy would multiply per-tenant × per-locale)
  and not presets-only (tenants need _some_ per-field control now). Chosen for
  the "tens of tenants, lean" reality the multi-tenant doc targets.
- **D2 — One override ladder for all three axes** (`tenant CMS override → preset
default → neutral base`). Uniform resolution keeps look, voice, and behavior
  conceptually identical and `web`-resolved, preserving the `@blog/ui`-is-
  ignorant invariant.
- **D3 — Presets are code-owned** in `@blog/config`, not CMS documents. Type-
  safe, reviewable, and free of per-tenant maintenance; the tenant only picks a
  key + curated overrides.
- **D4 — Voice mechanism: code voice-packs + curated CMS overrides**, with a
  neutral `en.json` base. Keeps next-intl type-safe and per-locale without a
  per-tenant × per-locale CMS explosion.
- **D5 — Preservation is Step 0 of the voice work.** Every console string is
  extracted into a canonical `console` voice-pack file (the source of truth) and
  represented in CMS _before_ `en.json` is neutralised — the console identity is
  never lost or reconstructed from memory.
- **D6 — v1 ships two presets: `console` (preserved) + `editorial` (de-
  consoled).** One clean contrast proves the mechanism; more personas
  (corporate, etc.) are additive later.
- **D7 — Logo: CMS image/SVG upload with the default polygon `BrandMark` as
  fallback.** Real per-tenant branding at bounded effort; the shape stops being
  locked without a full wordmark/lockup config system (deferred).
- **D8 — Secrets never become content.** CMS feature toggles gate _visibility_
  of a capability; the underlying secret (auth providers, skim API key,
  revalidate secret) stays env-locked.
- **D9 — This layer is a hard prerequisite for multi-tenant.** Per-tenant look/
  voice/behavior is exactly this layer stored per Sanity project; multi-tenant
  adds tenant _resolution_, not new per-tenant _knobs_.
- **D10 — i18n posture: per-tenant _single_ language; multilingual _content_ is
  deferred (decided 2026-08-10).** Today the web is monolingual-EN with i18n
  plumbing already in place (`next-intl`, `LOCALE_ISO_CODES`,
  `localePrefix: 'never'`, one `en.json`); the CMS has **no** content
  localization. The committed model is **one language per tenant** (tenant A
  German, tenant B French) — each tenant's own Sanity project authors in its
  language, and its locale selects the matching per-locale voice-pack (which
  sub-project B already produces in code). This needs **no CMS content-model
  migration**. _Multilingual sites_ (one site, several languages, a switcher,
  localized documents) are **out of scope** here — they would require a Sanity
  localization migration across every document type, `localePrefix` +
  hreflang + per-locale feeds, and would **multiply per-tenant document count
  against the free-tier 10k-docs cap** (lowering the multi-tenant ceiling). To
  keep that future _additive_ rather than a re-architecture: (a) sub-project B's
  curated CMS voice-override keys are designed **per-locale-ready** (a locale
  dimension can be added without reshaping them), and (b) the leaning future
  approach, **if** a multilingual client ever lands, is **document-level
  internationalization** (`@sanity/document-internationalization` — document-
  per-locale within a project, pairing cleanly with locale-prefixed routing),
  to be confirmed at that time.

---

## Non-goals (recorded so epics don't sprawl)

- **Full per-field CMS control** of every string/colour/limit (D1) — out; the
  curated-override set is deliberately bounded.
- **A third+ preset** (corporate, etc.) — additive after v1's console+editorial.
- **Wordmark/lockup configuration system** — the logo field is upload-or-
  fallback only (D7); configurable wordmark text/font/arrangement is deferred.
- **Moving secrets to CMS** (D8) — never.
- **Per-tenant × per-locale authored copy** — packs are per-locale in code;
  tenant overrides are the curated brand-voice subset only.
- **Multilingual _content_ / CMS localization migration** (D10) — deferred; the
  committed model is one language per tenant. Sub-project B stays per-locale-
  ready so a future multilingual client is an additive migration.
- **The multi-tenant _implementation_** — this layer provides the per-tenant
  knobs; tenant resolution/topology/provisioning is the multi-tenant doc's job.

---

## Sequencing — the "roll it all out" order

Dependency order; each sub-project is a multi-layer epic + per-layer sub-issues
per repo rules. Items 5–8 are the pre-existing feature docs slotted around the
configurability spine.

1. **Feature 1 — appearance object** (theming doc; independent styling spine).
2. **A + D** — theme-as-content + preset scaffold. `console` preset must
   reproduce today's look exactly; `editorial` proves the swap.
3. **B** — voice-as-content (Step 0 preserve → neutralise → packs → curated CMS
   overrides). `console` + `editorial` voice-packs.
4. **C** — configurability / feature-toggle layer.
5. **New modules** — the Feature 3 catalogue, built in order **`module_gallery`
   → `module_faq`**, then the remaining catalogue types (`module_projectGrid`,
   `module_featureGrid`, `module_testimonial`, `module_logoWall`,
   `module_stats`, `module_embed`, …). Each is one issue under a shared tracking
   epic and inherits appearance (Feature 1) + theme (A/D) for free. `module_faq`
   is interactive — its disclosure lives in a `web` client leaf per
   `web-component-practices`; the organism stays pure.
6. **Feature 5** — portfolio `project` type (theming doc; independent).
7. **Feature 4** — contact form (gated on M5 foundations #984/#1091/#1093/#1107).
8. **Multi-tenant** — its own doc's epics, consuming 1–4. Gated on A/B/C per the
   multi-tenant doc's "theme per tenant / zero `@blog/ui` change" premise.

**Timing coupling with M5.** The multi-tenant doc's `tenantId` decision (add to
engagement tables at creation vs. backfill) is still open and interacts with the
M5 build (#1039–#1044) — and two engagement tables (`bookmarks`, `subscribers`)
already exist. That decision is not settled by this doc; flagged so the rollout
doesn't assume it.

---

## Spec sync when built

- **`SPEC.md` §6** (content model) — the new `settings_theme` / `settings_features`
  singletons, the logo field, and the preset model.
- **`SPEC.md` §9** (rendering) — the three-axis resolver + `<style>` theme
  injector + next-intl pack merge.
- **`SPEC.md` §4** (layer contracts) — the `PRESET` registry and the `web`-side
  resolution seam, if the layer picture shifts.
- **`docs/context/content-model.md`** — the new singletons and override fields.
- Per repo rules, **this doc and the theming doc's Feature 2 section are deleted
  once these sub-projects ship and `SPEC.md` reflects the final shape.** The
  theming doc's Feature 2 is already marked superseded by this doc.

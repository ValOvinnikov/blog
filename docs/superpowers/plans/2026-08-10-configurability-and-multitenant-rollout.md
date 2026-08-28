# Configurability, De-console & Multi-tenant — Rollout Plan

> **Program rollout plan, not a single-subsystem task plan.** This sequences the
> whole body of work into ordered **epics + per-layer sub-issues** ready for
> `board-keeper` ticketing and `develop-feature` execution. **Each epic gets its
> own detailed bite-sized (TDD) implementation plan at the moment it starts** —
> written just-in-time via `superpowers:writing-plans`, because later epics
> depend on earlier ones' real outcomes. Don't pre-expand all of them.

**Goal:** Turn the single-site console blog into a fully-customizable,
multi-tenant platform where each client site controls its look, voice, and
behavior from an admin panel — the terminal identity becoming one opt-in preset
among others — without any `@blog/ui` change.

**Architecture:** One override ladder (`tenant override → preset default →
neutral base`) resolved entirely in `apps/web`, applied uniformly to look
(theme tokens + logo), voice (next-intl packs), and behavior (feature toggles).
Presets are code-owned in `@blog/config`. Each tenant's preset + overrides live
in tenant-scoped Postgres rows edited through `apps/platform`; Sanity keeps
editorial content only. Phase 8 resolves the tenant by host. `@blog/ui` stays
pure and ignorant throughout.

> **Revised 2026-08-13** — config storage moved from Sanity singletons to
> Postgres, and the tenant registry moved to the front as Phase 0. The phase
> _numbers_ below are unchanged (issues reference them); their storage and
> ordering are not. See the two `2026-08-13-*` source specs.

**Tech Stack:** Turborepo + pnpm; Sanity Studio v6 + typegen; Next.js 16 App
Router + RSC; Tailwind v4 tokens; next-intl; `@blog/db` (Neon + Drizzle);
Vercel.

**Source specs (delete on completion per repo rules, once `SPEC.md` reflects
the final shape):**

- `docs/superpowers/specs/2026-08-10-configurability-and-de-console-design.md`
  (owns Phases 2–4 — sub-projects A/B/C/D; supersedes the theming doc's
  Feature 2)
- `docs/superpowers/specs/2026-08-07-flexible-theming-and-page-builder-design.md`
  (Features 1, 3, 4, 5 → Phases 1, 5, 6, 7)
- `docs/superpowers/specs/2026-08-07-multi-tenant-architecture-design.md`
  (Phases 0 + 8)
- `docs/superpowers/specs/2026-08-13-tenant-config-postgres-admin-design.md`
  (**supersedes the storage decision in Phases 2–4**: theme/voice/feature
  config lives in Postgres, not Sanity; owns the Phase 0 split rationale)
- `docs/superpowers/specs/2026-08-13-admin-panel-product-design.md`
  (the `apps/platform` editing surface those phases now write through)

---

## Global Constraints

_Every epic's sub-issues implicitly include these. Copied from the specs +
`CLAUDE.md`._

- **Layer order per feature:** `config → cms → service → ui → web` when config
  changes are involved, otherwise `cms → service → ui → web`. `db` is a sibling
  to `service` (only `web` consumes it).
- **Delegation is mandatory:** every layer file is written/changed by its owning
  subagent (`config`/`cms`/`service`/`ui`/`web`/`db`), never hand-authored by the
  orchestrator. Test files go through `test-writer`.
- **Prefer per-layer PRs**, split only where each merges to `main` green on its
  own; only the completing PR carries `Closes #<n>`.
- **Epic + per-layer sub-issues** for any feature spanning 2+ layers — never a
  flat multi-layer issue. All issue creation goes through `board-keeper`.
- **`@blog/ui` stays pure** — no `'use client'`, no Sanity/fetch, token names
  only. Interactivity lives in an `apps/web` client leaf.
- **UPPERCASE key/value consts** (`{ CONSOLE: 'CONSOLE' }`), `as const`, in
  `@blog/config`; unions via `(typeof C)[keyof typeof C]`.
- **Never hand-edit generated types**; after any schema change run `pnpm
typegen` and commit `packages/config/src/sanity/generated/` (re-run until the
  diff is minimal).
- **Migration posture:** additive/optional Sanity changes need no content
  migration — state so per sub-issue. Any `@blog/db` table change needs a
  `drizzle-kit generate` migration (generate = the dry-run), dev-free /
  prod-gated.
- **Secrets never become content** (spec D8): CMS toggles gate visibility only;
  auth-provider/skim/revalidate secrets stay env-driven.
- **`console` preset must reproduce today's site exactly** — the whole refactor
  is non-regressive for the existing deployment or it's wrong.
- **WCAG holds:** accent derives from a hue at fixed verified lightness; the
  neutral ramp stays fixed in v1.
- **i18n:** one language per tenant (spec D10); no CMS localization migration;
  voice-override keys stay per-locale-ready.
- **Verify + review gates** each epic: `pnpm type-check` + `pnpm lint` + `pnpm
test` (via `verify-runner`), then `reviewer` (+ `a11y-reviewer` for ui/web,
  `seo-auditor` for routes/metadata) → `APPROVE` before push. Push and PR are
  each separately human-gated.
- **Spec/docs sync in the same PR:** architecture/contract/env/content-model
  changes update `SPEC.md`; workflow changes update `docs/context/*`.

---

## Dependency graph (what unblocks what)

```
Phase 0 (tenant registry) ──▶ Phase 2 (theme, Postgres) ──▶ Phase 3 (voice B)
                                          │                        │
                                          ├──────▶ Phase 4 (behavior C)
                                          ▼
                              apps/platform (editing surface for 2–4)

Phase 1 (appearance object) ── independent; editorial content, stays in Sanity
Phase 5 (modules: gallery → faq → …) inherits appearance+theme
Phase 6 (portfolio /work) ── independent, can run any time after Phase 1
Phase 7 (contact form) ── gated on M5 foundations (#984/#1091/#1093/#1107)
Phase 8 (tenant resolution) ── gated on Phase 0 + Phases 2–4
                               + its own open decisions (see Phase 8)
```

**Reordered 2026-08-13.** Phase 0 was carved off the front of the old
monolithic Phase 8 and now leads the program. The original ordering rested on
config being stored per _Sanity project_, which made tenancy a purely
downstream concern; storing config in tenant-scoped Postgres rows collapses
that distinction — `site_config` needs a real `tenantId` FK in its very first
migration. Rationale and the exact registry/resolution split live in
`2026-08-13-tenant-config-postgres-admin-design.md` § Sequencing.

Phases 5, 6, 7 are independent of each other and inherit the Phase 1–2 spine
for free. Phase 8 is still last and still carries every blocking decision it
always had — the split moved the cheap half forward, not the risky half.

---

## Phase 0 — Tenant registry

**Delivers:** the `tenants`, `tenant_domains`, and `memberships` tables plus
one seed row for the existing site — the identity every later phase's config
hangs off. **Nothing reads it at request time**: the public site keeps
resolving Sanity from env vars, unchanged. The only consumer is `apps/platform`.
**Spec:** multi-tenant doc (registry half) + the tenant-config doc's
§ Sequencing. **Migration:** three new tables via `drizzle-kit generate`
(dev-free / prod-gated); no existing table or row is touched.

**Epic → sub-issues:**

- **config** — tenant-related UPPERCASE consts (`TENANT_STATUS`, `TENANT_PLAN`,
  `MEMBERSHIP_ROLE` → `OWNER`/`EDITOR`/`READER`) with derived union types.
- **db** — the three Drizzle tables (`tenants`: slug, primaryDomain,
  sanityProjectId, sanityDataset, locale, plan, status; `tenant_domains`;
  `memberships` joining `users` × `tenants` with a role), typed query
  functions, and the single seed row for the live site. `db:generate` → review
  the SQL diff → gated apply.

**Acceptance:** `tenants` returns exactly one row for the existing site;
`memberships` grants that site's owner `OWNER`; `apps/web`'s rendered output
and query count are byte-identically unchanged (nothing on the request path
reads these tables); the generated migration is additive-only.

**Explicitly out of scope** — this is the registry, not resolution: no
host→tenant middleware, no per-tenant Sanity client, no tenant-scoped cache
tags, no provisioning. All of that stays in Phase 8 with its open decisions
intact.

---

## Phase 1 — Section appearance object

**Delivers:** per-section styling knobs (background tone, spacing, container
width, align, divider) on every module, applied by a pure `Section` wrapper.
Nothing else in the program styles correctly without this spine.
**Spec:** theming doc, Feature 1. **Migration:** none (additive optional field).

**Epic → sub-issues:**

- **config** — `BACKGROUND_TONE`, `SPACING_SCALE`, `CONTAINER_WIDTH`, `ALIGN`
  UPPERCASE consts (`packages/config/src/constants/`), each with derived union
  types.
- **cms** — a shared `objects/appearance.ts` object + a `withAppearance()`
  helper (mirrors `titleField`/`defineModulesField`); add the optional
  `appearance` field to every existing `module_*` document schema. Then
  `pnpm typegen`.
- **service** — extend each `service.modules.<type>.v1` projection + view-model
  with `appearance` (`TAppearance | undefined`, no faked defaults).
- **ui** — one pure `Section` atom/molecule mapping `TAppearance` → token-backed
  Tailwind classes (+ stories + tests). Every module organism renders inside it.
- **web** — each `apps/web/src/modules/<type>/` component reads its view-model's
  `appearance` and passes it to `Section` (the only mapping site).

**Acceptance:** an unset `appearance` renders identically to today; setting each
knob visibly changes that section only; `Section` has story + test coverage.

**Detailed plan:** to be written just-in-time (offer at end of this doc).

---

## Phase 2 — Theme-as-content + preset scaffold (sub-projects A + D)

**Delivers:** the `PRESET` registry, the `settings_theme` singleton, the
`web` `<style>` injector, the logo-upload path, and the two presets `console`
(current look, preserved exactly) + `editorial` (de-consoled look). This is the
look ladder end-to-end. **Spec:** configurability doc, A + D. **Migration:**
none (new additive singleton + optional logo field).

**Epic → sub-issues:**

- **config** — the `PRESET` registry (`CONSOLE`/`EDITORIAL` → `{ themeTokens,
voicePack, featureDefaults, chromeOn }`); `FONT_CHOICE`, `RADIUS_SCALE`,
  `DENSITY` consts; the `--font-ui` token name. (Voice-pack + featureDefaults
  slots are declared now, populated in Phases 3–4.)
- **cms** — `settings_theme` singleton (`preset` selector + `accentHue` +
  `headingFont`/`bodyFont` + `radiusScale` + `density`); a `logo` image/file
  field on `settings_site`. Then `pnpm typegen`.
- **service** — `service.settings.theme.v1.getTheme()` resolving preset +
  overrides into concrete token values (deriving the accent ramp from
  `accentHue` at fixed lightness); cache-tagged like other settings. Extend the
  siteSettings fetcher with `logo`.
- **ui** — `BrandMark` variant accepting an image source (falls back to the
  polygon mark recoloured from `--logo-1/2/3`); swap the hardwired `font-mono`
  in `window-chrome-bar-variants.ts` / `toast-variants.ts` /
  `terminal-chip-variants.ts` for `--font-ui`. (+ stories/tests.)
- **web** — the `<style>` theme injector in the root layout emitting resolved
  vars under `:root {…}` and `.dark {…}` (verify against CSP); `next/font`
  wiring for the chosen fonts; logo rendering (uploaded vs. fallback); the
  `console`/`editorial` `themeTokens` bundles.

**Acceptance:** selecting `console` reproduces today's site pixel-for-pixel;
selecting `editorial` yields a serif/neutral, chrome-free look with no
`@blog/ui` edits beyond the two above; a tenant with no theme doc renders the
neutral base; dark mode holds in both presets.

---

## Phase 3 — Voice-as-content (sub-project B)

**Delivers:** per-preset/per-tenant copy. **Preservation is the first task and
gates everything else in this phase.** **Spec:** configurability doc, B + D5.
**Migration:** none Sanity-side; the `en.json` restructure is code, guarded by
the Step-0 completeness check.

**Epic → sub-issues (strict order):**

- **web (Step 0 — preserve, blocks the rest):** inventory every console-voiced
  string in `apps/web/src/i18n/messages/en.json` (the `~$`/`ls`/`whoami`/`auth
login`/`command not found`/`stashed to ~/bookmarks` family per the scout
  inventory) and extract them verbatim into a canonical `console` voice-pack
  file. A test asserts the `console` pack + neutral base together reproduce the
  pre-change `en.json` values key-for-key (nothing lost).
- **web:** neutralize the `en.json` base to generic wording; implement the
  next-intl overlay merge (`neutral base ← preset voice-pack ← CMS override`);
  add the `editorial` voice-pack.
- **config:** wire each preset's `voicePack` slot to its pack.
- **cms:** a curated set of overridable brand-voice keys (toasts, 404, prompt
  labels, empty states) on a settings document, seeded from the packs so the
  `console` voice is represented in CMS. Keys shaped **per-locale-ready** (D10).
  Then `pnpm typegen`.
- **service:** fetch the voice overrides; feed them into the merge.

**Acceptance:** `console` renders today's exact wording; `editorial` renders the
neutral wording; a CMS override changes a single key without touching others;
the Step-0 test proves no console string was lost.

---

## Phase 4 — Configurability / feature-toggle layer (sub-project C)

**Delivers:** `settings_features` — capability toggles, limits, layout
thresholds as content, with preset defaults. **Spec:** configurability doc, C +
D8. **Migration:** none (new additive singleton).

**Epic → sub-issues:**

- **config** — feature-flag keys + limit consts (UPPERCASE).
- **cms** — `settings_features` singleton: toggles (comments/ratings/bookmarks/
  newsletter/analytics), validation limits, layout thresholds (e.g.
  `MIN_H2_HEADINGS_FOR_RAIL`, today hardcoded in `blog-post-page.tsx`). Then
  `pnpm typegen`.
- **config** — each preset's `featureDefaults` slot populated.
- **service** — a features fetcher; cache-tagged.
- **web** — read features; gate rendering; replace the hardcoded threshold read
  with the resolved value. **Env-locked capabilities stay env** (auth providers,
  skim `ANTHROPIC_API_KEY`, `SANITY_REVALIDATE_SECRET`) — the toggle only
  controls visibility. The plan names each flag CMS-eligible vs. env-locked.

**Acceptance:** toggling a capability off in CMS hides it; a secret-gated
capability can't be enabled by CMS alone; presets supply sane defaults; an
absent features doc = current code behavior.

---

## Phase 5 — New page-builder modules (catalogue)

**Delivers:** new modules, built in order **`module_gallery` → `module_faq` →**
the remaining catalogue (`module_projectGrid`, `module_featureGrid`,
`module_testimonial`, `module_logoWall`, `module_stats`, `module_embed`, …).
Each inherits Phase 1 appearance + Phase 2 theme for free. **Spec:** theming
doc, Feature 3. **Migration:** none (new module types + widened `allow` are
additive).

**Structure:** one shared tracking **epic**; each module is **one issue** under
it (single-ish layer chain — a module is not itself a multi-layer epic). Per
module, the steps (no config-const step — the `_type` derives from the schema):

- **cms** — `module_<name>` schema (`titleField` + display fields +
  `appearance`); add to the relevant pages' `defineModulesField({ allow })`.
  Then `pnpm typegen` so `TModuleType` picks up the `_type`.
- **service** — `service.modules.<name>.v1` (query + transformer + view-model +
  cache tags).
- **ui** — a pure organism (+ stories + tests). For `module_faq`, the disclosure
  interactivity is an `apps/web` client leaf per `web-component-practices`; the
  organism stays pure.
- **web** — register the component in `MODULE_MAP` (the
  `Record<Exclude<TModuleType, 'module_hero'>, …>` makes a missing registration
  a compile error).

**Acceptance:** each module places in the page builder, renders with appearance
knobs, and (gallery) lightbox / (faq) accordion works; `MODULE_MAP` compiles.

---

## Phase 6 — Portfolio content type (`/work`)

**Delivers:** a first-class `project` document + `/work` surfaces, mirroring
`post`. Independent — can run any time after Phase 1. **Spec:** theming doc,
Feature 5. **Migration:** none (new type + new routes).

**Epic → sub-issues:**

- **config** — add `work`, `work/*` to `RESERVED_SLUGS`.
- **cms** — `project` document (title, slug, client, role, stack, year,
  `outcomeMetrics`, `heroImage`, `gallery`, `body`, `seo`, `featured`); reuse
  `category`/`tag`, the `seo` object, `imageWithAlt`. Then `pnpm typegen`.
- **service** — a `service.pages.work.*` slice (index + detail + pagination).
- **ui** — reuse `PostsSection`/`PostCard` where shapes align, else a thin
  `ProjectCard` variant (+ stories/tests).
- **web** — `/work` (+ `/work/page/N`) and `/work/[slug]` routes cloning the
  blog-index / post-detail composition; `generateMetadata` per
  `seo-and-metadata`; sitemap + optional RSS; JSON-LD `CreativeWork`.

**Acceptance:** `/work` lists projects, `/work/[slug]` renders detail with
metadata + JSON-LD; posts untouched; `/work` in the sitemap.

---

## Phase 7 — Contact form / lead capture

**Delivers:** the one module with a write path. **Gated on M5 foundations**
(#984 db, #1091 input atoms, #1093 status tokens, #1107 Resend helper) — do not
start before those land. **Spec:** theming doc, Feature 4. **Migration:** a new
`leads` table needs a `drizzle-kit generate` migration (dev-free / prod-gated).

**Epic → sub-issues:**

- **db** — a `leads` table (name, email, message, sourcePage, createdAt; sibling
  to `subscribers`) + typed insert. `db:generate` → review SQL → gated apply.
- **cms** — `module_contactForm` document (heading, intro, recipient/label
  config); add to `defineModulesField({ allow })`; `pnpm typegen`.
- **ui** — a `ContactForm` organism on the existing `TextInput`/`Textarea`
  atoms, states bound to status tokens (+ stories/tests).
- **web** — a client-island form + server action writing via `@blog/db` +
  notification email via the Resend helper; honeypot / rate-limit spam
  mitigation; register in `MODULE_MAP`.

**Acceptance:** submitting stores a row and emails a notification; validation +
spam mitigation work; no CRM/inbox UI (non-goal).

---

## Phase 8 — Tenant resolution

**Delivers:** many client sites off one app, each resolved by host, reading its
own Sanity project and its own tenant-scoped engagement data — consuming the
Phase 0 registry and the Phase 2–4 per-tenant knobs. **Spec:** multi-tenant
doc. **Largest, last, and gated on unresolved decisions — do not ticket until
they're signed off.**

**The registry half is no longer here** — `tenants`/`tenant_domains`/
`memberships` moved to Phase 0 (see the dependency graph note). What remains is
the runtime half, which is where all the risk always was. Carving the tables
out resolved none of the decisions below.

**Blocking open decisions (resolve first, record in the spec, then ticket):**

- **⚠ Revalidation correctness** — tenant-scoped `revalidateTag` is insufficient
  alone on Vercel (the current global `revalidatePath('/', 'layout')` would
  purge every tenant). Settle the tenant-addressable revalidation approach
  before the content-reads epic.
- **`tenantId` timing vs. M5** — `bookmarks`/`subscribers` already exist; decide
  whether `tenantId` lands with the remaining M5 tables (additive) or as a
  backfill, **before** the rest of M5 builds. Phase 0 makes the additive option
  strictly cheaper: the FK target now exists, so any new table can carry
  `tenantId` from creation.
- **Read-token model**, **Studio hosting shape (a vs. b)**, **URL scheme**,
  **Postgres RLS yes/no**, **exact free-tier editor allowance** — per the
  multi-tenant doc's Open Decisions.

**Epic sequence (from the multi-tenant doc, once unblocked):** host→tenant
resolution middleware in `web` (reading the Phase 0 registry, which by now
already exists) → per-tenant content reads (service client factory +
tenant-scoped ISR + tenant-aware revalidation) → engagement tenant-scoping
(`tenantId` + `forTenant` accessor, while tables are empty) → auth tenancy →
provisioning automation + per-project migration runner → Studio-per-tenant →
later (billing, self-serve, cross-tenant admin).

**Acceptance:** two tenants on two hosts serve different content, themes, voice,
and features from one deployment with no cross-tenant leakage (cache tags,
revalidation, engagement queries each covered by a targeted test).

---

## Cross-cutting: how each epic is executed

For every epic above, at build time:

1. `board-keeper` creates the epic + per-layer sub-issues (gather title/body/
   labels/parent up front); sets the epic → In Progress.
2. Write the epic's **detailed bite-sized TDD plan** via
   `superpowers:writing-plans` (just-in-time — it depends on the prior epics'
   real state).
3. Execute per `develop-feature`: delegate each layer to its subagent in
   dependency order (background dispatch), run `pnpm typegen` in-session after
   schema changes.
4. Gates: `verify-runner` → `reviewer` (+ `a11y-reviewer`/`seo-auditor` as
   applicable) → `APPROVE` → commit → **ask to push** → **ask to open PR** →
   board → `ci-watcher` → sweep worktrees.

---

## Self-review (plan ↔ spec coverage)

- Configurability doc A → Phase 2; B → Phase 3; C → Phase 4; D → Phases 2–4
  (registry in 2, voice-packs in 3, feature-defaults in 4). ✔
- Preservation (D5) → Phase 3 Step 0, gating. ✔
- Presets console+editorial (D6) → Phases 2–3. ✔
- Logo (D7) → Phase 2 ui/cms. ✔
- Secrets-stay-env (D8) → Phase 4 + Global Constraints. ✔
- i18n one-language-per-tenant (D10) → Global Constraints + Phase 3 per-locale-
  ready keys + Phase 8 registry `locale`. ✔
- Theming Features 1/3/5 → Phases 1/5/6. Feature 4 → Phase 7. ✔
- Multi-tenant doc → split across Phase 0 (registry tables) and Phase 8
  (resolution runtime), with every blocking decision left on Phase 8. ✔
- Tenant-config doc → supersedes Phases 2–4's storage (Postgres, not Sanity)
  and owns the Phase 0 rationale; admin-panel doc → the `apps/platform` surface
  those phases write through. ✔
- No orphan spec sections; no phase without an owning-layer breakdown.

# Config → Postgres + `apps/platform` — Transition Plan

> **Program transition plan, not a bite-sized TDD task plan.** It sequences the
> pivot into ordered **epics + per-layer sub-issues** ready for `board-keeper`
> ticketing. Per the rollout plan's standing rule, **each epic gets its own
> detailed TDD plan just-in-time when it starts** — later epics depend on
> earlier ones' real outcomes. Don't pre-expand them here.

**Goal:** Move theme, voice, and (later) feature configuration out of Sanity
singletons into tenant-scoped Postgres rows edited through a new `apps/platform`
workspace — without the live site's rendered output changing at any point.

**Architecture:** A `tenants` registry lands first so `site_config.tenantId` is
a real FK from its first migration. Everything is **additive until a single
verifiable cutover**: `apps/web` keeps reading Sanity while the new tables,
queries, and admin UI are built alongside; one epic switches the read path; a
final epic deletes the Sanity schemas. `@blog/ui` is untouched throughout.

**Tech Stack:** Turborepo + pnpm; Next.js 16 App Router; `@blog/db` (Neon +
Drizzle); Auth.js shared-cookie session; Vercel Blob; Sanity Studio v6 (content
only, after this lands).

**Source specs:**

- `docs/superpowers/specs/2026-08-13-tenant-config-postgres-admin-design.md`
- `docs/superpowers/specs/2026-08-13-admin-panel-product-design.md`
- `docs/design-reference/admin-panel-mock.html` + `-corrections.md`
- `docs/superpowers/plans/2026-08-10-configurability-and-multitenant-rollout.md`
  (program sequencing; this plan expands its Phase 0 + Phase 2–4 storage pivot)

---

## Global Constraints

_Every epic's sub-issues implicitly include these._

- **The live site's rendered output must not change** until the deliberate
  cutover in E5, and must not change _visibly_ even then. E5 is the only epic
  that alters what `apps/web` renders from.
- **Delegation is mandatory** — every layer file is written by its owning
  subagent (`config`/`cms`/`service`/`ui`/`web`/`db`); tests via `test-writer`.
- **Per-layer PRs**, split only where each merges to `main` green alone. E5 and
  E6 are called out below as exceptions that must stay single PRs.
- **`@blog/db` schema changes** need `drizzle-kit generate` (generate _is_ the
  dry-run); production Neon applies are human-gated.
- **Sanity production content migrations** are human-gated: dry-run → backup →
  approved run, per `apps/cms/migrations/README.md`.
- **`@blog/db` is a sibling to `@blog/service`** — it never imports it or is
  imported by it. Only `apps/web` and `apps/platform` consume `db`.
- **Verify + review gates** each epic: `pnpm type-check` + `pnpm lint` +
  `pnpm test` via `verify-runner`, then `reviewer` (+ `a11y-reviewer` for
  ui/web, `seo-auditor` for routes/metadata) → `APPROVE` before push. Push and
  PR are each separately human-gated.
- **Spec sync in the same PR** for architecture/contract/env changes.

---

## Current state (verified 2026-08-13)

| Thing                                                     | State                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/cms/.../settings/theme.ts`                          | Shipped. **Has live production data** — migration `20260812T1527` applied |
| `apps/cms/.../settings/voice.ts`                          | Shipped (#1421). No live data expected — just landed, unlikely populated  |
| `packages/service/.../global/theme-settings/`             | Shipped: query + loader + transformer + service                           |
| `apps/web/src/app/layout.tsx` + `build-theme-style-block` | Consumes the theme fetcher; emits `:root{}` + `.dark{}`                   |
| `PRESET_REGISTRY`, voice packs, `deepMergePartial`        | Shipped (#1419). **Storage-agnostic — unaffected by this pivot**          |
| `tenants` / `tenant_domains` / `memberships`              | Do not exist                                                              |
| `site_config`                                             | Does not exist                                                            |
| `apps/platform`                                           | Does not exist                                                            |

**Open issues needing disposition** (see E-nil below): #1420, #1422, #1423,
#1204, #1097.

---

## Epic sequence

Everything through E4 is additive: no epic before E5 changes a single byte of
what `apps/web` renders.

### E0 — Tenant registry _(= rollout plan's Phase 0)_

`tenants`, `tenant_domains`, `memberships` + one seed row for the live site.
Nothing reads them at request time.

- **config** — `TENANT_STATUS`, `TENANT_PLAN`, `MEMBERSHIP_ROLE` UPPERCASE
  consts + derived unions.
- **db** — the three tables, typed queries, seed row. `db:generate` → review
  SQL → gated apply.

**Acceptance:** one tenant row; owner has `OWNER` membership; `apps/web`
output and query count byte-identically unchanged; migration additive-only.

### E1 — `site_config` table

The config store itself, seeded from production's current `settings_theme`
values so the row holds real data from day one.

- **db** — `site_config` per the spec's data model (typed columns for theme,
  `jsonb` for `voiceOverrides`, `tenantId` FK to E0's row, Blob URL columns),
  typed read/write queries, Zod validation schemas per the spec's validation
  section.
- **Data migration** — export current `settings_theme` from Sanity production,
  insert as the seed row. Human-gated. This is a **read** from Sanity, not a
  mutation, so it needs no Sanity migration ceremony — but the Neon insert does.

**Acceptance:** `site_config` holds one row whose values match production's
live `settings_theme` exactly; still nothing reads it; `apps/web` unchanged.

### E2 — `apps/platform` workspace, auth, shell

The app exists and you can log into it. No settings editing yet.

- **config** — workspace alias wiring (`@platform/*`), tsconfig `paths` + vitest
  aliases per `CLAUDE.md`'s alias rule.
- **web/admin** — Next.js workspace; shared Auth.js session (`.valstack.dev`
  cookie); the two-section nav; `admins`-gated Platform section and
  `memberships`-gated Tenant section; **tenants list reading E0's real table**;
  add-tenant entry rendered visibly disabled with a stated reason.

**Acceptance:** login works via the shared session; a non-`admins` user can't
reach Platform; tenants list renders the one real row; no route reads
`site_config` yet.

> **Depends on #1203** (`admins` table) — ticketed, not started. E2 cannot
> start until it lands.

### E3 — Look tab

Theme editing against `site_config`, with the two-tier preview.

- **ui** — any genuinely reusable primitives the tab needs (hue control,
  segmented control) if `COMPONENTS.md` shows no existing fit. **Check
  `packages/ui/COMPONENTS.md` first** — prefer reuse.
- **admin** — the Look page: preset picker, accent hue, logo hue, logo +
  favicon upload (Vercel Blob), fonts, radius, density, terminal chrome;
  inline live preview fed by unsaved form state; reserved full-page preview
  panel; Zod-validated server actions writing `site_config`.

**Acceptance:** every control persists and round-trips; the inline preview
matches production's OKLCH ramps exactly (corrections brief §1); light/dark
preview toggle works on **both** presets (§13); uploads reject oversized and
non-image payloads per the spec's validation section.

### E4 — Voice tab

- **admin** — the 20 curated fields in four groups, writing
  `site_config.voiceOverrides`; inherited values as placeholders; clearing a
  field reverts to preset rather than storing an empty string.

**Acceptance:** an override persists and round-trips; clearing removes the key
from the JSONB rather than storing `""`; the other 19 fields are unaffected.

> **Depends on #1420** (`en.json` neutralization) for the voice ladder to mean
> anything end-to-end — but E4 itself only writes the store, so it can proceed
> in parallel and be verified for real in E5.

### E5 — `apps/web` cutover _(the only risky epic — single PR)_

Switch the read path from `@blog/service` to `@blog/db`.

- **web** — theme resolution and the `<style>` injector read `site_config` via
  `@blog/db`; the next-intl voice ladder (`neutral base ← preset pack ←
tenant override`) reads its override layer from `site_config` instead of
  Sanity; cache tags updated.

**Must stay one PR**: `apps/web` cannot read from both stores at once without
a dual-read shim that would itself need building and then deleting. Splitting
this would red `type-check` between merges.

**Acceptance — this is the whole point of the epic:** the production site
renders **identically** before and after. Verify explicitly, not by assertion:
capture the emitted `<style>` block and a representative set of rendered
routes before the cutover, and diff after. Any delta is a blocking bug, not a
"close enough."

### E6 — Retirement _(pure deletion — single PR)_

Only after E5 is verified **in production**, not just in CI.

- **cms** — delete `settings_theme` and `settings_voice` schemas, their desk
  structure entries, and `docs/context/content-model.md` rows. `pnpm typegen`.
- **service** — delete `features/global/theme-settings/` and its export.
- **config** — regenerate types; confirm no orphan references.

**Acceptance:** typegen diff is clean; nothing imports the deleted fetcher;
`pnpm build` green. **Note:** the Sanity documents themselves can be left in
place — deleting the schema orphans them harmlessly, and keeping them is a
free rollback for one release cycle. Decide at E6 whether to purge.

---

## E-nil — in-flight issue dispositions (do this first, it's cheap)

These are board hygiene, not implementation. One batched `board-keeper`
dispatch.

| Issue       | Now               | Action                                                                                     |
| ----------- | ----------------- | ------------------------------------------------------------------------------------------ |
| #1420       | Open, stopped     | **Keep as-is.** Storage-agnostic; resume any time. Prerequisite for E4/E5 to mean anything |
| #1422       | Open, stopped     | **Close as superseded.** A `@blog/service` voice fetcher is obsolete — E1/E5 replace it    |
| #1423       | Open              | **Rescope.** Voice ladder still needed; override layer now comes from `@blog/db`           |
| #1204       | Ticketed          | **Rescope** from `apps/web` `/admin` route-group to `apps/platform` (spec already says so) |
| #1097       | Ticketed          | **Rescope** `/admin/comments` to `apps/platform`                                           |
| #1421       | Closed, merged    | Leave closed. Its undo is E6, not a reopen                                                 |
| #1419       | Closed, merged    | **Unaffected** — code-owned, storage-agnostic                                              |
| #1415–#1417 | Ticketed          | **Unaffected** — component composition, not storage                                        |
| #1418       | Ticketed          | **Unaffected**                                                                             |
| #1288       | Epic, in flight   | Update body: voice storage is Postgres; #1421's schema is slated for retirement            |
| #1289       | Epic, not started | Update body: `settings_features` never gets a Sanity schema — built directly in Postgres   |

---

## Decisions still open (settle before the epic that needs them)

1. **Which Neon branch does `apps/platform` write to in preview deploys?** Writing
   to production config from a preview deployment would let an unreviewed
   branch mutate the live site's theme. Needed by **E2**.
2. **Does `apps/platform` get its own Vercel project?** The spec assumes
   `admin.valstack.dev`; whether that's a separate project or a domain on the
   existing one affects env wiring and the deploy pipeline. Needed by **E2**.
3. **Full-page preview mechanism** — iframe of the live site needs either a
   save-first flow or a preview-mode URL carrying unsaved config. The product
   doc explicitly defers this and says not to block Look/Voice on it. Confirm
   that still holds at **E3**.
4. **E6 document purge** — delete the orphaned Sanity settings documents, or
   leave them as a rollback path? Needed at **E6**, not before.

## Explicitly NOT in this plan

- **Tenant resolution** (host→tenant middleware, per-tenant Sanity client,
  tenant-scoped ISR, provisioning, the add-tenant wizard) — stays Phase 8 with
  every one of its blocking open decisions, above all tenant-addressable
  revalidation. Nothing here brings it forward.
- **Phase 4 `settings_features`** — the toggle layer gets its own epic once its
  shape is real; this plan only records that it skips Sanity entirely.
- **The remaining admin tabs** (Domain, Email, Subscribers, Comments, Team,
  Danger zone) — designed in the product doc, built later. Subscribers is the
  cheapest follow-on: its table already ships.

## Retention

Delete this plan once E0–E6 have merged and `SPEC.md` reflects the final
shape, per the repo's design-doc retention rule — along with the two
`2026-08-13-*` specs it implements.

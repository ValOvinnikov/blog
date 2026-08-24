# Tenant Creation Flow — Design

**Status:** Design pass. Implements epic 5 ("Provisioning automation") **and**
epic 6 ("Studio-per-tenant") of
[`2026-08-07-multi-tenant-architecture-design.md`](./2026-08-07-multi-tenant-architecture-design.md)'s
sequencing as one design — the next phase after per-tenant content reads
(epic 2a, #1543, shipped). The parent spec lists those as separate epics but
its own step-by-step provisioning narrative includes Studio deployment
alongside the rest — see "Conflicts with the existing mock" §4 for how that
self-contradiction is resolved. Reconciles this design against the existing
UI mock at
[`docs/design-reference/admin-panel-mock.html`](../../design-reference/admin-panel-mock.html)'s
"Add tenant" wizard, which predates and partially conflicts with later-resolved
spec decisions — those conflicts and their resolutions are called out below.

**Date:** 2026-08-15

**Scope:** How a platform operator provisions a brand-new tenant end to end —
Sanity project, seeded starter content, Studio deployment, registry rows, and
domain mapping — triggered from `apps/admin`, executed by CI, with per-step
resumable retry. Excludes self-serve signup, billing, cross-tenant admin
analytics (all explicit non-goals in the parent spec, unchanged here), and the
**per-project migration runner** (a day-2 tool for pushing schema/content
changes to every _existing_ tenant, not part of creating a new one — tracked
as its own future ticket).

## Conflicts with the existing mock — resolved

The mock at `docs/design-reference/admin-panel-mock.html` designed this wizard
before several later spec decisions landed, and the parent spec has one
internal self-contradiction of its own. Each conflict below was raised and
resolved explicitly — not silently absorbed — whether caught during the
initial design pass or by review afterward:

1. **Slug field vs. "custom domains only."** The mock's Details step collects
   a "Slug / subdomain" producing `<slug>.valstack.dev`, implying a
   platform-subdomain URL scheme. The parent spec's Open Decision 5 (resolved
   2026-08-14) is custom-domains-only, no platform subdomain scheme. Resolved:
   the slug is **Studio-only** — it becomes the Studio's own hostname
   (`studio-<slug>.valstack.dev`, a subdomain of the platform's own domain, so
   DNS is ours to control) and never the public site's address. The mock's
   hint text is stale and gets corrected when this ships.
2. **Resumability model.** The mock's wizard UI is built around per-step
   resumable retry (per-step Run/Retry buttons, "earlier steps kept" framing).
   Resolved: build it that way — per-step resumable retry, not full-restart —
   despite the larger engineering scope, since the mock's design intent is
   explicit and deliberate, not decorative.
3. **DNS verification gating "Finish."** The mock's step 6 log sequence ends
   on "Waiting for verification" before the wizard can finish. Resolved:
   don't block — the tenant reaches provisioning-`READY` once the domain is
   _added_ to the shared web app's Vercel project; DNS verification is a
   separate, non-blocking status the tenant detail page shows independently
   (DNS propagation is tenant-controlled and can take hours). Shown via a
   live Vercel API call (domain verification status) on each render of the
   tenant detail page — no polling/cron needed at this scale, the operator
   just refreshes the page to re-check.
4. **The parent spec's own epic 5/6 split contradicts its own provisioning
   narrative.** "Sequencing & epics" lists "Provisioning automation" (epic 5)
   and "Studio-per-tenant" (epic 6) as separate items, but the same doc's
   "Provisioning a tenant" 6-step narrative includes Studio deployment as
   step 3 — the parent spec disagrees with itself. Resolved: this design
   keeps Studio deployment in scope here, matching both the mock's
   end-to-end wizard (it never stops before Studio) and the parent spec's
   step-by-step narrative. Epic 6 becomes redundant once this ships — its
   work lands as a side effect, not a separate epic.
5. **The mock's Details step never collects a domain.** The mock's step 1
   form has only Tenant name / Slug / Plan / Owner email; "Map domain" is a
   later step (6) with no earlier field to draw from. But `tenants.primaryDomain`
   is `NOT NULL` (see Data model) and the Server Action needs a real value at
   insert time, before the workflow's "Map domain" step ever runs. Resolved:
   the wizard's Details step gains a **domain** field, a genuine addition
   beyond the mock's original shape — not something to silently fold in as if
   the mock already had it.

## Architecture

**Trigger — `apps/admin`'s "Add tenant" wizard, matching the mock's shape**
(with the domain field added per §5 above). Step 1 ("Details") collects
tenant name, slug (Studio hostname only, per §1), domain, plan, and owner
email — all client-side, fast. Submitting it is a Server Action that:

1. Resolves the owner email to an existing registered user (`@blog/db` user
   lookup) — the operator picks an _existing_ user, no invite-email flow (a
   non-goal, matches the parent spec's admin-first framing).
2. Inserts `tenants` (with `primaryDomain` from the form, `provisioningStatus:
PENDING`, an empty per-step status map — see Data model — `sanityProjectId`/
   `sanityDataset` left null until provisioning creates them, and `locale`
   defaulted to the platform's default locale — no per-tenant locale choice at
   creation), `tenant_domains`, and the owner's `memberships` row
   (`role: OWNER`).
3. Dispatches the provisioning GitHub Actions workflow
   (`workflow_dispatch` via the GitHub API) with the new tenant's id as
   input.
4. Redirects to the tenant's status page (steps 2–6 of the wizard), which
   polls the tenant row for live per-step status.

**Provisioning workflow — new `.github/workflows/provision-tenant.yml`.**
The `apps/admin` Server Action holds a narrowly-scoped GitHub PAT
(`actions: write` only) to trigger it via `workflow_dispatch` — that's a
real, deliberate exception, distinct from this repo's actual deploy-token
rule: the _deploy_ credentials (Vercel/Sanity Projects API tokens) never
leave the CI environment, staying CI-owned like every other deploy in this
repo (`SPEC.md` §13 — Vercel CLI runs inside GitHub Actions, never from
application code). Only the trigger crosses that boundary; the provisioning
work itself doesn't. Runs five steps, **each independently idempotent**
— checks the tenant's persisted per-step state before acting, so re-dispatching
the same workflow for the same tenant id resumes rather than repeats:

1. **Create Sanity project** — Projects API: project + `production` dataset +
   CORS + a minted read token. Idempotency check: does `tenants.sanityProjectId`
   already have a value? If so, skip creation and reuse it.
2. **Seed content** — a fixed starter template (singletons + one starter post
   - initial navigation — same content every new tenant gets, no per-tenant
     customization at creation time), via a new dedicated seed script
     (`@sanity/client`-based, creating documents directly against the empty
     dataset). `apps/cms/migrations`' existing tooling doesn't fit this: it
     transforms _existing_ documents in an already-populated dataset (defaults
     to `production`, human-gated for real datasets) — a brand-new empty
     dataset needs document creation, not migration. Idempotency check: a
     `seededAt` timestamp on the tenant row.
3. **Deploy Studio** — creates the tenant's own Vercel project (Studio is
   per-tenant deployed, per the parent spec's resolved shape (a)), builds
   `sanity build`, deploys to `studio-<slug>.valstack.dev`. Idempotency
   check: does `tenants.studioVercelProjectId` exist?
4. **Persist the read token** — the `tenants`/`tenant_domains`/`memberships`
   rows already exist from the Server Action (step 1 above); this step
   encrypts and persists the minted Sanity read token (`packages/utils`'
   `encryptSecret`, per epic 2a). No `@blog/auth` involvement — domain-to-
   tenant resolution already works via the existing `tenant_domains` +
   `resolveTenantId` read path (epic 1), so there's nothing new to wire up
   here. Idempotency check: is `sanityReadTokenEncrypted` already set?
5. **Map domain** — adds the tenant's custom domain to the _shared_ web app's
   existing Vercel project (not a new project — frontend topology is shared
   app) via Vercel's Domains API. Idempotency check: is the domain already
   registered on the project? DNS verification is checked but never blocks —
   the step completes once the domain is _added_, regardless of verification
   state.

Each step reports its own status — `idle → running → done`/`failed` — so the
admin UI's per-step Retry button re-dispatches the same workflow and only the
failed-or-later steps actually do work.

**Status report — a direct `updateProvisioningStep` write to Postgres from
the script itself** (revised post-launch, #2002), reusing the same
`DATABASE_URL` connection the workflow already holds for `reactivateTenant`.
Originally designed as a separate `apps/admin` API route, bearer-token
authenticated against a GitHub Actions secret — a lighter mechanism than the
Sanity revalidation webhook's HMAC verification (`apps/web/src/app/api/revalidate/route.ts`),
since this call only ever originated from our own CI runner holding a repo
secret. That route silently dropped a step's status update on any network
failure between the CI runner and `apps/admin`, so a tenant's provisioning
could fail with no trace in the admin UI at all. The direct write removes
that failure class entirely — there's no network hop left to drop.

## Data model

`packages/db/src/schema/tenants.ts` gains:

- `provisioningStatus` (`TENANT_PROVISIONING_STATUS`: `PENDING` / `PROVISIONING`
  / `READY` / `FAILED`) — additive, nullable-then-defaulted column, migration
  required.
- `provisioningSteps` (jsonb) — a map of the five step keys
  (`sanityProject`/`seedContent`/`deployStudio`/`persistToken`/`mapDomain`) to
  `{ status: idle|running|done|failed, error?: string }`. A jsonb column
  avoids a join table at this scale (tens of tenants, five fixed steps) while
  still giving the admin UI everything it needs to render the wizard's
  per-step state.
- `studioVercelProjectId`, `seededAt` — new, nullable, additive per-step
  idempotency markers.
- `sanityProjectId`, `sanityDataset` — **already exist as `NOT NULL`** (no
  default). This design requires relaxing both to nullable via a migration
  (safe/additive — no existing row loses data, and the one production tenant
  already has values for both) — they stay genuinely null until provisioning
  step 1 creates the Sanity project.
- `primaryDomain` and `locale` — **already exist as `NOT NULL`** too, but
  neither needs a migration: the wizard's Details step now collects a domain
  value upfront (see Architecture), and the Server Action supplies the
  platform's default locale at insert time — both columns always get a real
  value at insert, so their existing `NOT NULL` constraint is satisfied as-is.

`@blog/config` gains `TENANT_PROVISIONING_STATUS` and
`TENANT_PROVISIONING_STEP` (the five step keys), both UPPERCASE const pairs
per this repo's convention.

## Layer-contract impact

- **`@blog/config`** — the two new const pairs above.
- **`@blog/db`** — `tenants` schema changes: new nullable columns (additive,
  no backfill) plus relaxing `sanityProjectId`/`sanityDataset` from `NOT NULL`
  to nullable (safe — no existing row loses data, see Data model); new
  queries (`createTenantDraft`, `updateProvisioningStep`,
  `getTenantProvisioningStatus`).
- **`apps/admin`** — the wizard UI (Details form + per-step status/retry
  view, matching the mock's visual shape with corrected slug copy), the
  Server Action.
- **New GitHub Actions workflow** — the actual provisioning logic (Sanity
  Projects API, content seed, Studio Vercel project + deploy, domain add on
  the shared web project), and each step's status report — a direct
  `updateProvisioningStep` write to Postgres from the script itself, not an
  `apps/admin` API route (revised post-launch; the route silently dropped
  updates on any network failure, see #2002). Not owned by any of the eight
  code layers; CI config, same bucket as this repo's other deploy workflows.
- **`@blog/service`, `@blog/ui`, `apps/web`, `@blog/auth`** — untouched. No
  new Sanity read paths beyond what epic 2a already built; the provisioning
  workflow talks to Sanity's _management_ API (Projects), not the read client
  `@blog/service` owns.
- Graph stays acyclic.

## Error handling & testing

A step's failure sets its own `provisioningSteps.<step>.status = 'failed'`
with the error message, and (if it's not the last step) leaves later steps
`idle` — the admin UI's per-step Retry button re-dispatches the workflow,
which resumes via the idempotency checks above rather than repeating
completed work. No automatic rollback of partially-created external resources
(a failed-and-abandoned tenant still needs manual Sanity/Vercel cleanup if the
operator gives up entirely, but that's an explicit non-goal for this design —
resumability handles the common case of "retry until it works").

Testing: `db` query unit tests for the new queries, idempotency-check logic,
and the direct-write status report; `admin-app` Server Action tests (mocked
GitHub API dispatch, mocked db). The GitHub Actions workflow's actual
external-API logic is validated by a dry-run/staging execution rather than
unit tests, matching how this repo already treats its deploy workflows — no
unit tests for `.yml` logic.

## Non-goals (inherited from the parent spec, unchanged)

Self-serve signup, billing/subscription integration, a cross-tenant
super-admin analytics dashboard, migrating to Payload, central multi-project
Studio management. Also new to this design: automatic rollback/cleanup of
partially-provisioned external resources on total abandonment (resumability
covers retry; full teardown is a manual operator action, not built here).

## Spec sync when built

- `SPEC.md` **§13** — provisioning joins the deployment topology
  (per-tenant Sanity project + Studio + domain mapping, CI-triggered from
  `apps/admin`).
- The parent design doc (`2026-08-07-multi-tenant-architecture-design.md`)
  marks **both** epic 5 and epic 6 shipped once this lands (per the §4
  resolution above — epic 6 ships as a side effect, not separately) and notes
  the per-project migration runner as the one piece of epic 5's original
  description still open, tracked as its own ticket. Per the design-doc
  retention rule the doc stays alive until every epic in its sequencing ships.
- `docs/design-reference/admin-panel-mock.html`'s "Add tenant" wizard section
  loses its `deferred` badge and stale slug-as-public-address copy once this
  ships for real.

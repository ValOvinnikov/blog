# Entitlement grants — a super admin unlocks one feature for one tenant

Spike for #6474 (epic #5047). Status: **recommendation, awaiting the owner's
agreement.** Nothing here is built; `docs/features/plans-and-entitlements.md`
describes today's behaviour and is updated only by the tickets below.

## The problem in the code today

Every gate keys off one value, `tenants.plan`, and indexes a per-plan record
with it: `PLAN_REGISTRY[plan]`, `PLAN_LOCALE_LIMIT[plan]` and
`PLAN_ENTITLEMENTS[plan]` (`packages/db/src/constants/tenant.ts`). There are
about twenty such reads:

| Surface                         | Reads                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@blog/db`                      | `isLookFieldEntitled` / `toEffectiveLook` / `pickEntitledLook` (`utils/effective-look/`), `selectLiveLocales` / `getTenantLiveLocales`, `setTenantAdditionalLocales`                                                                  |
| `apps/platform` — server        | `planPageAccess` (nav, `renderTenantScopedPage`, `resolveTenantPageAccess`, `canEditContactRecipient`), `updateFeaturesAction`, `getEnabledCapabilities`, `updateLookAction` + `listRefusedLookFields`, `updateTenantLanguagesAction` |
| `apps/platform` — render/client | `FeaturesPageContent`, `LanguagesPageContent`, `LeadsPageContent`, `StudioMountView` (module packs into `StudioMount`), `LookPageContent`, `useLookFormState` (client, via `TenantPlanProvider`)                                      |
| `apps/web`                      | `getTenantPlan` (cached, tag `tenant-plan:<id>`) → `isCapabilityEnabled`, `isModuleEntitled` / `ModuleGate`, `getSiteConfig` (Look); live locales through `getTenantLiveLocales`                                                      |

So a grant cannot be "one more check" bolted onto a single gate: either every
read learns about grants, or every read stops reading the plan directly. The
recommendation is the second.

## Recommendation

### 1. Resolution — one resolved record, not one more check

Add `TTenantEntitlements` to `@blog/db` — the same shape every gate already
needs, resolved for one tenant:

- `capabilities: TCapability[]`
- `localeLimit: number`
- `lookFields: TLookField[]`
- `modulePacks: TModulePack[]`
- later fields as #5047 adds them (`seats`, `takeawayGeneration`) and #4840
  adds custom domains

and one pure, client-safe resolver beside `effective-look`:
`resolveTenantEntitlements(plan, grants, now)` → the plan's record **unioned**
with every active grant (list fields: set union; `localeLimit`: the larger of
the plan's and the grant's). "Active" is `revoked_at IS NULL AND (expires_at IS
NULL OR expires_at > now)`.

Every gate then reads the resolved record, never `PLAN_*[plan]`:

- the `@blog/db` helpers above take `TTenantEntitlements` instead of a plan;
  `getTenantLiveLocales` and `setTenantAdditionalLocales` read the grants
  themselves, since they already load the tenant;
- `apps/platform` resolves once per request in the tenant layouts and passes the
  record down; `TenantPlanProvider` carries it alongside the plan, so the Look
  form's client-side `toEffectiveLook` sees grants too;
- `apps/web` replaces `getTenantPlan`'s cached value with
  `getTenantEntitlements` — plan and grants read together, cached under the
  **existing** `tenant-plan:<id>` tag, so the revalidation route needs no new
  tag and `check:revalidate-tags-sync` is untouched.

This is the epic's own rule — "no gate names a plan" — taken one step further:
no gate names a plan _record_ either. Because both apps call the same resolver
from `@blog/db`, they cannot drift.

The owner's toggle still applies on top: a grant raises the **ceiling**, it
never switches a capability on. `isCapabilityEnabled` stays
`ceiling.includes(capability) && toggle`.

### 2. Storage — a grants table, not `settings_features`

New table `tenant_entitlement_grants`, modelled on `tenant_suspensions` (an
admin-applied, per-tenant, closable record):

| Column                     | Notes                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| `id` uuid PK               |                                                                               |
| `tenant_id` → `tenants`    | cascade delete                                                                |
| `kind` text                | `ENTITLEMENT_KIND`: `CAPABILITY`, `MODULE_PACK`, `LOOK_FIELD`, `LOCALE_LIMIT` |
| `key` text                 | the capability, pack or Look field; for `LOCALE_LIMIT`, unused                |
| `value` integer, nullable  | only `LOCALE_LIMIT` (the granted language count, default included)            |
| `note` text, nullable      | why — shown in the grants list and the audit row                              |
| `granted_by` → `admins`    | `set null`                                                                    |
| `granted_at`               | `defaultNow()`                                                                |
| `expires_at`, nullable     | none = until revoked                                                          |
| `revoked_at`, `revoked_by` | nullable; a revoked row is kept as history                                    |

A partial unique index on `(tenant_id, kind, key) WHERE revoked_at IS NULL`
allows one open grant per entitlement. `kind`/`key` are `text().$type<>()`, not
a `pgEnum`, so a new grantable kind needs no migration. `ENTITLEMENT_KIND` lives
in `@blog/db` (its own vocabulary, read only by `db` and the two apps on top of
it). Every grant and revoke writes an `audit_events` row: new
`AUDIT_ACTION.ENTITLEMENT_GRANTED` / `ENTITLEMENT_REVOKED`, target
`AUDIT_TARGET_TYPE.TENANT`, details `{ kind, key, value, expiresAt, note }`.

Rejected:

- **Reusing `settings_features`.** Those columns are the owner's switches
  _inside_ the ceiling; storing the ceiling there merges two decisions owned by
  different people and lets an owner's Features save rewrite an operator's
  grant. It also covers only capabilities, not packs, Look or languages.
- **A per-tenant override of `PLAN_ENTITLEMENTS`** (a jsonb column on
  `tenants`). No per-item who/when/expiry, no history after a revoke, and every
  edit is a read-modify-write of the whole blob.

Cost: one indexed query per resolution. The web caches it with the plan (1h
fallback); the platform reads it uncached, once per tenant page request — the
same as `tenants.plan` today. Inside the Neon free allowance.

### 3. Granularity — what can be granted

| Entitlement          | Grantable in v1 | Why                                                                                          |
| -------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| A capability         | yes             | already one key each; "Coming soon" capabilities are refused (nothing to unlock)             |
| A module pack        | yes             | the unit Studio and `ModuleGate` already gate by; per-module grants would need a second gate |
| A Look field         | yes             | `lookFields` is already a per-field list                                                     |
| Language count       | yes             | numeric; `localeLimit` = max(plan, grant)                                                    |
| Seats                | later           | the seat entitlement (#5055) does not exist yet; joins as a kind when it ships               |
| Custom domain        | later           | plan gating is #4840 Order 2; joins as a kind there                                          |
| AI takeaways         | later           | `takeawayGeneration` (#5056) does not exist yet                                              |
| A whole plan's worth | no              | that is a plan change                                                                        |

A grant is independent of the plan:

- **Upgrade** to a plan that already includes the granted item: the grant stays,
  shown as "Included in the plan" and dormant, so a later downgrade still
  honours it. (Recommended over auto-revoking, which would silently undo a
  super admin's decision.)
- **Downgrade**: the grant keeps the item unlocked; everything else follows the
  existing downgrade policy (stop applying, keep what is stored).

### 4. UI flow (`apps/platform`)

- **Who**: SUPERADMIN only. The action is `requireSuperAdmin`-gated server-side;
  `ADMIN` and `MODERATOR` (and every owner) see today's lock with no grant
  button — `isSuperAdmin` decides whether it renders, never whether it is
  allowed.
- **Entry points**: on the operator's `/tenants/{id}` view, a locked control on
  Features, Look and Languages gets a "Grant to this tenant" action. It opens a
  confirmation dialog (Base UI) naming the item and the tenant, with an optional
  expiry date and note; Confirm writes the grant, the audit row and calls the
  site revalidation route (as plan changes do), then `router.refresh()`.
- **Module packs** cannot be granted from inside Studio — `@blog/studio` has no
  database, and must not. They are granted from a **Grants** card on the tenant
  details panel, which also lists every open grant (item, granted by, when,
  expiry, note) with a Revoke action behind its own confirmation.
- **The owner** sees the item unlocked, with a "Granted" badge in place of the
  "Growth plan" badge (fixed platform copy, never Voice). No email in v1.
- **Refusal refresh**: `useSettingsForm` refreshes only when a refusal's plan
  differs from the rendered one. A revoke changes no plan, so the refusal
  carries the resolved record's keys (or the form always refreshes on a
  `NOT_IN_PLAN` refusal — cheaper and recommended).

### 5. Billing interplay (#4840 Order 5)

- The Stripe webhook writes `tenants.plan` and status only. Grants are outside
  its write set, so a subscription sync can neither undo nor overwrite one.
- Stripe never sees a grant: it is not a subscription item and is never charged.
  Discounted or comped pricing, if ever wanted, is a Stripe coupon — a separate
  decision.
- The one shared plan-change path (#4840 Order 4: custom-domain downgrade, seat
  lock) must decide from the **resolved** record, so a granted custom domain or
  seat count is not wound down by a downgrade. This lands when those kinds
  become grantable.

### 6. Revoke and expiry

- Revoke sets `revoked_at`/`revoked_by`, writes the audit row and revalidates.
- Expiry is evaluated at read time; nothing runs when a grant expires. On the
  site the change can lag by the plan cache's 1h fallback — accepted, the same
  window a missed revalidation call has today. No cron.
- What the feature leaves behind follows the downgrade rule exactly: gated
  modules stop rendering, Look falls back to the preset, extra languages switch
  off, toggles clamp on read — and nothing is deleted, so a re-grant restores
  it.

## Tickets (per layer, merged in order)

1. **db** (+ `config` ride-along for the two `AUDIT_ACTION` values) — the
   `tenant_entitlement_grants` table and migration, `ENTITLEMENT_KIND`,
   `TTenantEntitlements`, `resolveTenantEntitlements`, grant / revoke / list
   queries, and entitlement-taking forms of the effective-Look and live-locale
   helpers **beside** the plan-taking ones (expand), so the PR merges green
   alone. No behaviour change.
2. **web** — `getTenantEntitlements` replaces `getTenantPlan`; capabilities,
   module gate, Look and live locales read it. Lands before any grant can be
   written, so the site honours a grant from the first one.
3. **platform** (read path) — tenant layouts resolve once; every reader in the
   table above converts; `TenantPlanProvider` carries the record; Studio gets
   the resolved `modulePacks`.
4. **platform** (write path) — the grant dialog on Features, Look and
   Languages, the Grants card with revoke, both actions behind
   `requireSuperAdmin`, audit + revalidation. Owns the manual-test issue.
5. **db** (contract) — remove the plan-taking helper forms once nothing reads
   them.

Docs: ticket 4 updates `docs/features/plans-and-entitlements.md` (grants,
resolution, the badge) and deletes this doc. No `SPEC.md` change: no layer
contract or data flow changes. Migrations: one additive Drizzle table; no
content migration.

## Open decisions for the owner

1. **Expiry** — optional free date (recommended), a fixed list (30 / 90 days /
   none), or none at all?
2. **Upgrade** — keep a grant dormant when the plan already includes it
   (recommended), or revoke it automatically?
3. **Owner visibility** — a "Granted" badge and no email (recommended), or an
   email like the plan-change one?
4. **Copy** — the dialog, badge and Grants card strings are platform UI copy,
   never Voice; their wording is settled at ticket 4.

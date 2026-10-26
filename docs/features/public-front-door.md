---
title: Public front door
status: planned
layers: [config, db, auth, email, studio, web, platform, worker]
code:
  - apps/platform/src/server/tenants/create-tenant-action.ts
  - apps/platform/src/server/tenants/check-tenant-slug.ts
  - apps/platform/src/server/provisioning/enqueue-provisioning.ts
  - apps/web/src/server/tenant/resolve-tenant/**
epics:
  [
    4840,
    2798,
    4945,
    4946,
    4947,
    4948,
    4949,
    4950,
    4951,
    4952,
    4953,
    4954,
    4955,
    4956,
    4957,
    4958,
    4959,
    4960,
    4961,
    4962,
    4963,
    4964,
    4984,
    5066,
  ]
---

# Public front door

## What it does

The platform will have a public face: a marketing site with pricing, a self-serve signup that creates a site in a few clicks, and Stripe billing with trials. None of it exists. Today every tenant is created by an operator through the platform's Add tenant form, which dispatches a GitHub Actions provisioning workflow; there is no price, no trial, no signup and no public page for the platform itself.

## Surfaces and routes

Decided, not built:

- **Marketing site** — an ordinary `apps/web` tenant, the "platform tenant", with its own `tenants` row and Sanity project, built from the existing page-builder modules and edited by operators through the operator Studio route. Apex and `www` resolve to it through its `tenant_domains` rows.
- **Signup** — in `apps/platform`: `/signup`, then an `/onboarding` wizard for a user with no memberships (site type, name, slug with a live availability check, language, preset and accent), then `/dashboard` with a provisioning progress card. Look, Voice and Features are usable while it runs.
- **Hosts** — a platform host serves `apps/platform` and the Studio: `platform.<domain>`, and `platform.dev.<domain>` on development (the old `admin-dev` host is retired); a rename of this host needs a CORS update on every tenant project; `<slug>.<domain>` serves self-serve tenants through a wildcard on the web projects, with no Vercel call at signup. A custom domain is a paid upgrade.
- **Billing** — Stripe Checkout starts a subscription; the Stripe Customer Portal handles plan changes, payment methods and cancellation.

## Data

Today: `tenants.status` is `ACTIVE`, `SUSPENDED` or `ARCHIVED`; `tenants.plan` is `FREE` or `GROWTH`; no price exists in code. Planned:

- `TENANT_STATUS` gains `TRIAL` and `PAST_DUE` (a pgEnum migration).
- `tenants.site_type` and `site_template_version`; `SITE_TYPE` lives in `@blog/config`, since the starter-content builders read it.
- Terms acceptance stored as `termsAcceptedAt` and `termsVersion`.
- Owner Studio-access columns and an access state: `INVITE_SENT`, `ACTIVATING`, `READY`, `STALLED`.
- One price per plan, written once where Stripe and the pricing page both read it, beside `PLAN_REGISTRY`.
- Stripe webhooks are the source of truth for `plan` and status.

## Configuration

- **Visitor** — signs up and creates one Free site. v1 is Free only.
- **Owner** — upgrades, changes plan and cancels through Stripe; adds a custom domain on a paid plan.
- **Operator** — edits the marketing site in Studio; still adds tenants, routed through the worker instead of GitHub Actions.
- Wizard, progress-card and email copy is fixed platform and transactional copy, never Voice.

## Constraints and invariants

- **Create site commits one transaction**: a tenant with provisioning status `PENDING` and its site type, OWNER membership, `tenant_domains`, `site_config`, `settings_features` and an audit event, then enqueues the worker. The Sanity project is created then, never at signup.
- **Provisioning moves to a new `apps/worker`**, a non-public Vercel project holding the management, encryption, registry, revalidation and Vercel secrets; the platform holds only an enqueue secret. It becomes a third importer of `@blog/db` and of a Sanity SDK. Units take `(tenantId, ctx)`: `ensureInfrastructure`, `inviteOwner`, `applySiteTemplate`, `verifyTenant`, `ensureOwnerAccess`.
- Idempotency is decided from what exists in Sanity and Vercel, never from markers. Seeding is create-if-missing with fixed ids (`starter.<type>.<doc>`), never `createOrReplace`. Every external call has a timeout. Concurrency stays on `beginTenantProvisioning`'s row guard.
- **Owner Studio access** — invite as `viewer` once the project exists, poll for acceptance (every minute for 30 minutes, then hourly, `STALLED` at 3 days, plus Check now), then grant `administrator` on Free. For an owner the worker invited, the Studio mounts only at `READY`, restricted to their login provider; operators, editors and tenants provisioned before the worker get the Studio unconditionally ([embedded studio](./embedded-studio.md)).
- **Templates are plan-layered**: a type's Free layout works alone; Growth adds sections at fixed slots and never re-seeds, so a downgrade leaves coherent pages. v1 types: Blog, Portfolio, Personal/résumé, Docs, Blank.
- **Lifecycle** — `PAST_DUE` keeps the site up for about 14 days of dunning; `SUSPENDED` parks it 30 days, then deletes; abandoned tenants are suspended, then deprovisioned 30 days later. A real deletion path (today deprovisioning only archives) is a prerequisite.
- Built and tested in Stripe test mode before any live key exists; Stripe Tax handles VAT. Where the webhook endpoint lives (platform or worker) is open.
- **A slug is checked before it becomes `<slug>.<domain>`** (built): `checkTenantSlug` (`apps/platform/src/server/tenants/check-tenant-slug.ts`) refuses an invalid DNS label (`SLUG_INVALID`), a platform subdomain in `RESERVED_SUBDOMAINS` (`@blog/config`; `RESERVED_SLUGS` holds only paths) (`SLUG_RESERVED`), and a host already in `tenant_domains` (`SLUG_TAKEN`). `<domain>` is the optional `TENANT_ROOT_DOMAIN`. Operator "Add tenant" and the signup wizard both ask for a **Site address** — the slug alone, with `.<domain>` shown beside the input (the shared `FormSiteAddressInput`, which also describes the input with that suffix) — and store `<slug>.<domain>`; Add tenant returns a server error when `TENANT_ROOT_DOMAIN` is unset. A Growth tenant's own custom domain is connected separately, never typed into Add tenant.
- An explicitly assigned domain must beat another project's wildcard (#4950).
- Out of scope: a cross-tenant analytics dashboard; moving off Sanity.

## Dependencies

- Layers: every app plus the new `apps/worker`; `db`, `auth` (send limits, terms), `email` (onboarding mails), `studio` (`StudioMount` login provider), `config` (reserved subdomains).
- Features: ./tenant-provisioning.md, ./platform-sign-in-and-onboarding.md, ./plans-and-entitlements.md, ./multi-tenancy.md, ./pricing-module.md, ./embedded-studio.md, ./landing-tree.md, ./tenant-access.md.
- Prerequisites: Vercel BotID setup on `/signup` (`withBotId`, `initBotId`; no env var of its own).
- Env vars: Stripe keys and webhook secret, a worker enqueue secret; the worker takes over `SANITY_MANAGEMENT_TOKEN`, `TENANT_TOKEN_ENCRYPTION_KEY`, the registry `DATABASE_URL`, `SANITY_REVALIDATE_SECRET` and `VERCEL_TOKEN`.

## Entry points

What it replaces or extends today:

- `apps/platform/src/server/tenants/create-tenant-action.ts` (operator-only tenant creation)
- `apps/platform/src/server/provisioning/start-provisioning.ts`, `enqueue-provisioning.ts`
- `apps/worker/src/steps/`, `apps/worker/src/cli/provision-tenant.ts`
- `apps/web/src/server/tenant/resolve-tenant/resolve-tenant.ts` (host → tenant)
- `packages/db/src/constants/tenant.ts` (`TENANT_STATUS`, `PLAN_REGISTRY`)

## Tests and stories

None for the feature. The pieces above carry their own tests (`create-tenant-action.test.ts`, `start-provisioning.test.ts`, `resolve-tenant.test.ts`).

## Related

- #4840 — front door epic (design of record).
- Provisioning fixes: #4945, #4946, #4947. Platform tenant: #4948. Subdomains: #4949, #4950.
- Worker: #4951, #4952, #4954, #4961. Owner access: #4953, #4955, #4956, #4957, #4963.
- Signup: #4958, #4959, #4960, #4964. Lifecycle and deletion: #4962, #4984. Prices: #5066.
- #2798 — site templates at tenant creation.

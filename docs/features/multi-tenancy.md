---
title: Multi-tenancy
status: built
layers: [web, service, db, config]
code:
  - apps/web/src/proxy.ts
  - apps/web/src/server/tenant/**
  - apps/web/src/server/request-context/**
  - apps/web/src/utils/is-tenant-shaped-path-segment/**
  - apps/web/src/utils/tenant-cache-tags/**
  - apps/web/src/utils/is-production-environment/**
  - packages/db/src/schema/tenants.ts
  - packages/db/src/schema/tenant-domains.ts
  - packages/db/src/queries/tenant-domains/**
  - packages/db/src/queries/tenants/get-tenant-by-id/**
  - packages/db/src/queries/tenants/get-tenant-sanity-credentials/**
  - packages/db/src/queries/tenants/get-tenant-id-by-sanity-project-id/**
  - packages/db/src/queries/tenants/list-tenants/**
  - packages/service/src/sanity/client/**
  - packages/service/src/sanity/project-cache/**
epics: [4840]
---

# Multi-tenancy

## What it does

One `apps/web` deployment serves every tenant's public site. Each request is matched to a tenant by its `Host` header, and the site renders from that tenant's own Sanity project plus its rows in Neon. A reader sees only the domain they typed; the tenant id never appears in a URL. Each tenant gets its own content, Look, Voice, languages, plan and reader data. Nothing is shared between tenants except code and the global reader account.

## Surfaces and routes

- **Public:** every hostname in `tenant_domains` points at the one web app. `proxy.ts` rewrites each request onto the internal tree `app/[tenant]/[locale]/…`. The `[tenant]` segment is the tenant's UUID and never shows in the browser.
- **Requests the proxy refuses or bypasses:**
  - a first path segment that is tenant-shaped (starts with a UUID), or that cannot be decoded, returns 404;
  - a path whose last segment has a dot (`robots.txt`, `sitemap.xml`, `favicon.ico`, bot probes like `/wp-login.php`), except `…/rss.xml` feeds and Next's `.rsc` requests, is outside the matcher; its route resolves the tenant from `Host` itself;
  - any other path containing a dot passes through unrewritten, without a tenant lookup;
  - `/api/*`, `/_next`, `/_vercel`, `/icon` and `/.well-known` are outside the matcher.
- **Unknown host:** in production, an unmatched host gets 404. Outside production, the proxy falls back to the only `tenants` row when exactly one exists; otherwise it writes the `unresolved-tenant` placeholder, which reads the platform's own Sanity project.
- **Lookup failure:** if the lookup throws (for example, Neon is unreachable), the proxy fails closed with a 503.
- **Platform:** `apps/platform` has no host resolution. It picks a tenant from the URL or a cookie; see [tenant access](./tenant-access.md).

## Data

- **Sanity:** one project and one dataset per tenant, all on the shared `@blog/studio` schema. The platform keeps its own "console" project, which is used only as the non-production fallback.
- **`tenants`:** `name`, `primaryDomain`, `locale` and `additionalLocales`, `plan` and `status` (ACTIVE / SUSPENDED / ARCHIVED). It also holds `sanityProjectId` (unique), `sanityDataset`, the encrypted `sanityReadTokenEncrypted` and `sanityWriteTokenEncrypted`, `provisioningStatus` and `deprovisionedAt`.
- **`tenant_domains`:** a unique `domain` with a `tenantId` foreign key that cascades on delete. This table decides routing. `primaryDomain` only says which domain is canonical; it is the base URL (`https://<primaryDomain>`), with `NEXT_PUBLIC_SITE_URL` as the fallback.
- **Tenant-scoped tables:** these carry `tenantId` and cascade when the tenant is hard-deleted: `bookmarks`, `subscribers`, `site_config`, `settings_features`, `email_config`, `email_templates`, `findings`, `memberships` and `membership_invites`. The Auth.js tables stay global.
- **Caching:**
  - Sanity fetches are tagged `t:<projectId>:<tag>` (`isr()` in `@blog/service`).
  - Neon-backed per-tenant reads are tagged `site-config:<tenantId>`, `settings-features:<tenantId>` and `tenant-plan:<tenantId>`.
  - `/api/revalidate` maps Sanity's `sanity-project-id` header to a tenant. `/api/revalidate-site-config` takes a `tenantId` behind a bearer secret.
  - Sanity clients are cached per project and token.
  - The host → tenant lookup (`resolveTenant`, used by the proxy and every host-resolved route) caches a resolved, servable tenant per host under the one tag `tenant-by-host`, for `TENANT_CONFIG_REVALIDATE_SECONDS` (one hour). A miss is never cached, so a host resolves the moment its tenant is READY or its domain is added. Every `/api/revalidate-site-config` call purges the tag, whichever tenant it names, so an archive, suspension, deprovision or language change takes effect on the next request; a domain removed or repointed without that call keeps resolving for up to the hour.
  - `reviveCachedTenant` restores a cached row's timestamp columns to `Date`s.

## Configuration

- **Operators:** they control which domains route to a tenant and whether it is servable, through [tenant provisioning](./tenant-provisioning.md): the add-tenant wizard, details edits that repoint the primary `tenant_domains` row, deprovisioning, and reactivation.
- **Extra domains:** the platform has no screen for adding domains beyond the primary one. Extra domains come only from `seed-tenant --domain`.
- **Plans:** the plan caps the tenant's live languages through `PLAN_LOCALE_LIMIT` ([languages](./languages.md), [plans and entitlements](./plans-and-entitlements.md)).
- **Editors:** they never see tenancy. Their Studio is already scoped to one project.

## Constraints and invariants

- **The proxy owns the `[tenant]` segment.** `proxy.ts` is the only writer of `[tenant]`, so a route never validates its own tenant param; doing so would mean reading `Host` and forcing dynamic rendering.
- **`x-tenant-id` never gates a write.** The proxy deletes and resets `x-tenant-id` on every request it handles; `/api/*` and dotted final segments are outside the matcher, so the header is never stripped there. Reads may use it through `getRequestTenantId`. `resolveRequestTenant`, which every write gate uses, never reads it.
- **Reads are gated by `isTenantServable`.** The tenant must not be ARCHIVED and must have a project, a dataset and a read token. In production it must also have `provisioningStatus` READY; a null status is refused there.
- **Writes are gated by `isTenantActive`.** The tenant must be ACTIVE with no `deprovisionedAt`. Every tenant-scoped mutation goes through `resolveWritableTenant` or the host write context's `isActive`, never through its own status check. A SUSPENDED site stays readable but accepts no writes, and the contact form, the newsletter signup and the bookmark button render only when `isRequestTenantActive` holds.
- **Only a super admin suspends.** The operator's `/tenants/{id}` overview offers Suspend on an ACTIVE tenant and Reactivate on a SUSPENDED one, never on an archived tenant. Both go through `setTenantSuspension`, which never touches an ARCHIVED or deprovisioned row, then purge the tenant's cached site through the web revalidation call Look and Voice saves use, so the change shows on the next page load.
- **What counts as production.** "Production" means `NEXT_PUBLIC_SANITY_DATASET === 'production'`, never `NODE_ENV`. The fallbacks to the console project or the sole tenant exist only outside production. In production, a missing tenant 404s or renders as having no content.
- **Request context comes first.** `enterRequestContext(params)` must run first in every `[tenant]/[locale]` layout, page and `generateMetadata`. Calling it twice in one request with different params throws.
- **Isolation is by query.** Every `@blog/db` function that touches tenant data takes an explicit `tenantId`. There is no row-level security.
- **No build-time tenant list.** `dynamicParams` stays on, and each `(tenant, locale, slug)` path renders and caches on first request.

## Dependencies

- **Layers:** `@blog/db` resolves domains and tenant rows and decrypts tokens. `@blog/service` builds per-tenant Sanity clients and tags. `@blog/config` supplies `ITenantLocalizedParams` and `TENANT_WRITE_REFUSAL`.
- **Features:** [rendering and caching](./rendering-and-caching.md), [languages](./languages.md), [look](./look.md), [voice](./voice.md), [errors and 404](./errors-and-404.md), [seo and feeds](./seo-and-feeds.md), [reader auth](./reader-auth.md), [tenant provisioning](./tenant-provisioning.md).
- **Env:** `DATABASE_URL` and `TENANT_TOKEN_ENCRYPTION_KEY` (`@blog/db`); `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` and `SANITY_API_READ_TOKEN` (the console fallback and the production check); `NEXT_PUBLIC_SITE_URL`; `SANITY_REVALIDATE_SECRET` and `SITE_CONFIG_REVALIDATE_SECRET`.

## Entry points

- `apps/web/src/proxy.ts`
- `apps/web/src/server/tenant/resolve-tenant/resolve-tenant.ts`
- `apps/web/src/server/tenant/request-tenant/request-tenant.ts`
- `apps/web/src/server/tenant/write-gate/write-gate.ts`
- `apps/web/src/server/tenant/tenant-sanity-context/tenant-sanity-context.ts`
- `apps/web/src/server/request-context/request-context.ts`
- `packages/db/src/queries/tenant-domains/get-tenant-by-domain/get-tenant-by-domain.ts`
- `packages/service/src/sanity/client/client.ts`
- `packages/service/src/sanity/query/isr.ts`

## Tests and stories

- `apps/web/src/proxy.test.ts`, plus co-located tests under `apps/web/src/server/tenant/**` and `apps/web/src/server/request-context/`. There are `__mocks__` for `request-tenant`, `tenant-base-url` and `request-context`.
- `apps/web/src/utils/is-tenant-shaped-path-segment/` and `tenant-cache-tags/` tests.
- `@blog/db` query tests under `packages/db/src/queries/tenant-domains/**` and `queries/tenants/**`. They run against PGlite (`packages/db/src/testing/`).
- `packages/service/src/sanity/client/client.test.ts` and `project-cache/project-cache.test.ts`.
- No Storybook stories; this feature has no UI.

## Related

- 4840: platform front door epic. It adds wildcard `<slug>.<domain>` resolution, the platform tenant, and the TRIAL / PAST_DUE statuses.
- 4949: reserved subdomains and slug availability check (under 4840).
- 4950: wildcard subdomain on the web projects (under 4840).
- 2440: measure the per-request tenancy cost, then cache the host → tenantId lookup.
- 2682: verify the tenant-scoped path purge against a real running site (under 2440).
- 4844: row-level security as a second guard on tenant isolation.

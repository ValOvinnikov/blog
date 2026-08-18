# admin

> The operator/tenant admin panel: a Next.js app for managing tenants and their site configuration.

This app is a **sibling to `apps/web`**, not downstream of it — its own
Next.js deployment and domain, sharing only the Auth.js session and the Neon
database. It exists because the admin surface is a form-heavy internal tool
(tenant provisioning, Look/Voice site config) with no public traffic and no
SEO surface, so it has none of `apps/web`'s content-rendering or
Sanity-fetching concerns.

## Layer contract

- **Depends on:** `@blog/ui`, `@blog/db`, `@blog/auth`, `@blog/config`,
  `@blog/utils`, `@blog/tailwind-config`, plus Base UI (`@base-ui/react`) for
  interactive primitives, installed and styled directly in this app.
- **Consumed by:** nothing — it is a deployable app, not a workspace
  dependency.
- **Never imports:** `sanity`/`next-sanity`/`@sanity/*` or `@blog/service`.
  All relational reads and writes go through `@blog/db`'s exported query and
  mutation functions — no Drizzle, no Neon client, no SQL here. Nothing is
  added to `@blog/ui` for this app; Base UI parts are styled in place instead.

Authorization is this app's own responsibility, layered on top of the shared
session `@blog/auth` provides: a Platform route requires an `admins` row, a
Tenant route requires a `memberships` row for the routed tenant. `@blog/auth`
supplies authentication only — it has no opinion on either.

## Layout

- `src/app/[locale]/` — routes. The `[locale]` segment is single-locale
  (`next-intl` with `localePrefix: 'never'`), used to route UI copy through
  message catalogs rather than to serve multiple languages.
  - `(platform)/` — `admins`-gated routes (tenant list, add-tenant wizard).
  - `dashboard/(tenant)/` and `t/[tenantSlug]/` — `memberships`-gated tenant
    routes (Look/Voice settings), reached with and without an explicit tenant
    slug in the URL.
  - `unauthorized/` — the page shown when a signed-in session fails a gate.
- `src/app/api/` — Route Handlers: the Auth.js catch-all, the dashboard
  tenant-select endpoint, and the tenant-provisioning status callback.
- `src/components/` — one folder per component (component file,
  `*-variants.ts`, co-located test, `index.ts` barrel), covering the admin
  shell, sidebar/topbar, tenant management, and the Look/Voice settings forms.
- `src/server/` — Server Actions and server-only helpers, grouped by feature:
  `auth/` (the authorization gates), `provisioning/`, `site-config/`,
  `tenants/`, `email/`.
- `src/utils/` — framework-free helpers (route builders, formatting,
  validation limits), one file per purpose.
- `src/config/` — app-level configuration (font loaders).
- `src/i18n/` — the `next-intl` routing config and the single `en.json`
  message catalog.
- `src/testing/` — shared test fixtures and a custom render helper.

Shared UI primitives come from `@blog/ui`; see
[`packages/ui/COMPONENTS.md`](../../packages/ui/COMPONENTS.md) for the full
component index rather than duplicating it here.

## Scripts

| Script       | Command                          |
| ------------ | -------------------------------- |
| `dev`        | `pnpm --filter admin dev`        |
| `build`      | `pnpm --filter admin build`      |
| `start`      | `pnpm --filter admin start`      |
| `lint`       | `pnpm --filter admin lint`       |
| `type-check` | `pnpm --filter admin type-check` |
| `format`     | `pnpm --filter admin format`     |
| `test`       | `pnpm --filter admin test`       |

The root-level `pnpm type-check`, `pnpm lint`, and `pnpm test` run every
workspace's equivalent script through Turborepo, this one included.

## Further reading

- [`../../SPEC.md`](../../SPEC.md) — architecture, layer contracts, and the
  admin panel's place in the monorepo.
- [`../../packages/ui/COMPONENTS.md`](../../packages/ui/COMPONENTS.md) —
  every `@blog/ui` component, its props, and its compound slots.
- [`../../docs/context/environment-variables.md`](../../docs/context/environment-variables.md) —
  the full env var reference, including every var this app reads.
- [`../../docs/context/getting-started.md`](../../docs/context/getting-started.md) —
  local setup: install, env vars, scripts.

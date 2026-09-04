import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Single validated entry point for the admin app's environment.
export const env = createEnv({
  server: {
    // `@blog/email`'s `sendEmail` reads its own byte-identical copy of this
    // var to actually send (magic-link via `@blog/auth`, and this app's own
    // operator-alert route) — this app's copy exists so the tenants list can
    // read it directly to show the "email alerts not configured" banner.
    // Optional: absent, magic-link and operator-alert sends fail at send
    // time; every other sign-in method is unaffected.
    RESEND_API_KEY: z.string().min(1).optional(),
    // Vercel's standard read-write token for the Blob store the Look tab's
    // logo/favicon uploads write to (`@vercel/blob`'s `put`/`del`).
    // Provisioning the store is human-gated console work, not something a
    // dev/CI environment necessarily has — optional here so its absence
    // surfaces as a readable "uploads aren't configured" error from the
    // upload action rather than an import-time crash.
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    // Base URL of the `apps/web` deployment this app's Look/Voice saves call
    // after a successful `site_config` write, to revalidate `apps/web`'s
    // cache on-demand instead of waiting out the 3600s fallback window.
    // Optional (feature-flag-by-absence, paired with
    // `SITE_CONFIG_REVALIDATE_SECRET` below): absent, the call is skipped
    // and logged — the save itself still succeeds.
    WEB_APP_URL: z.string().url().optional(),
    // MUST be byte-identical to `apps/web`'s own `SITE_CONFIG_REVALIDATE_SECRET`:
    // sent as a bearer token to `apps/web`'s `/api/revalidate-site-config`
    // route, which compares it against its own copy and rejects a mismatch
    // with 401.
    SITE_CONFIG_REVALIDATE_SECRET: z.string().min(1).optional(),
    // A narrowly-scoped (`actions: write` only) GitHub PAT used to trigger
    // both `provision-tenant.yml` (the "Add tenant" wizard) and
    // `deprovision-tenant.yml` (the tenant status page's "Deprovision
    // tenant" control) via `workflow_dispatch` — a deliberate exception to
    // keeping deploy-adjacent credentials inside CI: only the trigger
    // crosses into application code, never the provisioning/deprovisioning
    // work itself. Optional: absent, the dispatch call is skipped and
    // logged — the triggering action still succeeds, so an operator can
    // retry once this is configured.
    TENANT_PROVISIONING_GITHUB_TOKEN: z.string().min(1).optional(),
    // The `owner/repo` this app's own Server Actions dispatch
    // `provision-tenant.yml`/`deprovision-tenant.yml` against — this call
    // originates from `apps/platform` itself, not a CI job, so there's no
    // Actions-provided variable to read the target repo from; it must be
    // configured explicitly. Optional, paired with
    // `TENANT_PROVISIONING_GITHUB_TOKEN` above — absent, the dispatch is
    // skipped and logged the same way a missing token is.
    TENANT_PROVISIONING_GITHUB_REPO: z
      .string()
      .regex(/^[^/\s]+\/[^/\s]+$/, 'Expected "owner/repo".')
      .optional(),
    // Local-dev-only escape hatch forwarded as the `adminAppBaseUrl`
    // workflow_dispatch input, letting a developer point a manual
    // provisioning run at a tunneled local `apps/platform` (e.g. a Tailscale
    // funnel URL) instead of the production admin app — must never be set in
    // the production Vercel project. Optional: absent, the input is omitted
    // entirely and CI falls back to the production `ADMIN_APP_BASE_URL`
    // Environment variable, unchanged from today.
    TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE: z.string().url().optional(),
    // Forwarded as `provision-tenant.yml`'s `tenantSanityDataset`
    // workflow_dispatch input, letting this deployment pick which dataset
    // new tenants' Sanity projects get created in; also forwarded as the
    // `environment` input to both `provision-tenant.yml` and
    // `deprovision-tenant.yml` — same posture as
    // `WEB_ANALYTICS_ENABLED` (`apps/web/src/utils/env/env.ts`): `VERCEL_ENV`
    // can't reliably tell a dev deployment apart from real production, so
    // this is an explicit opt-in set by hand per Vercel project. Optional:
    // absent, the input is omitted and CI falls back to the
    // `TENANT_SANITY_DATASET` GitHub Environment default. Always overridden
    // by `TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE` above when that is set.
    TENANT_PROVISIONING_DATASET: z
      .enum(['development', 'production'])
      .optional(),
    // Read-scoped Vercel API token the tenant status page uses to check a
    // custom domain's live DNS verification state (Vercel's Domains API) on
    // each render — informational only, never blocks provisioning. Optional:
    // absent, the status page shows "not configured" instead of a live check.
    VERCEL_API_TOKEN: z.string().min(1).optional(),
    // The *shared* `apps/web` Vercel project id — every tenant's custom
    // domain is added to this one project (frontend topology is shared app,
    // not per-tenant), so domain verification is checked against it.
    VERCEL_PROJECT_ID_WEB: z.string().min(1).optional(),
    // Vercel team id, only needed when the account is team-owned (Vercel's
    // API requires it as a query param in that case). Optional even when
    // VERCEL_API_TOKEN is set — a personal-account token needs no team id.
    VERCEL_TEAM_ID: z.string().min(1).optional(),
    // Bearer token this app's `POST /api/internal/operator-alert` route
    // compares an incoming request against, rejecting a mismatch with 401.
    // Optional: absent, the route returns 500 rather than accepting an
    // unauthenticated request.
    OPERATOR_ALERT_SECRET: z.string().min(1).optional(),
    // The `from` address for operator-alert email. Optional: absent, it
    // falls back to Resend's shared testing sender.
    OPERATOR_ALERT_FROM_ADDRESS: z.string().min(1).optional(),
    // Shared Auth.js signing secret — required for this app's session to
    // function at all, byte-identical with `apps/web`'s. Funneled through
    // this module because it's also reused to sign the owner-invite
    // soft-confirmation token (`owner-invite-token.ts`), not only for
    // Auth.js sessions.
    AUTH_SECRET: z.string().min(1),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    WEB_APP_URL: process.env.WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET: process.env.SITE_CONFIG_REVALIDATE_SECRET,
    TENANT_PROVISIONING_GITHUB_TOKEN:
      process.env.TENANT_PROVISIONING_GITHUB_TOKEN,
    TENANT_PROVISIONING_GITHUB_REPO:
      process.env.TENANT_PROVISIONING_GITHUB_REPO,
    TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE:
      process.env.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE,
    TENANT_PROVISIONING_DATASET: process.env.TENANT_PROVISIONING_DATASET,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
    VERCEL_PROJECT_ID_WEB: process.env.VERCEL_PROJECT_ID_WEB,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    OPERATOR_ALERT_SECRET: process.env.OPERATOR_ALERT_SECRET,
    OPERATOR_ALERT_FROM_ADDRESS: process.env.OPERATOR_ALERT_FROM_ADDRESS,
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

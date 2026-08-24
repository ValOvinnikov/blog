import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Single validated entry point for the admin app's environment.
export const env = createEnv({
  server: {
    // Shared Resend "send email" helper (`@admin/server/email/send-email`) —
    // powers the Auth.js Email provider's magic-link, via the `sendEmail`
    // this app injects into `@blog/auth`. Optional: absent, magic-link
    // sign-in fails at send time, every other sign-in method is unaffected.
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
    // MUST be byte-identical to `apps/web`'s own `SITE_CONFIG_REVALIDATE_SECRET`
    // — same posture as `AUTH_SECRET` — sent as a bearer token to
    // `apps/web`'s `/api/revalidate-site-config` route.
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
    // `provision-tenant.yml`/`deprovision-tenant.yml` against — unlike
    // `PLATFORM_DOMAIN` (a CI-side GitHub Environment Variable), this call
    // originates from `apps/admin` itself, not a CI job, so there's no
    // `GITHUB_REPOSITORY`-style var to read the target repo from. Optional,
    // paired with `TENANT_PROVISIONING_GITHUB_TOKEN` above — absent, the
    // dispatch is skipped and logged the same way a missing token is.
    TENANT_PROVISIONING_GITHUB_REPO: z
      .string()
      .regex(/^[^/\s]+\/[^/\s]+$/, 'Expected "owner/repo".')
      .optional(),
    // Shared secret the provisioning workflow sends as
    // `Authorization: Bearer <secret>` when it calls this app's status-callback
    // route after each step — compared with a constant-time check, not an HMAC
    // signature, since this callback only ever originates from CI holding a
    // repo secret (a narrower trust boundary than the Sanity revalidation
    // webhook's signed-payload verification). Optional: absent, the route
    // responds 500 rather than accepting an unauthenticated call.
    TENANT_PROVISIONING_CALLBACK_SECRET: z.string().min(1).optional(),
    // Local-dev-only escape hatch forwarded as the `adminAppBaseUrl`
    // workflow_dispatch input, letting a developer point a manual
    // provisioning run at a tunneled local `apps/admin` (e.g. a Tailscale
    // funnel URL) instead of the production admin app — must never be set in
    // the production Vercel project. Optional: absent, the input is omitted
    // entirely and CI falls back to the production `ADMIN_APP_BASE_URL`
    // Environment variable, unchanged from today.
    TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE: z.string().url().optional(),
    // Read-scoped Vercel API token the tenant status page uses to check a
    // custom domain's live DNS verification state (Vercel's Domains API) on
    // each render — informational only, never blocks provisioning. Optional:
    // absent, the status page shows "not configured" instead of a live check.
    VERCEL_API_TOKEN: z.string().min(1).optional(),
    // The *shared* `apps/web` Vercel project id — every tenant's custom
    // domain is added to this one project (frontend topology is shared app,
    // not per-tenant), so domain verification is checked against it.
    VERCEL_WEB_PROJECT_ID: z.string().min(1).optional(),
    // Vercel team id, only needed when the account is team-owned (Vercel's
    // API requires it as a query param in that case). Optional even when
    // VERCEL_API_TOKEN is set — a personal-account token needs no team id.
    VERCEL_TEAM_ID: z.string().min(1).optional(),
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
    TENANT_PROVISIONING_CALLBACK_SECRET:
      process.env.TENANT_PROVISIONING_CALLBACK_SECRET,
    TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE:
      process.env.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
    VERCEL_WEB_PROJECT_ID: process.env.VERCEL_WEB_PROJECT_ID,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

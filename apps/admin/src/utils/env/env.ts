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
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    WEB_APP_URL: process.env.WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET: process.env.SITE_CONFIG_REVALIDATE_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

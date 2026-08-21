import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Single validated entry point for the web app's environment.
// `env-nextjs` (not `env-core`) is used because this is Next.js: it enforces
// the server/client boundary and throws if a server secret is read on the
// client bundle.
export const env = createEnv({
  server: {
    // Feature-flag-by-absence: the on-demand revalidation route
    // (`/api/revalidate`) 500s without it instead of revalidating.
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
    // Verifies `apps/admin`'s Look/Voice-save revalidation call
    // (`/api/revalidate-site-config`), same feature-flag-by-absence stance
    // as `SANITY_REVALIDATE_SECRET`: absent, the route 500s instead of
    // revalidating.
    SITE_CONFIG_REVALIDATE_SECRET: z.string().min(1).optional(),
    // Both optional (feature-flag-by-absence, same stance as
    // SANITY_REVALIDATE_SECRET): the publish-time skim-generation pipeline
    // (`/api/generate-skim`) returns 503 without them; the reader path is
    // fully unaffected either way.
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    SANITY_GENERATE_SECRET: z.string().min(1).optional(),
    // Feature-flag-by-absence (same stance as the two vars above): Web
    // Analytics (`<Analytics />`) and Speed Insights (`<SpeedInsights />`,
    // `apps/web/src/app/layout.tsx`) each load a same-origin script
    // (`/_vercel/insights/script.js` / `/_vercel/speed-insights/script.js`)
    // that Vercel's edge only proxies when the matching feature is turned on
    // for that project in the dashboard — off, the request falls through to
    // the app's own 404 page (a console MIME-type error).
    // `VERCEL_ENV` can't tell "real production" apart from blog-dev's own
    // production target (both report `production`), so this is an explicit
    // opt-in set only on the Vercel project(s) where those dashboard
    // features are actually enabled — same human-gated console posture as
    // this repo's other one-time Vercel/Sanity setup (`docs/DEPLOY.md`).
    // Named `WEB_` rather than `VERCEL_` because Vercel reserves the entire
    // `VERCEL_` prefix for its own system-injected variables — a custom var
    // with that prefix can never actually be created in the dashboard.
    // Server-only: whether `<Analytics />`/`<SpeedInsights />` render at all
    // is decided in the root layout (a Server Component) before the RSC
    // payload is built, so the flag never needs to reach the client bundle.
    WEB_ANALYTICS_ENABLED: z.enum(['true', 'false']).optional(),
    // Shared Resend "send email" helper (`@web/server/email/send-email`) —
    // powers the Auth.js Email provider's magic-link (via `@blog/auth`) and
    // the newsletter confirmation email (reuses this same helper/var).
    RESEND_API_KEY: z.string().min(1).optional(),
    // The newsletter confirmation email's `from` address
    // (`@web/server/newsletter/newsletter-from-address.ts`), reusing the same
    // `sendEmail` helper: optional, falls back to Resend's own shared
    // testing sender until a verified sending domain is configured.
    NEWSLETTER_FROM_ADDRESS: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  },
  // env-nextjs needs client vars mapped explicitly (bundler can't statically
  // pick them up otherwise).
  runtimeEnv: {
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
    SITE_CONFIG_REVALIDATE_SECRET: process.env.SITE_CONFIG_REVALIDATE_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SANITY_GENERATE_SECRET: process.env.SANITY_GENERATE_SECRET,
    WEB_ANALYTICS_ENABLED: process.env.WEB_ANALYTICS_ENABLED,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEWSLETTER_FROM_ADDRESS: process.env.NEWSLETTER_FROM_ADDRESS,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

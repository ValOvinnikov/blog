import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Single validated entry point for the web app's environment.
// `env-nextjs` (not `env-core`) is used because this is Next.js: it enforces
// the server/client boundary and throws if a server secret is read on the
// client bundle.
export const env = createEnv({
  server: {
    // The on-demand revalidation route (issue #93) isn't built yet; optional
    // until it exists so the module doesn't force an unused required var.
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
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
    // the app's own 404 page (console MIME-type error, issue #1072).
    // `VERCEL_ENV` can't tell "real production" apart from blog-dev's own
    // production target (both report `production`), so this is an explicit
    // opt-in set only on the Vercel project(s) where those dashboard
    // features are actually enabled — same human-gated console posture as
    // this repo's other one-time Vercel/Sanity setup (`docs/DEPLOY.md`).
    // Server-only: whether `<Analytics />`/`<SpeedInsights />` render at all
    // is decided in the root layout (a Server Component) before the RSC
    // payload is built, so the flag never needs to reach the client bundle.
    VERCEL_ANALYTICS_ENABLED: z.enum(['true', 'false']).optional(),
    // Auth.js (#1107): all six optional, same feature-flag-by-absence stance
    // as the Sanity/skim secrets above. Auth.js's own OAuth env-var
    // inference expects exactly these names (`AUTH_{PROVIDER}_{ID|SECRET}`,
    // `AUTH_SECRET`); missing ones just degrade that one sign-in method (or,
    // for AUTH_SECRET, let Auth.js fall back to its own dev-only ephemeral
    // secret) instead of crashing `pnpm dev`/`pnpm build` for anyone without
    // them configured yet.
    AUTH_SECRET: z.string().min(1).optional(),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    // Shared Resend "send email" helper (`@web/server/email/send-email`) —
    // powers the Auth.js Email provider's magic-link (#1107) and, later, the
    // newsletter confirmation email (#1104, reuses this same helper/var).
    RESEND_API_KEY: z.string().min(1).optional(),
    // The Auth.js Email provider's `from` address (`@web/server/auth/auth.ts`).
    // Optional, same feature-flag-by-absence stance as the vars above: unset
    // falls back to Resend's own shared testing sender
    // (`onboarding@resend.dev`), which is fine for local dev/CI. Set to
    // `Sign in <sign-in@mail.valstack.dev>` once a verified sending domain is
    // configured in Resend.
    MAGIC_LINK_FROM_ADDRESS: z.string().min(1).optional(),
    // The newsletter confirmation email's `from` address
    // (`@web/server/newsletter/newsletter-actions.ts`), reusing the same
    // Resend helper/`RESEND_API_KEY` as the Email provider above. Same
    // optional, feature-flag-by-absence stance and fallback sender as
    // `MAGIC_LINK_FROM_ADDRESS`. Set to `Newsletter <news@mail.valstack.dev>`
    // once a verified sending domain is configured in Resend.
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
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SANITY_GENERATE_SECRET: process.env.SANITY_GENERATE_SECRET,
    VERCEL_ANALYTICS_ENABLED: process.env.VERCEL_ANALYTICS_ENABLED,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAGIC_LINK_FROM_ADDRESS: process.env.MAGIC_LINK_FROM_ADDRESS,
    NEWSLETTER_FROM_ADDRESS: process.env.NEWSLETTER_FROM_ADDRESS,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

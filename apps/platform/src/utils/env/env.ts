import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Read here only for the tenants list's "email alerts not configured" banner; `@blog/email` sends with its own copy.
    // @env-required: development, production
    RESEND_API_KEY: z.string().min(1).optional(),
    // Optional so a missing Blob store surfaces as an upload error, not an import-time crash.
    // @env-optional
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    // @env-required: development, production
    WEB_APP_URL: z.string().url().optional(),
    // Must be byte-identical to `apps/web`'s `SITE_CONFIG_REVALIDATE_SECRET`.
    // @env-required: development, production
    SITE_CONFIG_REVALIDATE_SECRET: z.string().min(1).optional(),
    // An `actions: write`-only PAT: only the workflow trigger crosses into app code.
    // @env-optional
    TENANT_PROVISIONING_GITHUB_TOKEN: z.string().min(1).optional(),
    // @env-optional
    TENANT_PROVISIONING_GITHUB_REPO: z
      .string()
      .regex(/^[^/\s]+\/[^/\s]+$/, 'Expected "owner/repo".')
      .optional(),
    // Local dev only; must never be set in the production Vercel project.
    // @env-optional
    TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE: z.string().url().optional(),
    // Set by hand per Vercel project: `VERCEL_ENV` cannot tell a dev deployment from production.
    // @env-optional
    TENANT_PROVISIONING_DATASET: z
      .enum(['development', 'production'])
      .optional(),
    // @env-optional
    VERCEL_API_TOKEN: z.string().min(1).optional(),
    // The one shared `apps/web` project every tenant's custom domain is added to.
    // @env-required: development, production
    VERCEL_PROJECT_ID_WEB: z.string().min(1).optional(),
    // @env-required: development, production
    VERCEL_TEAM_ID: z.string().min(1).optional(),
    // @env-required: development, production
    OPERATOR_ALERT_SECRET: z.string().min(1).optional(),
    // @env-optional
    OPERATOR_ALERT_FROM_ADDRESS: z.string().min(1).optional(),
    // @env-optional
    CONTRAST_RESULT_SECRET: z.string().min(1).optional(),
    // @env-optional
    LOKI_PUSH_URL: z.string().min(1).optional(),
    // @env-optional
    LOKI_USER: z.string().min(1).optional(),
    // @env-optional
    LOKI_TOKEN: z.string().min(1).optional(),
    // Also signs the owner-invite confirmation token, not only Auth.js sessions.
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
    CONTRAST_RESULT_SECRET: process.env.CONTRAST_RESULT_SECRET,
    LOKI_PUSH_URL: process.env.LOKI_PUSH_URL,
    LOKI_USER: process.env.LOKI_USER,
    LOKI_TOKEN: process.env.LOKI_TOKEN,
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // @env-optional
    SANITY_MANAGEMENT_TOKEN: z.string().min(1).optional(),
    // @env-optional
    SANITY_ORGANIZATION_ID: z.string().min(1).optional(),
    // @env-optional
    VERCEL_TOKEN: z.string().min(1).optional(),
    // @env-optional
    VERCEL_TEAM_ID: z.string().min(1).optional(),
    // @env-required: development, production
    VERCEL_PROJECT_ID_WEB: z.string().min(1).optional(),
    // @env-optional
    ADMIN_APP_BASE_URL: z.string().url().optional(),
    // @env-optional
    TENANT_SANITY_DATASET: z.string().min(1).optional(),
    // @env-required: development, production
    WEB_APP_URL: z.string().url().optional(),
    // Must be byte-identical to `apps/web`'s own `SANITY_REVALIDATE_SECRET`.
    // @env-required: development, production
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
    // @env-optional
    WORKER_ENQUEUE_SECRET: z.string().min(1).optional(),
    // @env-optional
    OPERATOR_ALERT_SECRET: z.string().min(1).optional(),
    // @env-optional
    OWNER_EMAIL_FROM_ADDRESS: z.string().min(1).optional(),
  },
  runtimeEnv: {
    SANITY_MANAGEMENT_TOKEN: process.env.SANITY_MANAGEMENT_TOKEN,
    SANITY_ORGANIZATION_ID: process.env.SANITY_ORGANIZATION_ID,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    VERCEL_PROJECT_ID_WEB: process.env.VERCEL_PROJECT_ID_WEB,
    ADMIN_APP_BASE_URL: process.env.ADMIN_APP_BASE_URL,
    TENANT_SANITY_DATASET: process.env.TENANT_SANITY_DATASET,
    WEB_APP_URL: process.env.WEB_APP_URL,
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
    WORKER_ENQUEUE_SECRET: process.env.WORKER_ENQUEUE_SECRET,
    OPERATOR_ALERT_SECRET: process.env.OPERATOR_ALERT_SECRET,
    OWNER_EMAIL_FROM_ADDRESS: process.env.OWNER_EMAIL_FROM_ADDRESS,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Single validated entry point for the service layer's environment. Service is
// server-only (holds the read token, imported only by Server Components), so
// every var lives under `server` — there is no `client`/`clientPrefix` split.
export const env = createEnv({
  server: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).default('production'),
    SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  },
  shared: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

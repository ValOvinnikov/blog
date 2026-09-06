import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Single validated entry point for the db layer's environment. Only the
// pooled `DATABASE_URL` (the runtime HTTP driver every request path goes
// through, via client.ts) is validated here. The unpooled
// `DATABASE_URL_UNPOOLED` is read directly by drizzle.config.ts — a
// build-tool config, not application code, same exception next.config.ts /
// sanity.config.ts already take — since drizzle-kit's CLI runs standalone,
// outside this module's import graph.
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    // @env-required: development, production
    TENANT_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

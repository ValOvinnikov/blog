import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Single validated entry point for the service layer's environment. Service is
// server-only (holds the read token, imported only by Server Components), so
// every var lives under `server` — there is no `client`/`clientPrefix` split.
export const env = createEnv({
  server: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    // Required, no default: every environment (.env.example included) sets the
    // dataset explicitly. A silent 'production' fallback would let a
    // misconfigured preview/dev quietly read production content.
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
    SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  },
  // NODE_ENV is intentionally not validated here: it's a runtime-guaranteed
  // system var (Node/Next/Vitest always set it). client.ts reads it directly.
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Every credential here is optional — feature-flag-by-absence, matching the
// rest of this repo's Auth.js wiring: a missing OAuth/email credential
// disables just that one provider instead of crashing the app. `AUTH_SECRET`
// is likewise optional here (Auth.js itself throws `MissingSecretError` for a
// real production deploy without one, but a local `pnpm dev`/`pnpm build`
// with it unset must not fail at import time).
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1).optional(),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    MAGIC_LINK_FROM_ADDRESS: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

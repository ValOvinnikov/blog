import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// MAGIC_LINK_FROM_ADDRESS is optional — feature-flag-by-absence, matching
// the rest of this repo's Auth.js wiring: left unset, the magic-link
// provider falls back to its default sender instead of crashing the app.
// `AUTH_SECRET` is not a provider credential and is required: Auth.js cannot
// function without it, so leaving it optional only defers the failure to a
// `MissingSecret` error on the first request instead of naming the variable
// at startup. `skipValidation` (below) is what still lets CI/local builds
// that never set it succeed.
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    // @env-optional
    MAGIC_LINK_FROM_ADDRESS: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

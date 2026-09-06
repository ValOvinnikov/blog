import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * The GitHub/Google OAuth credential vars, validated independently of
 * `@blog/auth/utils/env/env` so a page that only needs to know which
 * providers are enabled never requires `AUTH_SECRET` to render.
 */
export const oauthEnv = createEnv({
  server: {
    // @env-optional
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    // @env-optional
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    // @env-optional
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    // @env-optional
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

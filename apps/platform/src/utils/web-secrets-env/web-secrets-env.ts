import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** Secrets the platform shares byte-for-byte with `apps/web`, each under the same name there. */
export const webSecretsEnv = createEnv({
  server: {
    // @env-optional
    INTERNAL_PAGES_SECRET: z.string().min(1).optional(),
    // @env-optional
    PREVIEW_LINK_SECRET: z.string().min(32).optional(),
  },
  runtimeEnv: {
    INTERNAL_PAGES_SECRET: process.env.INTERNAL_PAGES_SECRET,
    PREVIEW_LINK_SECRET: process.env.PREVIEW_LINK_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

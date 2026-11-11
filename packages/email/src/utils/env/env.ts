import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Optional so a missing key fails its own account's sends at call time, never the import.
export const env = createEnv({
  server: {
    // @env-required: development, production
    RESEND_PLATFORM_API_KEY: z.string().min(1).optional(),
    // @env-required: development, production
    RESEND_TENANT_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

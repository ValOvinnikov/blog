import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Single validated entry point for this package's environment. Optional —
// absent means `sendEmail` throws at call time rather than at import time,
// the same feature-flag-by-absence stance as every existing consumer's own
// copy of RESEND_API_KEY.
export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

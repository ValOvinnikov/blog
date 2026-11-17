import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const supportEnv = createEnv({
  server: {
    // @env-optional
    SUPPORT_EMAIL_ADDRESS: z.string().email().optional(),
    // @env-optional
    HELP_CENTRE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    SUPPORT_EMAIL_ADDRESS: process.env.SUPPORT_EMAIL_ADDRESS,
    HELP_CENTRE_URL: process.env.HELP_CENTRE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

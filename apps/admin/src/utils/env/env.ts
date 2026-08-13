import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Single validated entry point for the admin app's environment.
export const env = createEnv({
  server: {
    // Shared Resend "send email" helper (`@admin/server/email/send-email`) —
    // powers the Auth.js Email provider's magic-link, via the `sendEmail`
    // this app injects into `@blog/auth`. Optional: absent, magic-link
    // sign-in fails at send time, every other sign-in method is unaffected.
    RESEND_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

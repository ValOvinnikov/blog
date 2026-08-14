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
    // Vercel's standard read-write token for the Blob store the Look tab's
    // logo/favicon uploads write to (`@vercel/blob`'s `put`/`del`).
    // Provisioning the store is human-gated console work, not something a
    // dev/CI environment necessarily has — optional here so its absence
    // surfaces as a readable "uploads aren't configured" error from the
    // upload action rather than an import-time crash.
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

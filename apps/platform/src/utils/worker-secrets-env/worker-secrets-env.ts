import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** Secrets the platform shares byte-for-byte with `apps/worker`, each under the same name there. */
export const workerSecretsEnv = createEnv({
  server: {
    // @env-optional
    WORKER_ENQUEUE_SECRET: z.string().min(1).optional(),
    // @env-optional
    WORKER_NEWSLETTER_ENQUEUE_SECRET: z.string().min(1).optional(),
  },
  runtimeEnv: {
    WORKER_ENQUEUE_SECRET: process.env.WORKER_ENQUEUE_SECRET,
    WORKER_NEWSLETTER_ENQUEUE_SECRET:
      process.env.WORKER_NEWSLETTER_ENQUEUE_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

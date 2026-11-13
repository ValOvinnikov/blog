import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const stripeEnv = createEnv({
  server: {
    // @env-required: production
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    // @env-required: production
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    // Public by design: it reaches the browser as a prop, so it needs no NEXT_PUBLIC_ copy.
    // @env-required: production
    STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

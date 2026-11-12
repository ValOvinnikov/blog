import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const stripeEnv = createEnv({
  server: {
    // @env-required: production
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    // The signing secret of the Stripe webhook endpoint pointed at `/api/stripe/webhook`.
    // @env-required: production
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  },
  runtimeEnv: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Single validated entry point for the service layer's environment. The two
// API tokens are server-only secrets; the two `NEXT_PUBLIC_` vars are
// client-safe by their own naming convention, so they're declared under
// `client` and readable from any environment (e.g. Storybook) without
// tripping t3-env's server/client access guard.
export const env = createEnv({
  client: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    // Required, no default: every environment (.env.example included) sets the
    // dataset explicitly. A silent 'production' fallback would let a
    // misconfigured preview/dev quietly read production content.
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  server: {
    SANITY_API_READ_TOKEN: z.string().min(1).optional(),
    // Scoped Editor-role token for the publish-time skim pipeline's draft
    // write (`sanity/write-client.ts`). Optional — absent, the pipeline is
    // disabled and the rest of the site is unaffected.
    SANITY_API_WRITE_TOKEN: z.string().min(1).optional(),
  },
  // NODE_ENV is intentionally not validated here: it's a runtime-guaranteed
  // system var (Node/Next/Vitest always set it). client.ts reads it directly.
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});

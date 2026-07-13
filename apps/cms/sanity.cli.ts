import { defineCliConfig } from 'sanity/cli';

import { requireEnv } from './sanity-env';

export default defineCliConfig({
  // Deploy target hostname (<studioHost>.sanity.studio). Env-driven so one
  // config deploys both the dev and prod Studios from CI; unset locally where
  // only `dev`/`migrations`/`typegen` run (which don't use it).
  studioHost: process.env.SANITY_STUDIO_HOSTNAME,
  api: {
    // Env-driven (no hardcoded ids in this public repo). CLI commands (dev,
    // migrations, exports) target whatever SANITY_STUDIO_* points at.
    projectId: requireEnv(
      'SANITY_STUDIO_PROJECT_ID',
      process.env.SANITY_STUDIO_PROJECT_ID,
    ),
    dataset: requireEnv(
      'SANITY_STUDIO_DATASET',
      process.env.SANITY_STUDIO_DATASET,
    ),
  },
  typegen: {
    path: './src/**/*.{ts,tsx}',
    schema: '../../packages/config/src/sanity/generated/schema.json',
    generates: '../../packages/config/src/sanity/generated/types.ts',
    overloadClientMethods: true,
  },
});

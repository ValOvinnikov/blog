import { defineCliConfig } from 'sanity/cli';

import { requireEnv } from './sanity-env';

export default defineCliConfig({
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

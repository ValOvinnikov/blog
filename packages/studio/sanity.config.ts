import { buildStudioConfig } from '@blog/studio/studio-config';

import { requireEnv } from './sanity-env';

// Env-driven (no hardcoded ids in this public repo). Sanity only exposes
// SANITY_STUDIO_* to the Studio bundle — set them in packages/studio/.env locally.
export default buildStudioConfig({
  projectId: requireEnv(
    'SANITY_STUDIO_PROJECT_ID',
    process.env.SANITY_STUDIO_PROJECT_ID,
  ),
  dataset: requireEnv(
    'SANITY_STUDIO_DATASET',
    process.env.SANITY_STUDIO_DATASET,
  ),
  title: 'Blog',
});

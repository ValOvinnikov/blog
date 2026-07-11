import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'ccs8c2no',
    // Dataset is env-driven so CLI commands (dev, migrations, exports) can target
    // e.g. a `development` dataset. Defaults to `production`.
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  typegen: {
    path: './src/**/*.{ts,tsx}',
    schema: '../../packages/config/src/sanity/generated/schema.json',
    generates: '../../packages/config/src/sanity/generated/types.ts',
    overloadClientMethods: true,
  },
});

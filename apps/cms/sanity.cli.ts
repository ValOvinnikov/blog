import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'ccs8c2no',
    dataset: 'production',
  },
  typegen: {
    path: './src/**/*.{ts,tsx}',
    schema: '../../packages/config/src/sanity/generated/schema.json',
    generates: '../../packages/config/src/sanity/generated/types.ts',
    overloadClientMethods: true,
  },
});

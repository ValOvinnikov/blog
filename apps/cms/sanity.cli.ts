import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'ccs8c2no',
    dataset: 'production',
  },
  typegen: {
    path: './src/**/*.{ts,tsx}',
    generates: '../../packages/types/src/sanity.types.ts',
    overloadClientMethods: true,
  },
});

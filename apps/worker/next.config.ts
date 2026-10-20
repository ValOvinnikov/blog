import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const workspaceRoot = resolve(process.cwd(), '../..');
const turbopackRoot = (() => {
  try {
    return dirname(realpathSync(join(workspaceRoot, 'node_modules')));
  } catch {
    return workspaceRoot;
  }
})();

const nextConfig: NextConfig = {
  turbopack: { root: turbopackRoot },
};

export default withWorkflow(nextConfig);

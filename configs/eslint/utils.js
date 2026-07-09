import base from './base.js';
import noUpstreamImports from './no-upstream-imports.js';

/** @type {import("eslint").Linter.Config[]} */
export default [...base, ...noUpstreamImports];

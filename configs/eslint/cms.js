import noUpstreamImports from './no-upstream-imports.js';
import react from './react.js';

/** @type {import("eslint").Linter.Config[]} */
export default [...react, ...noUpstreamImports];

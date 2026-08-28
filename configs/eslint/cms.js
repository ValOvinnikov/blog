import noUpstreamImports from './no-upstream-imports.js';
import react from './react.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  ...noUpstreamImports,
  {
    // Matches web/platform's React-component convention and the actual
    // majority of existing cms code (arrow-const schema/structure helpers).
    files: ['**/*.{ts,tsx}'],
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
    },
  },
];

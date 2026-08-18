import utils from './utils.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...utils,
  {
    // The logger core's entire job is writing structured lines to console.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
];

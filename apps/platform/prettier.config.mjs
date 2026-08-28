import basePrettierConfig from '@blog/prettier-config';

// prettier-plugin-tailwindcss is resolved from the repo root (root
// package.json devDependency), not from here — Prettier loads plugin
// specifiers relative to its cwd, not this config file's directory.
export default {
  ...basePrettierConfig,
  plugins: ['prettier-plugin-tailwindcss'],
};

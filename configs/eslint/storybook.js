import storybook from 'eslint-plugin-storybook';

/**
 * @param {string} packageJsonPath absolute path to the consumer's package.json
 * @returns {import("eslint").Linter.Config[]}
 */
export default function storybookConfig(packageJsonPath) {
  return [
    ...storybook.configs['flat/recommended'],
    {
      // storybook/no-uninstalled-addons resolves its packageJsonLocation
      // option with `path.resolve()` against `process.cwd()`, not the linted
      // file's directory — so it silently breaks whenever ESLint runs from a
      // different cwd than this package (e.g. lint-staged's pre-commit hook,
      // which invokes `eslint --fix` from the repo root). Passing an absolute
      // path here makes it cwd-independent.
      files: ['.storybook/main.@(js|cjs|mjs|ts)'],
      rules: {
        'storybook/no-uninstalled-addons': [
          'error',
          { packageJsonLocation: packageJsonPath },
        ],
      },
    },
  ];
}

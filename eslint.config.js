/**
 * Root-level global ignores only. Every workspace owns its own
 * `eslint.config.js` (extending `configs/eslint/base.js`) for actual linting
 * via `turbo run lint`; this file exists solely so the `lint-staged`
 * pre-commit hook's bare `eslint --fix` invocation — which runs outside any
 * workspace/turbo context — has a config to discover for paths that belong
 * to no workspace. `docs/design-reference/**` is reference material for
 * humans (design specs, an HTML mockup, a reference ThemeToggle), never
 * built or imported — same rationale as its `knip.json` ignore entry.
 */

/** @type {import("eslint").Linter.Config[]} */
export default [{ ignores: ['docs/design-reference/**'] }];

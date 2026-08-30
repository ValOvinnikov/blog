/**
 * Root-level global ignores only. Every workspace owns its own
 * `eslint.config.js` (extending `configs/eslint/base.js`) for actual linting
 * via `turbo run lint`; this file exists solely so the `lint-staged`
 * pre-commit hook's bare `eslint --fix` invocation — which runs outside any
 * workspace/turbo context — has a config to discover for paths that belong
 * to no workspace. `docs/design-reference/**` is reference material for
 * humans (design specs, an HTML mockup, a reference ThemeToggle), never
 * built or imported — same rationale as its `knip.json` ignore entry.
 *
 * This config declares zero rules by design, so any path outside a
 * workspace — including root `scripts/**` (`gen-ui-index.mjs`,
 * `guard-worktree-install.mjs`) — is linted with an empty rule set. That's a
 * deliberate decision (#1863), not an oversight: it's the equivalent of
 * `packages/studio/eslint.config.js`'s explicit `ignores: ['scripts/**', ...]`
 * entry, keeping `.mjs` CLI scripts (stdout is the interface) out of
 * ESLint's remit. Root doesn't need an identical explicit ignore entry
 * because zero rules already apply to every non-workspace path — adding one
 * would be redundant, not more correct.
 */

/** @type {import("eslint").Linter.Config[]} */
export default [{ ignores: ['docs/design-reference/**'] }];

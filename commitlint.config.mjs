// Mechanically enforces this repo's "Conventional commits" convention (see
// CLAUDE.md § Conventions). Runs locally via `.husky/commit-msg` (per-commit,
// instant) and as a CI backstop over each PR's commit range
// (`.github/workflows/commitlint.yml`).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // History also uses `tooling:` (agent/dev-tooling changes) alongside the
    // config-conventional defaults (build, chore, ci, docs, feat, fix, perf,
    // refactor, revert, style, test) — see `git log --oneline` for real
    // usage.
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'tooling',
      ],
    ],
    // Scope is intentionally left unrestricted (no `scope-enum`): history's
    // scopes are free-form area names (service, cms, web, ui, config,
    // deploy, deps, spec, ...). config-conventional does NOT ship a
    // `scope-case` rule (verified by inspecting its `rules` export — there
    // isn't one), so add it explicitly to match every scope actually used in
    // history, which is already lower-case throughout.
    'scope-case': [2, 'always', 'lower-case'],
  },
  // Merge commits ("Merge pull request #NNN from ...", "Merge remote-tracking
  // branch ... into ...") already match commitlint's built-in defaultIgnores,
  // but this repo merges PRs with real merge commits (not squash) AND
  // developers routinely merge origin/main into feature branches locally —
  // both the commit-msg hook and the CI range check hit these, so make the
  // skip explicit rather than relying only on the implicit default (defaults
  // still apply on top of this; `ignores` is additive, not a replacement).
  ignores: [(commit) => commit.startsWith('Merge')],
};

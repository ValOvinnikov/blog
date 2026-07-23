/**
 * `no-restricted-imports` "paths" entry banning value imports of Vitest's
 * globals (`describe`, `it`, `expect`, `vi`, ...) — `@blog/vitest-config`'s
 * shared preset sets `test.globals: true`, so these are real globals and
 * importing them from `'vitest'` is redundant. `import type {...}` stays
 * allowed — only named value imports matching `importNames` are flagged.
 *
 * Every config file that declares its own `no-restricted-imports` rule must
 * spread this into its `paths` array: flat config replaces (never merges) a
 * rule's options wholesale when multiple matching configs set the same rule
 * for the same files, so this can't live in `base.js` alone — see each
 * consumer (`base.js`, `no-upstream-imports.js`, `service.js`, `ui.js`,
 * `web.js`) for where it's spread in.
 */
export const noVitestGlobalsImportPath = {
  name: 'vitest',
  importNames: [
    'describe',
    'it',
    'test',
    'suite',
    'expect',
    'expectTypeOf',
    'assertType',
    'assert',
    'chai',
    'vi',
    'vitest',
    'beforeEach',
    'afterEach',
    'beforeAll',
    'afterAll',
    'onTestFailed',
    'onTestFinished',
  ],
  message:
    'Configured as Vitest globals (globals: true) — use directly, no import.',
};

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CHECK,
  findViolations,
  parseAddedLines,
} from './check-diff-hygiene.mjs';

const COMPONENT = 'apps/web/src/components/card/card.tsx';
const COMPONENT_TEST = 'apps/web/src/components/card/card.test.tsx';
const LOGGER_CORE = 'packages/insight/src/create-logger.ts';
const ROOT_SCRIPT = 'scripts/gen-ui-index.mjs';
const DOC = 'docs/context/claude-code.md';

const added = (file, ...texts) => ({
  file,
  added: texts.map((text, index) => ({ line: index + 1, text })),
});

const checksOf = (files) => findViolations(files).map(({ check }) => check);

describe('findViolations', () => {
  it('flags a bare console call in linted source', () => {
    assert.deepEqual(checksOf([added(COMPONENT, "console.log('x');")]), [
      CHECK.CONSOLE,
    ]);
  });

  it('leaves console calls where no-console is off', () => {
    assert.deepEqual(
      checksOf([
        added(LOGGER_CORE, 'console.error(line);'),
        added(ROOT_SCRIPT, 'console.log(summary);'),
        { ...added(COMPONENT_TEST, 'console.warn(x);'), content: '' },
      ]),
      [],
    );
  });

  it('flags debugger, focused tests and log event literals', () => {
    assert.deepEqual(
      checksOf([
        added(
          COMPONENT,
          '  debugger;',
          "it.only('renders', () => {});",
          "logger.error('auth.link_failed', { error });",
        ),
      ]),
      [CHECK.DEBUGGER, CHECK.FOCUSED_TEST, CHECK.LOG_EVENT_LITERAL],
    );
  });

  it('accepts a log event read from its const', () => {
    assert.deepEqual(
      checksOf([added(COMPONENT, 'logger.error(SIGN_IN_LOG.LINK_FAILED);')]),
      [],
    );
  });

  it('flags conflict markers in any file type', () => {
    assert.deepEqual(checksOf([added(DOC, '<<<<<<< HEAD', '>>>>>>> main')]), [
      CHECK.CONFLICT_MARKER,
      CHECK.CONFLICT_MARKER,
    ]);
  });

  it('flags a committed env file but not the example', () => {
    assert.deepEqual(
      checksOf([added('apps/web/.env.local'), added('apps/web/.env.example')]),
      [CHECK.ENV_FILE],
    );
  });

  it('flags suppressions that give no reason', () => {
    assert.deepEqual(
      checksOf([
        added(
          COMPONENT,
          '// eslint-disable-next-line no-restricted-imports',
          '// @ts-expect-error',
          '/* @ts-ignore */',
        ),
      ]),
      [
        CHECK.UNEXPLAINED_SUPPRESSION,
        CHECK.UNEXPLAINED_SUPPRESSION,
        CHECK.UNEXPLAINED_SUPPRESSION,
      ],
    );
  });

  it('accepts suppressions that give a reason', () => {
    assert.deepEqual(
      checksOf([
        added(
          COMPONENT,
          '// eslint-disable-next-line no-restricted-imports -- mount needs the SDK',
          '// @ts-expect-error the library types omit the overload',
        ),
      ]),
      [],
    );
  });

  it('flags a test title over the limit and passes one at it', () => {
    const atLimit = 'a'.repeat(80);
    const overLimit = 'a'.repeat(81);
    assert.deepEqual(
      checksOf([
        {
          ...added(
            COMPONENT_TEST,
            `  it('${atLimit}', () => {});`,
            `  it.each([1])(\`${overLimit}\`, () => {});`,
          ),
          content: '',
        },
      ]),
      [CHECK.LONG_TEST_TITLE],
    );
  });

  it('flags every comment in a touched test file but not directives', () => {
    const content = [
      '/**',
      ' * @vitest-environment jsdom',
      ' */',
      '// eslint-disable-next-line testing-library/no-node-access -- portal',
      '// arrange',
      'const x = 1;',
      '/**',
      ' * docs',
      ' */',
      "it('works', () => {});",
    ].join('\n');
    const violations = findViolations([
      { file: COMPONENT_TEST, added: [], content },
    ]);
    assert.deepEqual(
      violations.map(({ line }) => line),
      [5, 7, 8, 9],
    );
  });

  it('skips generated files', () => {
    assert.deepEqual(
      checksOf([
        added(
          'packages/config/src/sanity/generated/types.ts',
          'console.log(1)',
        ),
      ]),
      [],
    );
  });
});

describe('parseAddedLines', () => {
  it('maps added lines to their new line numbers per file', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -3,0 +4,2 @@',
      '+one',
      '+two',
      '@@ -10 +12 @@',
      '-old',
      '+new',
      'diff --git a/gone.ts b/gone.ts',
      '--- a/gone.ts',
      '+++ /dev/null',
      '@@ -1 +0,0 @@',
      '-bye',
    ].join('\n');
    assert.deepEqual(Object.fromEntries(parseAddedLines(diff)), {
      'a.ts': [
        { line: 4, text: 'one' },
        { line: 5, text: 'two' },
        { line: 12, text: 'new' },
      ],
    });
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

process.env.BLOG_LINT_TOUCHED = '1';
const { default: baseConfig } = await import('./base.js');

const linter = new Linter();
const TEST_FILE = 'src/a.test.ts';
const TITLE_RULE = 'vitest/valid-title';
const NODE_ACCESS_RULE = 'testing-library/no-node-access';

const ruleIdsFor = (code) =>
  linter
    .verify(code, baseConfig, { filename: TEST_FILE })
    .map(({ ruleId }) => ruleId);

test('a test title saying "instead of" fails lint on a touched file', () => {
  assert.ok(
    ruleIdsFor("it('shows the name instead of the id', () => {});\n").includes(
      TITLE_RULE,
    ),
  );
});

test('a test title saying "Rather Than" fails lint whatever its case', () => {
  assert.ok(
    ruleIdsFor(
      "test('Rather Than guessing, reads the slug', () => {});\n",
    ).includes(TITLE_RULE),
  );
});

test('a behaviour title passes lint', () => {
  assert.ok(
    !ruleIdsFor("it('shows the name', () => {});\n").includes(TITLE_RULE),
  );
});

test('a chained node walk in a test file fails lint', () => {
  const code =
    "import { screen } from '@testing-library/react';\n\nconst id = screen.getByText('a').parentElement.id;\n";
  assert.ok(ruleIdsFor(code).includes(NODE_ACCESS_RULE));
});

test('a reasoned no-node-access disable still suppresses a chained walk', () => {
  const code =
    "import { screen } from '@testing-library/react';\n\n// eslint-disable-next-line testing-library/no-node-access -- structural claim\nconst id = screen.getByText('a').parentElement.id;\n";
  assert.ok(!ruleIdsFor(code).includes(NODE_ACCESS_RULE));
});

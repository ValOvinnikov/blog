import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

import emailConfig from './email.js';

const linter = new Linter();

const lint = (code) =>
  linter.verify(code, emailConfig, { filename: 'src/index.ts' });

for (const specifier of [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/server',
  'next-auth/react',
  '@base-ui/react',
  '@testing-library/react',
  '@floating-ui/react/utils',
  '@shinefold/config/react',
  '@shinefold/config/react/index',
  '@shinefold/ui',
  '@shinefold/db',
  '@shinefold/auth',
  '@shinefold/insight',
  'sanity',
]) {
  test(`email.js bans ${specifier} imports`, () => {
    const messages = lint(`export * from '${specifier}';\n`);

    assert.equal(messages.length, 1);
    assert.equal(messages[0].ruleId, 'no-restricted-imports');
    assert.match(messages[0].message, /must not import/);
  });
}

for (const specifier of [
  '@shinefold/config',
  '@shinefold/config/constants',
  '@shinefold/config/types',
  '@shinefold/config/utils',
  '@shinefold/utils/primitives',
]) {
  test(`email.js allows ${specifier} imports`, () => {
    assert.deepEqual(lint(`export * from '${specifier}';\n`), []);
  });
}

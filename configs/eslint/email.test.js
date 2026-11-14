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
  '@blog/config/react',
  '@blog/config/react/index',
  '@blog/ui',
  '@blog/db',
  '@blog/auth',
  '@blog/insight',
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
  '@blog/config',
  '@blog/config/constants',
  '@blog/config/types',
  '@blog/config/utils',
  '@blog/utils/primitives',
]) {
  test(`email.js allows ${specifier} imports`, () => {
    assert.deepEqual(lint(`export * from '${specifier}';\n`), []);
  });
}

import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

import workerConfig from './worker.js';

const linter = new Linter();

const lint = (code, filename = 'src/index.ts') =>
  linter.verify(code, workerConfig, { filename });

for (const specifier of [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@blog/ui',
  '@blog/ui/button',
  '@blog/service',
  '@blog/service/posts',
  '@blog/auth',
  '@blog/auth/config',
  '@blog/studio',
  '@blog/studio/mount',
  'sanity',
  'sanity/structure',
  'next-sanity',
  'groqd',
]) {
  test(`worker.js bans ${specifier} imports`, () => {
    const messages = lint(`export * from '${specifier}';\n`);

    assert.equal(messages.length, 1);
    assert.equal(messages[0].ruleId, 'no-restricted-imports');
    assert.match(messages[0].message, /apps\/worker must not import/);
  });
}

for (const specifier of [
  'next/server',
  '@sanity/client',
  '@blog/db',
  '@blog/config',
  '@blog/utils',
  '@blog/insight',
  '@blog/email',
]) {
  test(`worker.js allows ${specifier} imports`, () => {
    assert.deepEqual(lint(`export * from '${specifier}';\n`), []);
  });
}

test('worker.js bans JSX', () => {
  const messages = lint('export const x = <div />;\n', 'src/x.tsx');

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-syntax');
});

test('worker.js requires function declarations', () => {
  const messages = lint('export const run = () => 1;\n');

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'func-style');
});

test('worker.js accepts a route handler declaration', () => {
  assert.deepEqual(
    lint(
      'export async function POST() {\n  return new Response(null);\n}\n',
      'src/app/api/route.ts',
    ),
    [],
  );
});

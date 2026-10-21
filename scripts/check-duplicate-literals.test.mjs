import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addedValues,
  collectLiterals,
  scopeOf,
} from './check-duplicate-literals.mjs';

const values = (text) => collectLiterals('a.tsx', text).map((l) => l.value);

test('collectLiterals keeps plain string literals with their line', () => {
  assert.deepEqual(
    collectLiterals('a.ts', "const a = 'tenant-1';\nconst b = `slug`;"),
    [
      { value: 'tenant-1', line: 1 },
      { value: 'slug', line: 2 },
    ],
  );
});

test('collectLiterals skips every exempt position', () => {
  const source = [
    "'use client';",
    "import { x } from '@blog/config';",
    "export * from './a';",
    "vi.mock('@web/utils/logger/logger');",
    "const m = await import('./lazy');",
    "describe('renders', () => {});",
    "const map = { 'aria-label': 1 };",
    "const c = cn('flex');",
    "const t = tv({ base: 'grid' });",
    'const el = <a href="#top" />;',
    "const copy = 'Read the post';",
    "const empty = '';",
  ].join('\n');
  assert.deepEqual(values(source), []);
});

test('collectLiterals skips values an outside standard spells', () => {
  const source = [
    "process.env.NODE_ENV === 'production';",
    "env.X !== 'staging';",
    "'production' === process.env['NODE_ENV'];",
    "vi.stubEnv('NODE_ENV', 'production');",
    "const cookie = { sameSite: 'strict' };",
  ].join('\n');
  assert.deepEqual(values(source), ['NODE_ENV']);
});

test('collectLiterals still collects the same values outside that vocabulary', () => {
  const source = [
    "const mode = 'production';",
    "f('strict');",
    "const o = { mode: 'strict' };",
    "const eq = value === 'production';",
  ].join('\n');
  assert.deepEqual(values(source), [
    'production',
    'strict',
    'strict',
    'production',
  ]);
});

test('addedValues reports only literals whose count grew against the base', () => {
  const current = collectLiterals(
    'a.ts',
    "f('POST'); f('POST'); f('GET'); f('PUT');",
  );
  assert.deepEqual(addedValues("f('POST'); f('GET');", current, 'a.ts'), [
    'POST',
    'PUT',
  ]);
});

test('addedValues treats a new file as adding every literal', () => {
  const current = collectLiterals('a.ts', "f('GET');");
  assert.deepEqual(addedValues('', current, 'a.ts'), ['GET']);
});

test('scopeOf follows workspace dependencies transitively, never into a sibling app', () => {
  const workspaces = [
    { dir: 'apps/web', name: 'web', deps: ['@blog/ui'] },
    { dir: 'apps/platform', name: 'platform', deps: ['@blog/config'] },
    { dir: 'packages/ui', name: '@blog/ui', deps: ['@blog/config'] },
    { dir: 'packages/config', name: '@blog/config', deps: ['react'] },
  ];
  assert.deepEqual([...scopeOf(workspaces, 'apps/web')].sort(), [
    'apps/web',
    'packages/config',
    'packages/ui',
  ]);
});

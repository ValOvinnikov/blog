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
    "const alias = blogPackageAlias('email', import.meta.url);",
    "const m = await import('./lazy');",
    "describe('renders', () => {});",
    "it.each([[1]])('%s', () => {});",
    "describe.each([[1]])('$name', () => {});",
    "const map = { 'aria-label': 1 };",
    "const c = cn('flex');",
    "const t = tv({ base: 'grid' });",
    'const el = <a href="#top" />;',
    "const copy = 'Read the post';",
    "const empty = '';",
  ].join('\n');
  assert.deepEqual(values(source), []);
});

test('collectLiterals skips test-table titles through modifier chains, for and tagged templates', () => {
  const source = [
    "it.skip('title', () => {});",
    "describe.only('title', () => {});",
    "test.concurrent('title', () => {});",
    "it.skip.each([[1]])('%s', () => {});",
    "it.only.each([[1]])('%s', () => {});",
    "describe.concurrent.each([[1]])('$name', () => {});",
    "test.sequential.each([[1]])('%s', () => {});",
    "it.for([[1]])('%s', () => {});",
    "suite.skip.for([[1]])('%s', () => {});",
    "it.each`a|b`('$a', () => {});",
    "describe.skip.each`a|b`('$a', () => {});",
    "it.each`\n a | b\n ${1} | ${2}\n`('$a', () => {});",
  ].join('\n');
  assert.deepEqual(values(source), []);
});

test('collectLiterals still collects titles of calls that are not test tables', () => {
  const source = [
    "other.each([[1]])('%s', () => {});",
    "other.skip('title', () => {});",
    "it.each([[1]]).extra('%s');",
    "list.for`a|b`('$a');",
  ].join('\n');
  assert.deepEqual(values(source), ['%s', 'title', '%s', 'a|b', '$a']);
});

test('collectLiterals skips values an outside standard spells', () => {
  const source = [
    "process.env.NODE_ENV === 'production';",
    "env.X !== 'staging';",
    "'production' === process.env['NODE_ENV'];",
    "env['AUTH_SECRET'];",
    "vi.stubEnv('NODE_ENV', 'production');",
    "screen.getByRole('button');",
    "within(row).findAllByRole('textbox');",
    "queryByRole('switch');",
    "const cookie = { sameSite: 'strict' };",
    "const link = { target: '_blank' };",
    "const doc = { _type: 'page_home' };",
    "type TField = Pick<TDoc, 'title' | 'seo'>;",
    "const ref = { '_type': 'reference' };",
  ].join('\n');
  assert.deepEqual(values(source), []);
});

test('collectLiterals still collects the same values outside that vocabulary', () => {
  const source = [
    "const mode = 'production';",
    "f('strict');",
    "const o = { mode: 'strict' };",
    "const eq = value === 'production';",
    "props['variant'];",
    "const doc = { type: 'page_home' };",
    "f('page_home');",
    "f('button');",
    "screen.getByText('button');",
  ].join('\n');
  assert.deepEqual(values(source), [
    'production',
    'strict',
    'strict',
    'production',
    'variant',
    'page_home',
    'page_home',
    'button',
    'button',
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

test('collectLiterals skips groqd typed builder arguments and isr tags', () => {
  const source = [
    "q.star.filterByType('page_home', 'page_landing');",
    "sub.field('slug.current');",
    "q.star.filterBy('language == $locale').order('publishedAt desc');",
    "post.field('tags[]').deref();",
    "isr(['posts', 'author'], tenant.projectId);",
    "isr('posts', tenant.projectId);",
  ].join('\n');
  assert.deepEqual(values(source), []);
});

test('collectLiterals still collects repeated strings beside groqd and isr', () => {
  const source = [
    "field('slug');",
    "sub.raw('coalesce(showBio,true)');",
    "q.star.filterRaw('defined(slug)');",
    "isr(['posts'], 'tenant-1');",
    "cache.isr(['posts']);",
    "const tags = ['posts'];",
    "const status = 'published';",
  ].join('\n');
  assert.deepEqual(values(source), [
    'slug',
    'coalesce(showBio,true)',
    'defined(slug)',
    'tenant-1',
    'posts',
    'posts',
    'published',
  ]);
});

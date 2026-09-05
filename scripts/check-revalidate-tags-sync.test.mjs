// Fixture-based tests for check-revalidate-tags-sync's extraction and
// classification helpers. Every fixture is a single inline source string —
// the checker resolves nothing across files, so no cross-file/import
// fixtures are needed here.
//
// Run with `node --test scripts/check-revalidate-tags-sync.test.mjs`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  collectServiceTags,
  collectTagsFromSource,
  extractRevalidateTagValues,
  findMissingTags,
  listServiceSourceFiles,
  parseSource,
} from './check-revalidate-tags-sync.mjs';

const REVALIDATE_TAGS_FIXTURE = `
  type TCachedDocumentType = 'blog_post' | 'settings_site';

  const REVALIDATE_TAGS = {
    blog_post: ['post', 'posts', 'homePage'],
    settings_site: ['site-settings'],
  } as const satisfies Record<TCachedDocumentType, readonly string[]>;
`;

describe('extractRevalidateTagValues', () => {
  it('reads every string literal across all array-valued entries', () => {
    const sf = parseSource(
      '/virtual/revalidate-tags.ts',
      REVALIDATE_TAGS_FIXTURE,
    );
    assert.deepEqual(
      [...extractRevalidateTagValues(sf)].sort(),
      ['homePage', 'post', 'posts', 'site-settings'].sort(),
    );
  });

  it('returns an empty set when REVALIDATE_TAGS is not declared', () => {
    const sf = parseSource('/virtual/not-it.ts', 'export const x = 1;');
    assert.deepEqual(extractRevalidateTagValues(sf), new Set());
  });
});

describe('collectTagsFromSource', () => {
  it('reads a single string-literal isr(...) argument', () => {
    const { tags, dynamic, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      `isr('theme-settings', tenant.projectId);`,
    );
    assert.deepEqual([...tags], ['theme-settings']);
    assert.deepEqual(dynamic, []);
    assert.deepEqual(unresolved, []);
  });

  it('reads every string literal in an array-literal isr(...) argument', () => {
    const { tags } = collectTagsFromSource(
      '/virtual/loader.ts',
      `isr(['post', 'author', 'topic'], tenant.projectId);`,
    );
    assert.deepEqual([...tags].sort(), ['author', 'post', 'topic']);
  });

  it('skips a template-literal element with a substitution as dynamic', () => {
    const { tags, dynamic, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      "isr(['modules:hero', `module:${id}`], tenant.projectId);",
    );
    assert.deepEqual([...tags], ['modules:hero']);
    assert.equal(dynamic.length, 1);
    assert.equal(dynamic[0].text, '`module:${id}`');
    assert.deepEqual(unresolved, []);
  });

  it('skips a bare template-literal-with-substitution first argument as dynamic', () => {
    const { tags, dynamic, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      'isr(`module:${id}`, tenant.projectId);',
    );
    assert.deepEqual([...tags], []);
    assert.equal(dynamic.length, 1);
    assert.deepEqual(unresolved, []);
  });

  it('fails on a bare identifier — no resolution is attempted', () => {
    const { tags, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      `
        function getThing(tags) {
          return isr(tags, tenant.projectId);
        }
      `,
    );
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'tags');
  });

  it('fails on a variable, however innocently declared, passed by reference', () => {
    const { tags, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      `
        const myTags = ['post', 'posts'];
        isr(myTags, tenant.projectId);
      `,
    );
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'myTags');
  });

  it('fails on a spread argument', () => {
    const { tags, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      'isr(...someTags, tenant.projectId);',
    );
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, '...someTags');
  });

  it('fails on a computed/function-call argument', () => {
    const { tags, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      'isr(someHelper(), tenant.projectId);',
    );
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'someHelper()');
  });

  it('fails on a non-literal element inside an otherwise-literal array', () => {
    const { tags, unresolved } = collectTagsFromSource(
      '/virtual/loader.ts',
      `isr(['post', someTag, 'author'], tenant.projectId);`,
    );
    assert.deepEqual([...tags].sort(), ['author', 'post']);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'someTag');
  });
});

describe('findMissingTags', () => {
  it('reports nothing missing when every service tag is registered', () => {
    const serviceTags = new Set(['post', 'posts']);
    const revalidateTagValues = new Set(['post', 'posts', 'homePage']);
    assert.deepEqual(findMissingTags(serviceTags, revalidateTagValues), []);
  });

  it('detects a service tag missing from REVALIDATE_TAGS', () => {
    const serviceTags = new Set(['post', 'new-tag']);
    const revalidateTagValues = new Set(['post']);
    assert.deepEqual(findMissingTags(serviceTags, revalidateTagValues), [
      'new-tag',
    ]);
  });
});

describe('the real repo files', () => {
  it('REVALIDATE_TAGS covers every isr(...) tag literal in packages/service/src', () => {
    const revalidateTagsFile = fileURLToPath(
      new URL(
        '../apps/web/src/utils/revalidate-tags/revalidate-tags.ts',
        import.meta.url,
      ),
    );
    const revalidateTagValues = extractRevalidateTagValues(
      parseSource(revalidateTagsFile, readFileSync(revalidateTagsFile, 'utf8')),
    );

    const serviceSrcDir = fileURLToPath(
      new URL('../packages/service/src', import.meta.url),
    );
    const files = listServiceSourceFiles(serviceSrcDir);
    assert.ok(files.length > 0);

    const { tags, unresolved } = collectServiceTags(files);
    assert.deepEqual(unresolved, []);
    assert.deepEqual(findMissingTags(tags, revalidateTagValues), []);
  });
});

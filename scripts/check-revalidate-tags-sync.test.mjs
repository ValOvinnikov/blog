// Fixture-based tests for check-revalidate-tags-sync's extraction +
// comparison helpers, mirroring check-turbo-env-sync.test.mjs's approach:
// inline source strings via `parseSource` instead of touching the real repo
// files, so a refactor of the extractors can't silently lose coverage.
//
// Run with `node --test scripts/check-revalidate-tags-sync.test.mjs`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  collectServiceTags,
  extractRevalidateTagValues,
  extractServiceCallSiteTags,
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

describe('extractServiceCallSiteTags', () => {
  it('reads a single string-literal isr(...) argument', () => {
    const source = `
      const raw = await runQuery(q, {
        tenant,
        ...isr('theme-settings', tenant.projectId),
      });
    `;
    const sf = parseSource('/virtual/loader.ts', source);
    const { tags, dynamic, unresolved } = extractServiceCallSiteTags(
      '/virtual/loader.ts',
      sf,
    );
    assert.deepEqual([...tags], ['theme-settings']);
    assert.deepEqual(dynamic, []);
    assert.deepEqual(unresolved, []);
  });

  it('reads every string literal in an array-literal isr(...) argument', () => {
    const source = `
      ...isr(['post', 'author', 'topic'], tenant.projectId);
    `;
    const sf = parseSource('/virtual/loader.ts', source);
    const { tags } = extractServiceCallSiteTags('/virtual/loader.ts', sf);
    assert.deepEqual([...tags].sort(), ['author', 'post', 'topic']);
  });

  it('skips a template-literal element with a substitution as dynamic', () => {
    const source = `
      ...isr(['modules:hero', \`module:\${id}\`], tenant.projectId);
    `;
    const sf = parseSource('/virtual/loader.ts', source);
    const { tags, dynamic } = extractServiceCallSiteTags(
      '/virtual/loader.ts',
      sf,
    );
    assert.deepEqual([...tags], ['modules:hero']);
    assert.equal(dynamic.length, 1);
    assert.equal(dynamic[0].text, '`module:${id}`');
  });

  it('resolves a bare-identifier isr(...) argument via a tags: [...] property', () => {
    const source = `
      export const getIndexPage = createTaxonomyIndexPageLoader({
        query: q,
        tags: ['page_tagIndex', 'modules:taxonomyList'],
        MissingTaxonomyListError,
      });

      function createTaxonomyIndexPageLoader({ tags }) {
        return async () => {
          const rawPage = await runQuery(query, {
            ...isr(tags, tenant.projectId),
          });
        };
      }
    `;
    const sf = parseSource('/virtual/loader.ts', source);
    const { tags, unresolved } = extractServiceCallSiteTags(
      '/virtual/loader.ts',
      sf,
    );
    assert.deepEqual(
      [...tags].sort(),
      ['modules:taxonomyList', 'page_tagIndex'].sort(),
    );
    assert.deepEqual(unresolved, []);
  });

  it('flags a non-literal, non-identifier isr(...) argument as unresolved', () => {
    const source = `
      ...isr(someHelper(), tenant.projectId);
    `;
    const sf = parseSource('/virtual/loader.ts', source);
    const { tags, unresolved } = extractServiceCallSiteTags(
      '/virtual/loader.ts',
      sf,
    );
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'someHelper()');
  });
});

describe('collectServiceTags', () => {
  it('unions tags across files', () => {
    const fixtures = {
      '/virtual/a.ts': `...isr('post', tenant.projectId);`,
      '/virtual/b.ts': `...isr(['author', 'topic'], tenant.projectId);`,
    };
    const { tags, dynamic, unresolved } = collectServiceTags(
      Object.keys(fixtures),
      (file) => parseSource(file, fixtures[file]),
    );
    assert.deepEqual([...tags].sort(), ['author', 'post', 'topic'].sort());
    assert.deepEqual(dynamic, []);
    assert.deepEqual(unresolved, []);
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

    const { tags, unresolved } = collectServiceTags(files, (file) =>
      parseSource(file, readFileSync(file, 'utf8')),
    );
    assert.deepEqual(unresolved, []);
    assert.deepEqual(findMissingTags(tags, revalidateTagValues), []);
  });
});

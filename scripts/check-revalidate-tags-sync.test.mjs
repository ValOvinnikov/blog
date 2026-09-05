// Fixture-based tests for check-revalidate-tags-sync's extraction +
// resolution helpers, mirroring check-turbo-env-sync.test.mjs's approach:
// inline source strings (built into a real TypeScript program via
// `createVirtualProgram`) instead of touching the real repo files, so a
// refactor of the resolver can't silently lose coverage.
//
// Run with `node --test scripts/check-revalidate-tags-sync.test.mjs`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  collectServiceTags,
  createServiceProgram,
  createVirtualProgram,
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

const collectFromFixtures = (fixtures) => {
  const program = createVirtualProgram(fixtures);
  return collectServiceTags(program, Object.keys(fixtures));
};

describe('collectServiceTags — direct literal shapes', () => {
  it('reads a single string-literal isr(...) argument', () => {
    const { tags, dynamic, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        isr('theme-settings', tenant.projectId);
      `,
    });
    assert.deepEqual([...tags], ['theme-settings']);
    assert.deepEqual(dynamic, []);
    assert.deepEqual(unresolved, []);
  });

  it('reads every string literal in an array-literal isr(...) argument', () => {
    const { tags } = collectFromFixtures({
      '/virtual/loader.ts': `
        isr(['post', 'author', 'topic'], tenant.projectId);
      `,
    });
    assert.deepEqual([...tags].sort(), ['author', 'post', 'topic']);
  });

  it('skips a template-literal element with a substitution as dynamic', () => {
    const { tags, dynamic } = collectFromFixtures({
      '/virtual/loader.ts': `
        isr(['modules:hero', \`module:\${id}\`], tenant.projectId);
      `,
    });
    assert.deepEqual([...tags], ['modules:hero']);
    assert.equal(dynamic.length, 1);
    assert.equal(dynamic[0].text, '`module:${id}`');
  });

  it('flags a non-literal, non-identifier isr(...) argument as unresolved', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        isr(someHelper(), tenant.projectId);
      `,
    });
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'someHelper()');
  });
});

describe('collectServiceTags — cross-file factory-parameter resolution', () => {
  it('resolves a bare-identifier isr(...) argument via its factory function’s call site in another file', () => {
    const fixtures = {
      '/virtual/create-taxonomy-index-page-loader.ts': `
        export function createTaxonomyIndexPageLoader({ tags }) {
          return async () => {
            isr(tags, tenant.projectId);
          };
        }
      `,
      '/virtual/tag-index-loader.ts': `
        import { createTaxonomyIndexPageLoader } from './create-taxonomy-index-page-loader';
        export const getIndexPage = createTaxonomyIndexPageLoader({
          query: tagIndexPageQuery,
          tags: ['page_tagIndex', 'modules:taxonomyList'],
          MissingTaxonomyListError,
        });
      `,
    };
    const { tags, unresolved } = collectFromFixtures(fixtures);
    assert.deepEqual(
      [...tags].sort(),
      ['modules:taxonomyList', 'page_tagIndex'].sort(),
    );
    assert.deepEqual(unresolved, []);
  });

  it('fails loudly instead of silently dropping a bare-identifier isr(...) argument whose factory call site passes a non-literal value', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        function getSomething(tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
        export const getNewThing = getSomething(computeTagsAtRuntime());
      `,
    });
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'computeTagsAtRuntime()');
  });

  it('never resolves a bare-identifier isr(...) argument from an unrelated object literal’s tags property', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        const unrelatedConfig = { tags: ['totally-unrelated-tag'] };

        function getSomething(tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
        export const getNewThing = getSomething(['real-tag']);
      `,
    });
    assert.deepEqual([...tags], ['real-tag']);
    assert.deepEqual(unresolved, []);
  });

  it('reproduction: never treats an unrelated same-named function’s call site as the traced factory’s', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        export function loadThing(tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
        function loadThing_unrelated(count) {
          return count;
        }
        const x = loadThing_unrelated(['totally-unrelated-tag']);
      `,
    });
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'tags');
  });

  it('reproduction: a shared function name across files never lets an unrelated call resolve the real factory', () => {
    const fixtures = {
      '/virtual/real-factory.ts': `
        export function loadThing(tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
      `,
      '/virtual/unrelated.ts': `
        function loadThing(count) {
          return count;
        }
        const x = loadThing(['totally-unrelated-tag']);
      `,
    };
    const { tags, unresolved } = collectFromFixtures(fixtures);
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'tags');
  });

  it('reproduction: a rest parameter collects every trailing tag, not just the first', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        function makeLoader(...tagArgs) {
          return async function inner() {
            isr(tagArgs, tenant.projectId);
          };
        }
        export const getThing = makeLoader('only-first-seen', 'second-missed', 'third-missed');
      `,
    });
    assert.deepEqual(
      [...tags].sort(),
      ['only-first-seen', 'second-missed', 'third-missed'].sort(),
    );
    assert.deepEqual(unresolved, []);
  });
});

describe('collectServiceTags — additional shapes', () => {
  it('resolves an identifier bound by an import, at module top level with no enclosing function', () => {
    const fixtures = {
      '/virtual/tags-const.ts': `
        export const SHARED_TAGS = ['shared-a', 'shared-b'];
      `,
      '/virtual/user.ts': `
        import { SHARED_TAGS } from './tags-const';
        isr(SHARED_TAGS, tenant.projectId);
      `,
    };
    const { tags, unresolved } = collectFromFixtures(fixtures);
    assert.deepEqual([...tags].sort(), ['shared-a', 'shared-b']);
    assert.deepEqual(unresolved, []);
  });

  it('reports an undeclared identifier at module top level as unresolved, never dropped', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        isr(mysteryTags, tenant.projectId);
      `,
    });
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'mysteryTags');
  });

  it('resolves an anonymous, default-exported factory by declaration, not by name', () => {
    const fixtures = {
      '/virtual/anon-factory.ts': `
        export default function (tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
      `,
      '/virtual/consumer.ts': `
        import makeLoader from './anon-factory';
        export const getThing = makeLoader(['anon-tag-a', 'anon-tag-b']);
      `,
    };
    const { tags, unresolved } = collectFromFixtures(fixtures);
    assert.deepEqual([...tags].sort(), ['anon-tag-a', 'anon-tag-b']);
    assert.deepEqual(unresolved, []);
  });

  it('resolves a factory reached through an object property', () => {
    const fixtures = {
      '/virtual/factory.ts': `
        function make(tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
        export const factories = { make };
      `,
      '/virtual/consumer.ts': `
        import { factories } from './factory';
        export const getThing = factories.make(['obj-tag']);
      `,
    };
    const { tags, unresolved } = collectFromFixtures(fixtures);
    assert.deepEqual([...tags], ['obj-tag']);
    assert.deepEqual(unresolved, []);
  });

  it('reports a spread argument at the call site as unresolved rather than guessing its alignment', () => {
    const { tags, unresolved } = collectFromFixtures({
      '/virtual/loader.ts': `
        function makeLoader(tags) {
          return async function inner() {
            isr(tags, tenant.projectId);
          };
        }
        const runtimeArgs = computeArgsAtRuntime();
        export const getThing = makeLoader(...runtimeArgs);
      `,
    });
    assert.deepEqual([...tags], []);
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].text, 'makeLoader(...runtimeArgs)');
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

    const program = createServiceProgram(files);
    const { tags, unresolved } = collectServiceTags(program, files);
    assert.deepEqual(unresolved, []);
    assert.deepEqual(findMissingTags(tags, revalidateTagValues), []);
  });
});

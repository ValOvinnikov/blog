import { evaluate, parse } from 'groq-js';
import { describe, expect, it } from 'vitest';

import {
  assertSafeDatasetRefresh,
  SOURCE_DATASET,
  TARGET_DATASET,
  WIPE_QUERY,
} from './refresh-dev-dataset-lib.mjs';

/** Runs `WIPE_QUERY` against a synthetic dataset via the real GROQ engine (groq-js) and returns the surviving `_id`s. */
const runWipeQuery = async (dataset) => {
  const tree = parse(WIPE_QUERY);
  const value = await evaluate(tree, { dataset });
  const result = await value.get();
  return result.map((doc) => doc._id);
};

const validConfig = {
  sourceProjectId: 'prod-project',
  sourceDataset: SOURCE_DATASET,
  targetProjectId: 'dev-project',
  targetDataset: TARGET_DATASET,
};

describe(assertSafeDatasetRefresh, () => {
  it('does not throw for a well-formed production -> development config', () => {
    expect(() => assertSafeDatasetRefresh(validConfig)).not.toThrow();
  });

  it('throws when the target dataset is not exactly "development"', () => {
    expect(() =>
      assertSafeDatasetRefresh({ ...validConfig, targetDataset: 'production' }),
    ).toThrow(/target dataset must be exactly "development"/i);
  });

  it('throws when the source dataset is not exactly "production"', () => {
    expect(() =>
      assertSafeDatasetRefresh({
        ...validConfig,
        sourceDataset: 'development',
      }),
    ).toThrow(/source dataset must be exactly "production"/i);
  });

  it('throws when the source and target project ids are identical', () => {
    expect(() =>
      assertSafeDatasetRefresh({
        ...validConfig,
        targetProjectId: validConfig.sourceProjectId,
      }),
    ).toThrow(/source and target project ids are identical/i);
  });

  it('throws when the source project id is missing', () => {
    expect(() =>
      assertSafeDatasetRefresh({ ...validConfig, sourceProjectId: '' }),
    ).toThrow(/missing source \(production\) project id/i);
  });

  it('throws when the target project id is missing', () => {
    expect(() =>
      assertSafeDatasetRefresh({ ...validConfig, targetProjectId: undefined }),
    ).toThrow(/missing target \(development\) project id/i);
  });

  it('reports every violation at once, not just the first', () => {
    expect(() =>
      assertSafeDatasetRefresh({
        sourceProjectId: '',
        sourceDataset: 'development',
        targetProjectId: '',
        targetDataset: 'production',
      }),
    ).toThrow(
      /missing source.*missing target.*source dataset.*target dataset/is,
    );
  });

  it('guards against a fully reversed config (prod/dev swapped) failing loudly', () => {
    // The exact "accidentally ran it backwards" scenario: source and target
    // env vars got swapped, so this now looks like development -> production.
    expect(() =>
      assertSafeDatasetRefresh({
        sourceProjectId: 'dev-project',
        sourceDataset: 'development',
        targetProjectId: 'prod-project',
        targetDataset: 'production',
      }),
    ).toThrow();
  });
});

describe(WIPE_QUERY, () => {
  it('excludes real system-document-shaped ids from the wipe', async () => {
    const survivors = await runWipeQuery([
      { _id: '_.schemas.default', _type: 'system.schema' },
      { _id: '_.groups.administrator', _type: 'system.group' },
      { _id: '_.retention._maximum_project', _type: 'system.retention' },
    ]);

    expect(survivors).toEqual([]);
  });

  it('includes every ordinary content/asset/draft document in the wipe', async () => {
    const ordinaryIds = [
      '03ad7c3e-ccb6-4b2a-8be3-fcd37a5fdce7',
      'image-abc123-800x600-png',
      'drafts.03ad7c3e-ccb6-4b2a-8be3-fcd37a5fdce7',
    ];
    const survivors = await runWipeQuery(
      ordinaryIds.map((_id) => ({ _id, _type: 'blog_post' })),
    );

    expect(survivors).toEqual(ordinaryIds);
  });

  // Regression test for the exact landmine the reviewer caught: an earlier
  // draft of this query used `_id in path("_.**")`, which groq-js compiles
  // to the regex `^_..*$` (the path-segment join uses an UNESCAPED `.`, so
  // it means "any character," not "literal dot" — see groq-js
  // `src/shared/values/Path.ts`'s `pathRegExp`). That regex matches ANY
  // `_id` starting with `_` followed by at least one more character, not
  // just the `_.`-namespaced system ids. `string::startsWith` has no such
  // quirk: it does a literal prefix check.
  it('does NOT over-exclude a hypothetical id that merely starts with an underscore', async () => {
    const survivors = await runWipeQuery([
      { _id: '_foo', _type: 'hypothetical_singleton' },
      { _id: '__bar', _type: 'hypothetical_singleton' },
    ]);

    expect(survivors).toEqual(['_foo', '__bar']);
  });
});

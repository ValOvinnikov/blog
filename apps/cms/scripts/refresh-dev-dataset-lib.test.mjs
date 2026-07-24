import { describe, expect, it } from 'vitest';

import {
  assertSafeDatasetRefresh,
  SOURCE_DATASET,
  TARGET_DATASET,
} from './refresh-dev-dataset-lib.mjs';

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

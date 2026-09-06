// Fixture-based tests for check-voice-key-sync's extraction + comparison
// helpers, mirroring gen-ui-index.test.mjs's approach: inline source strings
// via `parseSource` instead of touching the real repo files, so a refactor of
// the extractors can't silently lose coverage.
//
// Run with `node --test scripts/check-voice-key-sync.test.mjs`.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  compareKeySets,
  extractAdminKeys,
  extractDbKeys,
  extractWebKeys,
  parseSource,
  SOURCES,
} from './check-voice-key-sync.mjs';

const ADMIN_FIXTURE = `
  export const VOICE_FIELD_GROUPS = [
    {
      groupKey: 'notFoundPage',
      fields: [
        { key: 'notFoundMetaTitle' },
        { key: 'notFoundMetaDescription', multiline: true },
      ],
    },
  ];
`;

const WEB_FIXTURE = `
  const VOICE_OVERRIDE_PATHS = {
    notFoundMetaTitle: ['notFound', 'metaTitle'],
    notFoundMetaDescription: ['notFound', 'metaDescription'],
  };
`;

const DB_FIXTURE = `
  import { z } from 'zod';

  function overrideField(max) {
    return z.string().trim().max(max).optional();
  }

  export const voiceOverridesSchema = z
    .object({
      notFoundMetaTitle: overrideField(100),
      notFoundMetaDescription: overrideField(300),
    })
    .transform((overrides) => overrides);
`;

describe('extractAdminKeys', () => {
  it('reads every key inside VOICE_FIELD_GROUPS nested fields', () => {
    const sf = parseSource('/virtual/voice-fields.ts', ADMIN_FIXTURE);
    assert.deepEqual(extractAdminKeys(sf), [
      'notFoundMetaTitle',
      'notFoundMetaDescription',
    ]);
  });
});

describe('extractWebKeys', () => {
  it('reads the top-level keys of VOICE_OVERRIDE_PATHS', () => {
    const sf = parseSource('/virtual/apply-voice-overrides.ts', WEB_FIXTURE);
    assert.deepEqual(extractWebKeys(sf), [
      'notFoundMetaTitle',
      'notFoundMetaDescription',
    ]);
  });
});

describe('extractDbKeys', () => {
  it('reads the property names of the z.object({...}) passed to .transform()', () => {
    const sf = parseSource('/virtual/upsert-site-config.ts', DB_FIXTURE);
    assert.deepEqual(extractDbKeys(sf), [
      'notFoundMetaTitle',
      'notFoundMetaDescription',
    ]);
  });
});

describe('compareKeySets', () => {
  it('reports in sync when every source has the same keys', () => {
    const result = compareKeySets([
      { label: 'admin', keys: ['a', 'b'] },
      { label: 'web', keys: ['a', 'b'] },
      { label: 'db', keys: ['a', 'b'] },
    ]);
    assert.equal(result.inSync, true);
    assert.deepEqual(result.missing, {});
  });

  it('detects a key missing from one source (drift)', () => {
    const result = compareKeySets([
      { label: 'admin', keys: ['a', 'b', 'c'] },
      { label: 'web', keys: ['a', 'b'] },
      { label: 'db', keys: ['a', 'b', 'c'] },
    ]);
    assert.equal(result.inSync, false);
    assert.deepEqual(result.missing, { web: ['c'] });
  });

  it('detects an extra key present in only one source', () => {
    const result = compareKeySets([
      { label: 'admin', keys: ['a', 'b'] },
      { label: 'web', keys: ['a', 'b', 'extra'] },
      { label: 'db', keys: ['a', 'b'] },
    ]);
    assert.equal(result.inSync, false);
    assert.deepEqual(result.missing, { admin: ['extra'], db: ['extra'] });
  });

  it('detects a db source renamed out of sync with admin/web (3-source drift)', () => {
    const adminSf = parseSource('/virtual/voice-fields.ts', ADMIN_FIXTURE);
    const webSf = parseSource('/virtual/apply-voice-overrides.ts', WEB_FIXTURE);
    const driftedDbFixture = DB_FIXTURE.replace(
      'notFoundMetaDescription',
      'notFoundMetaDescriptionRenamed',
    );
    const dbSf = parseSource(
      '/virtual/upsert-site-config.ts',
      driftedDbFixture,
    );

    const result = compareKeySets([
      { label: 'admin', keys: extractAdminKeys(adminSf) },
      { label: 'web', keys: extractWebKeys(webSf) },
      { label: 'db', keys: extractDbKeys(dbSf) },
    ]);

    assert.equal(result.inSync, false);
    assert.deepEqual(result.missing, {
      db: ['notFoundMetaDescription'],
      admin: ['notFoundMetaDescriptionRenamed'],
      web: ['notFoundMetaDescriptionRenamed'],
    });
  });
});

describe('the real repo files', () => {
  it('are in sync', () => {
    const sources = SOURCES.map(({ label, file, extract }) => ({
      label,
      keys: extract(parseSource(file, readFileSync(file, 'utf8'))),
    }));
    const { inSync, missing } = compareKeySets(sources);
    assert.equal(inSync, true, JSON.stringify(missing));
  });
});

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
  extractCmsKeys,
  extractWebKeys,
  parseSource,
  SOURCES,
} from './check-voice-key-sync.mjs';

const CMS_FIXTURE = `
  import { titleField } from '@cms/schema-types/helpers/title-field';
  import { defineField, defineType } from 'sanity';

  export const voiceSchema = defineType({
    name: 'settings_voice',
    type: 'document',
    fields: [
      titleField(),
      defineField({ name: 'notFoundMetaTitle', type: 'string' }),
      defineField({ name: 'notFoundMetaDescription', type: 'string' }),
    ],
  });
`;

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

describe('extractCmsKeys', () => {
  it('reads every defineField name, ignoring titleField()', () => {
    const sf = parseSource('/virtual/voice.ts', CMS_FIXTURE);
    assert.deepEqual(extractCmsKeys(sf), [
      'notFoundMetaTitle',
      'notFoundMetaDescription',
    ]);
  });
});

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

describe('compareKeySets', () => {
  it('reports in sync when every source has the same keys', () => {
    const result = compareKeySets([
      { label: 'cms', keys: ['a', 'b'] },
      { label: 'admin', keys: ['a', 'b'] },
      { label: 'web', keys: ['a', 'b'] },
    ]);
    assert.equal(result.inSync, true);
    assert.deepEqual(result.missing, {});
  });

  it('detects a key missing from one source (drift)', () => {
    const result = compareKeySets([
      { label: 'cms', keys: ['a', 'b', 'c'] },
      { label: 'admin', keys: ['a', 'b'] },
      { label: 'web', keys: ['a', 'b', 'c'] },
    ]);
    assert.equal(result.inSync, false);
    assert.deepEqual(result.missing, { admin: ['c'] });
  });

  it('detects an extra key present in only one source', () => {
    const result = compareKeySets([
      { label: 'cms', keys: ['a', 'b'] },
      { label: 'admin', keys: ['a', 'b', 'extra'] },
      { label: 'web', keys: ['a', 'b'] },
    ]);
    assert.equal(result.inSync, false);
    assert.deepEqual(result.missing, { cms: ['extra'], web: ['extra'] });
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

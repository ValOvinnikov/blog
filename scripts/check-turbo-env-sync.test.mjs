// Fixture-based tests for check-turbo-env-sync's extraction + comparison
// helpers, mirroring check-voice-key-sync.test.mjs's approach: inline source
// strings via `parseSource` instead of touching the real repo files, so a
// refactor of the extractors can't silently lose coverage.
//
// Run with `node --test scripts/check-turbo-env-sync.test.mjs`.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  APPS,
  collectDeclaredVars,
  extractEnvKeys,
  findMissingVars,
  parseSource,
  readTurboBuildEnv,
  RUNTIME_ONLY_EXCLUDED_VARS,
} from './check-turbo-env-sync.mjs';

const NEXTJS_FIXTURE = `
  import { createEnv } from '@t3-oss/env-nextjs';
  import { z } from 'zod';

  export const env = createEnv({
    server: {
      SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
      NEWSLETTER_FROM_ADDRESS: z.string().min(1).optional(),
    },
    client: {
      NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    },
    runtimeEnv: {
      SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
      NEWSLETTER_FROM_ADDRESS: process.env.NEWSLETTER_FROM_ADDRESS,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });
`;

const CORE_FIXTURE = `
  import { createEnv } from '@t3-oss/env-core';
  import { z } from 'zod';

  export const env = createEnv({
    server: {
      DATABASE_URL: z.string().min(1),
      TENANT_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
    },
    runtimeEnv: process.env,
  });
`;

describe('extractEnvKeys', () => {
  it('reads both server and client keys (env-nextjs shape)', () => {
    const sf = parseSource('/virtual/web-env.ts', NEXTJS_FIXTURE);
    assert.deepEqual(extractEnvKeys(sf), [
      'SANITY_REVALIDATE_SECRET',
      'NEWSLETTER_FROM_ADDRESS',
      'NEXT_PUBLIC_SITE_URL',
    ]);
  });

  it('reads server keys with no client section (env-core shape)', () => {
    const sf = parseSource('/virtual/db-env.ts', CORE_FIXTURE);
    assert.deepEqual(extractEnvKeys(sf), [
      'DATABASE_URL',
      'TENANT_TOKEN_ENCRYPTION_KEY',
    ]);
  });

  it('returns an empty list for a file with no createEnv call', () => {
    const sf = parseSource('/virtual/not-env.ts', 'export const x = 1;');
    assert.deepEqual(extractEnvKeys(sf), []);
  });
});

describe('collectDeclaredVars', () => {
  it('unions keys across files, first file wins on duplicates', () => {
    const fixtures = {
      '/virtual/a.ts': NEXTJS_FIXTURE,
      '/virtual/b.ts': CORE_FIXTURE,
    };
    const declared = collectDeclaredVars(Object.keys(fixtures), (file) =>
      parseSource(file, fixtures[file]),
    );
    assert.deepEqual(
      [...declared.keys()].sort(),
      [
        'DATABASE_URL',
        'NEWSLETTER_FROM_ADDRESS',
        'NEXT_PUBLIC_SITE_URL',
        'SANITY_REVALIDATE_SECRET',
        'TENANT_TOKEN_ENCRYPTION_KEY',
      ].sort(),
    );
  });
});

describe('readTurboBuildEnv', () => {
  it('reads the build task env array as a Set', () => {
    const text = JSON.stringify({
      tasks: { build: { env: ['NODE_ENV', 'DATABASE_URL'] } },
    });
    const env = readTurboBuildEnv(text);
    assert.equal(env.has('NODE_ENV'), true);
    assert.equal(env.has('DATABASE_URL'), true);
    assert.equal(env.has('MISSING'), false);
  });
});

describe('findMissingVars', () => {
  it('reports nothing missing when every declared var is allow-listed', () => {
    const declared = new Map([
      ['DATABASE_URL', 'x.ts'],
      ['AUTH_SECRET', 'x.ts'],
    ]);
    const turboBuildEnv = new Set(['DATABASE_URL', 'AUTH_SECRET']);
    assert.deepEqual(findMissingVars(declared, turboBuildEnv, new Set()), []);
  });

  it('detects a declared var missing from the allowlist', () => {
    const declared = new Map([
      ['DATABASE_URL', 'x.ts'],
      ['NEW_VAR', 'x.ts'],
    ]);
    const turboBuildEnv = new Set(['DATABASE_URL']);
    assert.deepEqual(findMissingVars(declared, turboBuildEnv, new Set()), [
      'NEW_VAR',
    ]);
  });

  it('does not report a var in RUNTIME_ONLY_EXCLUDED_VARS', () => {
    const declared = new Map([['RUNTIME_VAR', 'x.ts']]);
    const turboBuildEnv = new Set();
    const excluded = new Set(['RUNTIME_VAR']);
    assert.deepEqual(findMissingVars(declared, turboBuildEnv, excluded), []);
  });
});

describe('the real repo files', () => {
  it('turbo.json build env covers every app-declared env var', () => {
    const turboBuildEnv = readTurboBuildEnv(
      readFileSync(new URL('../turbo.json', import.meta.url), 'utf8'),
    );

    const missingByApp = {};
    for (const { label, files } of APPS) {
      const declared = collectDeclaredVars(files);
      const missing = findMissingVars(
        declared,
        turboBuildEnv,
        RUNTIME_ONLY_EXCLUDED_VARS,
      );
      if (missing.length) missingByApp[label] = missing;
    }

    assert.deepEqual(missingByApp, {});
  });
});

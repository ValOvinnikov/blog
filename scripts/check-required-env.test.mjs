import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BLOCKING_ENVIRONMENTS,
  classifyDeclarations,
  collectClassification,
  ENV_FILES,
  extractDeclarations,
  KNOWN_ENVIRONMENTS,
  parseSource,
  PRESENCE_INPUT_PREFIX,
  readPresence,
} from './check-required-env.mjs';

const MARKED_FIXTURE = `
  import { createEnv } from '@t3-oss/env-nextjs';
  import { z } from 'zod';

  export const env = createEnv({
    server: {
      // Some prose explaining the var.
      // @env-required: development, production
      SITE_CONFIG_REVALIDATE_SECRET: z.string().min(1).optional(),
      // @env-optional
      WEB_ANALYTICS_ENABLED: z.enum(['true', 'false']).optional(),
      AUTH_SECRET: z.string().min(1),
    },
    client: {
      // @env-optional
      NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
      NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
    },
    runtimeEnv: process.env,
  });
`;

const declarationsOf = (text) =>
  extractDeclarations(parseSource('/virtual/env.ts', text));

describe('extractDeclarations', () => {
  it('reads every server and client field with its optionality and marker', () => {
    assert.deepEqual(declarationsOf(MARKED_FIXTURE), [
      {
        name: 'SITE_CONFIG_REVALIDATE_SECRET',
        isOptional: true,
        marker: {
          kind: 'required',
          environments: ['development', 'production'],
        },
      },
      {
        name: 'WEB_ANALYTICS_ENABLED',
        isOptional: true,
        marker: { kind: 'optional', environments: [] },
      },
      { name: 'AUTH_SECRET', isOptional: false, marker: null },
      {
        name: 'NEXT_PUBLIC_SITE_URL',
        isOptional: true,
        marker: { kind: 'optional', environments: [] },
      },
      { name: 'NEXT_PUBLIC_SANITY_DATASET', isOptional: false, marker: null },
    ]);
  });

  it('reads the marker nearest the declaration, not an earlier comment', () => {
    const [declaration] = declarationsOf(`
      import { createEnv } from '@t3-oss/env-core';
      export const env = createEnv({
        server: {
          // @env-optional
          // Prose that happens to sit below the marker.
          A: z.string().optional(),
        },
      });
    `);

    assert.equal(declaration.marker, null);
  });

  it('returns an empty list for a file with no createEnv call', () => {
    assert.deepEqual(declarationsOf('export const x = 1;'), []);
  });

  it('ignores a `.optional()` nested in an unrelated callback', () => {
    const [declaration] = declarationsOf(`
      import { createEnv } from '@t3-oss/env-core';
      export const env = createEnv({
        server: {
          A: z.string().refine(function (v) { return v.optional(); }),
        },
      });
    `);

    assert.equal(declaration.isOptional, false);
  });

  it('reports optionality as unreadable when the schema is not an inline chain', () => {
    const [declaration] = declarationsOf(`
      import { createEnv } from '@t3-oss/env-core';
      const sharedOptional = z.string().optional();
      export const env = createEnv({ server: { A: sharedOptional } });
    `);

    assert.equal(declaration.isOptional, null);
  });
});

describe('classifyDeclarations', () => {
  const classify = (text) => classifyDeclarations(declarationsOf(text), 'x.ts');

  it('separates required from optional and ignores non-optional vars', () => {
    const { required, optional, unclassified, invalid } =
      classify(MARKED_FIXTURE);

    assert.deepEqual(
      required.map(({ name, environments }) => [name, environments]),
      [['SITE_CONFIG_REVALIDATE_SECRET', ['development', 'production']]],
    );
    assert.deepEqual(
      optional.map(({ name }) => name),
      ['WEB_ANALYTICS_ENABLED', 'NEXT_PUBLIC_SITE_URL'],
    );
    assert.deepEqual(unclassified, []);
    assert.deepEqual(invalid, []);
  });

  it('reports an unmarked optional var', () => {
    const { unclassified } = classify(`
      import { createEnv } from '@t3-oss/env-core';
      export const env = createEnv({ server: { A: z.string().optional() } });
    `);

    assert.deepEqual(
      unclassified.map(({ name }) => name),
      ['A'],
    );
  });

  it('reports a schema whose optionality cannot be read', () => {
    const { invalid, unclassified } = classify(`
      import { createEnv } from '@t3-oss/env-core';
      const sharedOptional = z.string().optional();
      export const env = createEnv({ server: { A: sharedOptional } });
    `);

    assert.deepEqual(unclassified, []);
    assert.equal(invalid.length, 1);
    assert.match(invalid[0].reason, /not an inline/);
  });

  const invalidMarkerCases = [
    {
      title: 'reports a marker on a var that is not optional',
      field: '// @env-required: production\nA: z.string().min(1),',
      reason: /not `\.optional\(\)`/,
    },
    {
      title: 'reports @env-required with no environment list',
      field: '// @env-required\nA: z.string().optional(),',
      reason: /at least one environment/,
    },
    {
      title: 'reports an unknown environment name',
      field: '// @env-required: staging\nA: z.string().optional(),',
      reason: /unknown environment\(s\): staging/,
    },
    {
      title: 'reports @env-optional carrying an environment list',
      field: '// @env-optional: production\nA: z.string().optional(),',
      reason: /takes no environment list/,
    },
  ];

  for (const { title, field, reason } of invalidMarkerCases)
    it(title, () => {
      const { invalid } = classify(`
        import { createEnv } from '@t3-oss/env-core';
        export const env = createEnv({
          server: {
            ${field}
          },
        });
      `);

      assert.equal(invalid.length, 1);
      assert.match(invalid[0].reason, reason);
    });
});

describe('collectClassification', () => {
  it('unions the environments of a var declared in more than one module', () => {
    const fixtures = {
      '/virtual/a.ts': `
        import { createEnv } from '@t3-oss/env-core';
        export const env = createEnv({
          server: {
            // @env-required: development
            SHARED: z.string().optional(),
          },
        });
      `,
      '/virtual/b.ts': `
        import { createEnv } from '@t3-oss/env-core';
        export const env = createEnv({
          server: {
            // @env-required: production
            SHARED: z.string().optional(),
          },
        });
      `,
    };

    const { required } = collectClassification(Object.keys(fixtures), (file) =>
      parseSource(file, fixtures[file]),
    );

    assert.deepEqual([...required.get('SHARED').environments].sort(), [
      'development',
      'production',
    ]);
    assert.deepEqual(required.get('SHARED').files, [
      '/virtual/a.ts',
      '/virtual/b.ts',
    ]);
  });
});

describe('readPresence', () => {
  const required = new Map([
    ['BOTH', { environments: new Set(['development', 'production']) }],
    ['PROD_ONLY', { environments: new Set(['production']) }],
  ]);

  const inputs = (entries) =>
    Object.fromEntries(
      Object.entries(entries).map(([name, value]) => [
        `${PRESENCE_INPUT_PREFIX}${name}`,
        value,
      ]),
    );

  const presenceCases = [
    {
      title: 'reports nothing when the environment provides every required var',
      environment: 'development',
      values: { BOTH: 'true' },
      expected: { absent: [], unwired: [] },
    },
    {
      title: 'reports a var the environment reports as absent',
      environment: 'production',
      values: { BOTH: 'true', PROD_ONLY: 'false' },
      expected: { absent: ['PROD_ONLY'], unwired: [] },
    },
    {
      title: 'reports a required var the workflow never wired up',
      environment: 'production',
      values: {},
      expected: { absent: [], unwired: ['BOTH', 'PROD_ONLY'] },
    },
    {
      title: 'treats an empty input as unwired, not as absent',
      environment: 'development',
      values: { BOTH: '' },
      expected: { absent: [], unwired: ['BOTH'] },
    },
    {
      title: 'treats anything other than the literal "true" as absent',
      environment: 'development',
      values: { BOTH: 'TRUE' },
      expected: { absent: ['BOTH'], unwired: [] },
    },
  ];

  for (const { title, environment, values, expected } of presenceCases)
    it(title, () => {
      assert.deepEqual(
        readPresence(required, environment, inputs(values)),
        expected,
      );
    });
});

describe('policy constants', () => {
  it('only blocks on environments it knows about', () => {
    for (const environment of BLOCKING_ENVIRONMENTS)
      assert.ok(KNOWN_ENVIRONMENTS.includes(environment));
  });
});

describe('the real repo files', () => {
  it('classifies every `.optional()` env var', () => {
    const { unclassified, invalid } = collectClassification(ENV_FILES);

    assert.deepEqual(unclassified, []);
    assert.deepEqual(invalid, []);
  });

  it('classifies the pinned required vars and known optional ones, never a vacuous empty set', () => {
    const { required, optional } = collectClassification(ENV_FILES);
    const optionalNames = new Set(optional.map(({ name }) => name));

    assert.equal(required.size, 10);
    for (const name of [
      'NEXT_PUBLIC_SITE_URL',
      'LOKI_PUSH_URL',
      'AUTH_GITHUB_ID',
    ])
      assert.ok(optionalNames.has(name), `${name} is classified optional`);
    for (const [, entry] of required)
      for (const environment of entry.environments)
        assert.ok(KNOWN_ENVIRONMENTS.includes(environment));
  });

  it('gives every required var a presence input in the CI workflow', () => {
    const workflow = readFileSync(
      new URL('../.github/workflows/ci.yml', import.meta.url),
      'utf8',
    );
    const { required } = collectClassification(ENV_FILES);

    const unwired = [...required.keys()]
      .filter((name) => !workflow.includes(`${PRESENCE_INPUT_PREFIX}${name}:`))
      .sort();

    assert.deepEqual(unwired, []);
  });
});

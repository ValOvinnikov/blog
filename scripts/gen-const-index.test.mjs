import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildOutputs, extractConsts } from './gen-const-index.mjs';

const LINK_SOURCE = `
export const LINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' } as const;
export const HTTP_STATUS = { NOT_FOUND: 404 } as const;
export const LABELS: Record<string, string> = { INTERNAL: 'Internal' };
const PRIVATE = { A: 'A' } as const;
export const MIXED = { A: 'A', B: someCall() } as const;
`;

test('extractConsts reads exported as-const objects and their literal members', () => {
  assert.deepEqual(extractConsts('link.ts', LINK_SOURCE), [
    {
      name: 'LINK_TYPE',
      members: [
        { key: 'INTERNAL', value: 'INTERNAL' },
        { key: 'EXTERNAL', value: 'EXTERNAL' },
      ],
    },
    { name: 'HTTP_STATUS', members: [{ key: 'NOT_FOUND', value: 404 }] },
    { name: 'MIXED', members: [{ key: 'A', value: 'A' }] },
  ]);
});

test('buildOutputs maps each value to every const that holds it', () => {
  const sources = [
    { file: 'a.ts', scope: 'config', from: '@blog/config/constants' },
    { file: 'b.ts', scope: 'app:web', from: '@web/constants/b' },
  ];
  const texts = {
    'a.ts': "export const ALERT = { ERROR: 'ERROR' } as const;",
    'b.ts': "export const TOAST = { ERROR: 'ERROR', LIMIT: 3 } as const;",
  };
  const { map, catalog } = buildOutputs(sources, (file) => texts[file]);
  const parsed = JSON.parse(map);
  assert.deepEqual(
    parsed.strings.ERROR.map((entry) => entry.ref),
    ['ALERT.ERROR', 'TOAST.ERROR'],
  );
  assert.deepEqual(parsed.numbers['3'], [
    {
      ref: 'TOAST.LIMIT',
      scope: 'app:web',
      from: '@web/constants/b',
      file: 'b.ts',
    },
  ]);
  assert.match(catalog, /\*\*TOAST\*\*: `ERROR`, `LIMIT`=`3`/);
});

test('buildOutputs leaves out a file with no indexable const', () => {
  const { catalog } = buildOutputs(
    [{ file: 'c.ts', scope: 'config', from: '@blog/config/constants' }],
    () => 'export const SECONDS = 60;',
  );
  assert.doesNotMatch(catalog, /c\.ts/);
});

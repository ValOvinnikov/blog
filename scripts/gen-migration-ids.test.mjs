import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildModule } from './gen-migration-ids.mjs';

test('buildModule lists ids in migration run order', () => {
  const module = buildModule([
    '20260102T0000-second',
    '20260101T0000-first',
    'legacy',
  ]);

  assert.match(
    module,
    /\[\n {2}'legacy',\n {2}'20260101T0000-first',\n {2}'20260102T0000-second',\n\] as const;/,
  );
});

test('buildModule emits an empty list when there are no migrations', () => {
  assert.match(buildModule([]), /= \[\n\] as const;/);
});

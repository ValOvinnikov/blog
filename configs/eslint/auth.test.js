import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

import authConfig from './auth.js';

const linter = new Linter();

// `@shinefold/auth` sits above `@shinefold/db` (SPEC.md §4: auth's own upstreams
// include `db`) and binds the Drizzle adapter to db's tables — this is a
// one-directional layering, not a mutual sibling ban, so importing `@shinefold/db`
// from `@shinefold/auth` must stay unrestricted.
test('auth.js does not restrict @shinefold/db imports', () => {
  const messages = linter.verify(
    "export { schema } from '@shinefold/db';\n",
    authConfig,
    {
      filename: 'src/config.ts',
    },
  );

  assert.deepEqual(messages, []);
});

test('auth.js still bans @shinefold/ui imports', () => {
  const messages = linter.verify(
    "export { Button } from '@shinefold/ui';\n",
    authConfig,
    {
      filename: 'src/config.ts',
    },
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-imports');
});

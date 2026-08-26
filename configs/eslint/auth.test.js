import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

import authConfig from './auth.js';

const linter = new Linter();

// `@blog/auth` sits above `@blog/db` (SPEC.md §4: auth's own upstreams
// include `db`) and binds the Drizzle adapter to db's tables — this is a
// one-directional layering, not a mutual sibling ban, so importing `@blog/db`
// from `@blog/auth` must stay unrestricted.
test('auth.js does not restrict @blog/db imports', () => {
  const messages = linter.verify(
    "export { schema } from '@blog/db';\n",
    authConfig,
    {
      filename: 'src/config.ts',
    },
  );

  assert.deepEqual(messages, []);
});

test('auth.js still bans @blog/ui imports', () => {
  const messages = linter.verify(
    "export { Button } from '@blog/ui';\n",
    authConfig,
    {
      filename: 'src/config.ts',
    },
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-imports');
});

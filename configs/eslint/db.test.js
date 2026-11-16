import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

import dbConfig from './db.js';

const linter = new Linter();

test('db.js bans @shinefold/auth imports', () => {
  const messages = linter.verify(
    "export { auth } from '@shinefold/auth';\n",
    dbConfig,
    {
      filename: 'src/index.ts',
    },
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-imports');
  assert.match(
    messages[0].message,
    /@shinefold\/db must not import @shinefold\/auth/,
  );
});

test('db.js still bans @shinefold/service imports (existing sibling ban unaffected)', () => {
  const messages = linter.verify(
    "export { getPostBySlug } from '@shinefold/service';\n",
    dbConfig,
    { filename: 'src/index.ts' },
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-imports');
  assert.match(
    messages[0].message,
    /@shinefold\/db must not import @shinefold\/service/,
  );
});

test('db.js does not restrict unrelated package imports', () => {
  const messages = linter.verify(
    "export { TValueOf } from '@shinefold/config';\n",
    dbConfig,
    {
      filename: 'src/index.ts',
    },
  );

  assert.deepEqual(messages, []);
});

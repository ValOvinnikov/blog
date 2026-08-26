import assert from 'node:assert/strict';
import test from 'node:test';

import { Linter } from 'eslint';

import dbConfig from './db.js';

const linter = new Linter();

test('db.js bans @blog/auth imports', () => {
  const messages = linter.verify(
    "export { auth } from '@blog/auth';\n",
    dbConfig,
    {
      filename: 'src/index.ts',
    },
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-imports');
  assert.match(messages[0].message, /@blog\/db must not import @blog\/auth/);
});

test('db.js still bans @blog/service imports (existing sibling ban unaffected)', () => {
  const messages = linter.verify(
    "export { getPostBySlug } from '@blog/service';\n",
    dbConfig,
    { filename: 'src/index.ts' },
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].ruleId, 'no-restricted-imports');
  assert.match(messages[0].message, /@blog\/db must not import @blog\/service/);
});

test('db.js does not restrict unrelated package imports', () => {
  const messages = linter.verify(
    "export { TValueOf } from '@blog/config';\n",
    dbConfig,
    {
      filename: 'src/index.ts',
    },
  );

  assert.deepEqual(messages, []);
});

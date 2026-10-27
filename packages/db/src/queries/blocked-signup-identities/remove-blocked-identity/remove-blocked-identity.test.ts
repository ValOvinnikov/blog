import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { addBlockedIdentity } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import * as schema from '@blog/db/schema';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { removeBlockedIdentity } from './remove-blocked-identity';

faker.seed(602107);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(removeBlockedIdentity, () => {
  it('removes the entry', async () => {
    const { id: createdByAdminId } = await insertTestAdmin(db());
    const added = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
      createdByAdminId,
    });
    if (!added.ok) throw new Error('seed failed');

    const result = await removeBlockedIdentity(added.data.entry.id);

    expect(result).toEqual({ ok: true, data: undefined });
    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(0);
  });

  it('reports DB_NOT_FOUND when no entry has that id', async () => {
    const result = await removeBlockedIdentity(faker.string.uuid());

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});

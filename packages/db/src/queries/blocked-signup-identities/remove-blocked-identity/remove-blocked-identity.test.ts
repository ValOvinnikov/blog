import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { addBlockedIdentity } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import * as schema from '@blog/db/schema';
import {
  BLOCK_REASON,
  BLOCKED_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { removeBlockedIdentity } from './remove-blocked-identity';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
      identity: BLOCKED_DOMAIN,
      reason: BLOCK_REASON,
      createdByAdminId,
    });
    if (!added.ok) throw new Error('seed failed');

    const result = await removeBlockedIdentity(added.data.entry.id);

    expect(result).toEqual({ ok: true, data: undefined });
    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(0);
  });

  it('reports DB_NOT_FOUND when no entry has that id', async () => {
    const result = await removeBlockedIdentity(crypto.randomUUID());

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});

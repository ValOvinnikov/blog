import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { addBlockedIdentity } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import * as schema from '@blog/db/schema';
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
      identity: 'mailinator.com',
      reason: 'Disposable',
      createdByAdminId,
    });
    if (!added.ok) throw new Error('seed failed');

    const result = await removeBlockedIdentity(added.data.id);

    expect(result).toEqual({ ok: true, data: undefined });
    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(0);
  });

  it('reports DB_NOT_FOUND when no entry has that id', async () => {
    const result = await removeBlockedIdentity(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});

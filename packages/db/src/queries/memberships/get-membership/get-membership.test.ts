import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getMembership } from './get-membership';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getMembership, () => {
  it('returns the row for an existing (userId, tenantId) pair', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.memberships)
      .values({ userId: 'user-1', tenantId, role: MEMBERSHIP_ROLE.OWNER });

    const result = await getMembership('user-1', tenantId);

    expect(result).toMatchObject({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('returns undefined when the user has no membership on that tenant', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());

    const result = await getMembership('user-1', tenantId);

    expect(result).toBeUndefined();
  });
});

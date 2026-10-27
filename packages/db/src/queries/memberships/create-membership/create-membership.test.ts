import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import {
  MOCK_USER_ID,
  MOCK_MISSING_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { createMembership } from './create-membership';

vi.mock('@blog/db/client');

faker.seed(6022);

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(createMembership, () => {
  let tenantId: string;

  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new membership row', async () => {
    const membership = await createMembership(
      MOCK_USER_ID,
      tenantId,
      MEMBERSHIP_ROLE.OWNER,
    );

    const rows = await db().select().from(schema.memberships);
    expect(rows).toEqual([membership]);
    expect(membership).toEqual({
      id: membership.id,
      createdAt: membership.createdAt,
      userId: MOCK_USER_ID,
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('is idempotent when the (userId, tenantId) pair already has a membership', async () => {
    const first = await createMembership(
      MOCK_USER_ID,
      tenantId,
      MEMBERSHIP_ROLE.OWNER,
    );

    const second = await createMembership(
      MOCK_USER_ID,
      tenantId,
      MEMBERSHIP_ROLE.EDITOR,
    );

    const rows = await db().select().from(schema.memberships);
    expect(second).toEqual(first);
    expect(rows).toEqual([first]);
  });

  it('allows the same user to hold memberships on different tenants', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());

    await createMembership(MOCK_USER_ID, tenantOneId, MEMBERSHIP_ROLE.OWNER);
    await createMembership(MOCK_USER_ID, tenantTwoId, MEMBERSHIP_ROLE.READER);

    const rows = await db().select().from(schema.memberships);
    expect(rows).toHaveLength(2);
  });

  it('rejects a membership for a user that does not exist', async () => {
    await expect(
      createMembership(MOCK_MISSING_USER_ID, tenantId, MEMBERSHIP_ROLE.OWNER),
    ).rejects.toThrow();
  });

  describe('foreign-key cascade', () => {
    beforeEach(async () => {
      await createMembership(MOCK_USER_ID, tenantId, MEMBERSHIP_ROLE.OWNER);
    });

    it('removes a membership when its owning user is deleted', async () => {
      await db().delete(schema.users).where(eq(schema.users.id, MOCK_USER_ID));

      const rows = await db().select().from(schema.memberships);
      expect(rows).toEqual([]);
    });

    it('removes a membership when its owning tenant is deleted', async () => {
      await db().delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

      const rows = await db().select().from(schema.memberships);
      expect(rows).toEqual([]);
    });
  });
});

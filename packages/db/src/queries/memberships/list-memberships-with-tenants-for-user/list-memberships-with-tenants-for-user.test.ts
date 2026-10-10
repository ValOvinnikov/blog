import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listMembershipsWithTenantsForUser } from './list-memberships-with-tenants-for-user';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(listMembershipsWithTenantsForUser, () => {
  beforeEach(async () => {
    await insertTestUser(db(), { id: 'user-1' });
  });

  it('returns every membership for the given user alongside its tenant', async () => {
    await insertTestUser(db(), { id: 'user-2' });
    const tenantOne = await insertTestTenant(db());
    const tenantTwo = await insertTestTenant(db());
    await db()
      .insert(schema.memberships)
      .values([
        {
          userId: 'user-1',
          tenantId: tenantOne.id,
          role: MEMBERSHIP_ROLE.OWNER,
        },
        {
          userId: 'user-1',
          tenantId: tenantTwo.id,
          role: MEMBERSHIP_ROLE.READER,
        },
        {
          userId: 'user-2',
          tenantId: tenantOne.id,
          role: MEMBERSHIP_ROLE.EDITOR,
        },
      ]);

    const result = await listMembershipsWithTenantsForUser('user-1');

    expect(result).toHaveLength(2);
    expect(
      result.every(
        ({ membership, tenant }) =>
          membership.userId === 'user-1' && membership.tenantId === tenant.id,
      ),
    ).toBe(true);
    expect(result.map(({ tenant }) => tenant.id).sort()).toEqual(
      [tenantOne.id, tenantTwo.id].sort(),
    );
  });

  it('includes a deprovisioned tenant', async () => {
    const tenant = await insertTestTenant(db());
    await db()
      .update(schema.tenants)
      .set({ deprovisionedAt: new Date('2026-01-01T00:00:00.000Z') });
    await db().insert(schema.memberships).values({
      userId: 'user-1',
      tenantId: tenant.id,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await listMembershipsWithTenantsForUser('user-1');

    expect(result.map(({ tenant: { id } }) => id)).toEqual([tenant.id]);
  });

  it('returns an empty array for a user with no memberships', async () => {
    const result = await listMembershipsWithTenantsForUser('user-1');

    expect(result).toEqual([]);
  });
});

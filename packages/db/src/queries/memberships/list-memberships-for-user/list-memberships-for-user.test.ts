import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listMembershipsForUser } from './list-memberships-for-user';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id });
}

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.memberships);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(listMembershipsForUser, () => {
  it('returns every membership for the given user', async () => {
    await insertUser('user-1');
    await insertUser('user-2');
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    await db.insert(schema.memberships).values([
      { userId: 'user-1', tenantId: tenantOneId, role: MEMBERSHIP_ROLE.OWNER },
      { userId: 'user-1', tenantId: tenantTwoId, role: MEMBERSHIP_ROLE.READER },
      { userId: 'user-2', tenantId: tenantOneId, role: MEMBERSHIP_ROLE.EDITOR },
    ]);

    const result = await listMembershipsForUser('user-1');

    expect(result).toHaveLength(2);
    expect(result.map((membership) => membership.tenantId).sort()).toEqual(
      [tenantOneId, tenantTwoId].sort(),
    );
  });

  it('returns an empty array for a user with no memberships', async () => {
    await insertUser('user-1');

    const result = await listMembershipsForUser('user-1');

    expect(result).toEqual([]);
  });
});

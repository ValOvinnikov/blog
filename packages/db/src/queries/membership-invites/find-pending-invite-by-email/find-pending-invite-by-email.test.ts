import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { findPendingInviteByEmail } from './find-pending-invite-by-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
}

async function insertInvite(
  tenantId: string,
  email: string,
  consumed = false,
): Promise<void> {
  await db.insert(schema.membershipInvites).values({
    tenantId,
    email,
    role: MEMBERSHIP_ROLE.OWNER,
    consumedAt: consumed ? new Date() : null,
  });
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.membershipInvites);
  await db.delete(schema.tenants);
});

describe(findPendingInviteByEmail, () => {
  it('returns a pending invite matching the normalized email', async () => {
    const tenantId = await insertTenant('acme');
    await insertInvite(tenantId, 'owner@example.com');

    const results = await findPendingInviteByEmail('Owner@Example.com');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ tenantId, email: 'owner@example.com' });
  });

  it('excludes already-consumed invites', async () => {
    const tenantId = await insertTenant('acme');
    await insertInvite(tenantId, 'owner@example.com', true);

    const results = await findPendingInviteByEmail('owner@example.com');

    expect(results).toHaveLength(0);
  });

  it('returns every pending invite across multiple tenants for the same email', async () => {
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    await insertInvite(tenantOneId, 'owner@example.com');
    await insertInvite(tenantTwoId, 'owner@example.com');

    const results = await findPendingInviteByEmail('owner@example.com');

    expect(results).toHaveLength(2);
    expect(results.map((invite) => invite.tenantId).sort()).toEqual(
      [tenantOneId, tenantTwoId].sort(),
    );
  });

  it('returns an empty array when no invite matches', async () => {
    const results = await findPendingInviteByEmail('nobody@example.com');

    expect(results).toEqual([]);
  });
});

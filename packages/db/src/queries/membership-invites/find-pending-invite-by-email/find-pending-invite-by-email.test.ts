import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { findPendingInviteByEmail } from './find-pending-invite-by-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

async function insertInvite(
  tenantId: string,
  email: string,
  consumed = false,
): Promise<void> {
  await db()
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      email,
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: consumed ? new Date() : null,
    });
}

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(findPendingInviteByEmail, () => {
  it('returns a pending invite matching the normalized email', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await insertInvite(tenantId, 'owner@example.com');

    const results = await findPendingInviteByEmail('Owner@Example.com');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ tenantId, email: 'owner@example.com' });
  });

  it('matches an email padded with leading/trailing whitespace', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await insertInvite(tenantId, 'owner@example.com');

    const results = await findPendingInviteByEmail('  owner@example.com  ');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ tenantId, email: 'owner@example.com' });
  });

  it('excludes already-consumed invites', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await insertInvite(tenantId, 'owner@example.com', true);

    const results = await findPendingInviteByEmail('owner@example.com');

    expect(results).toHaveLength(0);
  });

  it('returns every pending invite across multiple tenants for the same email', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
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

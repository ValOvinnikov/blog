import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { createMembershipInvite } from '../create-membership-invite';

import { deleteMembershipInvitesForTenant } from './delete-membership-invites-for-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(deleteMembershipInvitesForTenant, () => {
  it('deletes every invite row for the tenant and returns the count', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await createMembershipInvite(
      tenantId,
      'one@example.com',
      MEMBERSHIP_ROLE.EDITOR,
    );
    await createMembershipInvite(
      tenantId,
      'two@example.com',
      MEMBERSHIP_ROLE.READER,
    );

    await expect(deleteMembershipInvitesForTenant(tenantId)).resolves.toBe(2);

    const rows = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, tenantId));
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's invites untouched", async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await createMembershipInvite(
      otherTenantId,
      'one@example.com',
      MEMBERSHIP_ROLE.EDITOR,
    );

    await deleteMembershipInvitesForTenant(tenantId);

    const rows = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, otherTenantId));
    expect(rows).toHaveLength(1);
  });

  it('is idempotent — returns 0 when nothing matches', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    await expect(deleteMembershipInvitesForTenant(tenantId)).resolves.toBe(0);
  });
});

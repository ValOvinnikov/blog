import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { mockMembershipInvite } from '@shinefold/db/testing/membership-invites/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { deleteMembershipInvitesForTenant } from './delete-membership-invites-for-tenant';

vi.mock('@shinefold/db/client');

faker.seed(6022);

const db = useQueryTestDb();

async function readInvitesFor(tenantId: string) {
  return db()
    .select()
    .from(schema.membershipInvites)
    .where(eq(schema.membershipInvites.tenantId, tenantId));
}

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(deleteMembershipInvitesForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes every invite row for the tenant and returns the count', async () => {
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.READER,
    });

    const deletedCount = await deleteMembershipInvitesForTenant(tenantId);

    const rows = await readInvitesFor(tenantId);
    expect(deletedCount).toBe(2);
    expect(rows).toEqual([]);
  });

  it("leaves another tenant's invites untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const otherInvite = await mockMembershipInvite(db(), otherTenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    await deleteMembershipInvitesForTenant(tenantId);

    const rows = await readInvitesFor(otherTenantId);
    expect(rows).toEqual([otherInvite]);
  });

  it('returns 0 when the tenant has no invites', async () => {
    const deletedCount = await deleteMembershipInvitesForTenant(tenantId);

    expect(deletedCount).toBe(0);
  });
});

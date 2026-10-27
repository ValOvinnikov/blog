import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { mockMembershipInvite } from '@blog/db/testing/membership-invites/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { countMembershipInvitesForTenant } from './count-membership-invites-for-tenant';

vi.mock('@blog/db/client');

faker.seed(6022);

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(countMembershipInvitesForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('counts every invite row for the tenant', async () => {
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.READER,
    });

    const count = await countMembershipInvitesForTenant(tenantId);

    expect(count).toBe(2);
  });

  it("does not count another tenant's invites", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await mockMembershipInvite(db(), otherTenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const count = await countMembershipInvitesForTenant(tenantId);

    expect(count).toBe(0);
  });
});

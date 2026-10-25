import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { createMembershipInvite } from '../create-membership-invite';

import { countMembershipInvitesForTenant } from './count-membership-invites-for-tenant';

vi.mock('@blog/db/client');

const MOCK_FIRST_EMAIL = 'one@example.com';
const MOCK_SECOND_EMAIL = 'two@example.com';

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
    await createMembershipInvite(
      tenantId,
      MOCK_FIRST_EMAIL,
      MEMBERSHIP_ROLE.EDITOR,
    );
    await createMembershipInvite(
      tenantId,
      MOCK_SECOND_EMAIL,
      MEMBERSHIP_ROLE.READER,
    );

    await expect(countMembershipInvitesForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's invites", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await createMembershipInvite(
      otherTenantId,
      MOCK_FIRST_EMAIL,
      MEMBERSHIP_ROLE.EDITOR,
    );

    await expect(countMembershipInvitesForTenant(tenantId)).resolves.toBe(0);
  });
});

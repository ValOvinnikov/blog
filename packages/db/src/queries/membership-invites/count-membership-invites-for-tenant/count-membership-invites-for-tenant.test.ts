import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { createMembershipInvite } from '../create-membership-invite';

import { countMembershipInvitesForTenant } from './count-membership-invites-for-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
      'one@example.com',
      MEMBERSHIP_ROLE.EDITOR,
    );
    await createMembershipInvite(
      tenantId,
      'two@example.com',
      MEMBERSHIP_ROLE.READER,
    );

    await expect(countMembershipInvitesForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's invites", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await createMembershipInvite(
      otherTenantId,
      'one@example.com',
      MEMBERSHIP_ROLE.EDITOR,
    );

    await expect(countMembershipInvitesForTenant(tenantId)).resolves.toBe(0);
  });
});

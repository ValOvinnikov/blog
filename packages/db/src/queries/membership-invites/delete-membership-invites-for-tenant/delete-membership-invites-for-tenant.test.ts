import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { createMembershipInvite } from '../create-membership-invite';

import { deleteMembershipInvitesForTenant } from './delete-membership-invites-for-tenant';

vi.mock('@blog/db/client');

const MOCK_FIRST_EMAIL = 'one@example.com';
const MOCK_SECOND_EMAIL = 'two@example.com';

const db = useQueryTestDb();

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

    await expect(deleteMembershipInvitesForTenant(tenantId)).resolves.toBe(2);

    const rows = await db()
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, tenantId));
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's invites untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await createMembershipInvite(
      otherTenantId,
      MOCK_FIRST_EMAIL,
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
    await expect(deleteMembershipInvitesForTenant(tenantId)).resolves.toBe(0);
  });
});

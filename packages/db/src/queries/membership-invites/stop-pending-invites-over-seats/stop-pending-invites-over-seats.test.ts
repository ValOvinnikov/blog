import {
  MEMBERSHIP_ROLE,
  PLAN_ENTITLEMENTS,
  TENANT_PLAN,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { mockMembershipInvite } from '@blog/db/testing/membership-invites/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { stopPendingInvitesOverSeats } from './stop-pending-invites-over-seats';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const FREE_SEATS = PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].seats;

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(stopPendingInvitesOverSeats, () => {
  let tenantId: string;

  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
    ({ id: tenantId } = await insertTestTenant(db()));
    await mockMembership(db(), { userId: MOCK_USER_ID, tenantId });
  });

  it('stops every editor invite once the owner fills the Free seat', async () => {
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    await expect(
      stopPendingInvitesOverSeats(tenantId, FREE_SEATS),
    ).resolves.toBe(2);
    await expect(db().select().from(schema.membershipInvites)).resolves.toEqual(
      [],
    );
  });

  it('keeps an owner invite', async () => {
    await mockMembershipInvite(db(), tenantId);

    await expect(
      stopPendingInvitesOverSeats(tenantId, FREE_SEATS),
    ).resolves.toBe(0);
  });

  it('keeps the earliest invites that still fit the seats', async () => {
    const kept = await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    await stopPendingInvitesOverSeats(tenantId, 2);

    const remaining = await db().select().from(schema.membershipInvites);
    expect(remaining.map(({ id }) => id)).toEqual([kept.id]);
  });
});

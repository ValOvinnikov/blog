import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import {
  deleteSeatRows,
  mockMembershipInvite,
} from '@blog/db/testing/membership-invites/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { stopPendingInvitesOverSeats } from './stop-pending-invites-over-seats';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(stopPendingInvitesOverSeats, () => {
  let tenantId: string;

  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
    ({ id: tenantId } = await insertTestTenant(db()));
    await mockMembership(db(), { userId: MOCK_USER_ID, tenantId });
  });

  describe('two editor invites beside the owner', () => {
    let keptId: string;

    beforeEach(async () => {
      ({ id: keptId } = await mockMembershipInvite(db(), tenantId, {
        role: MEMBERSHIP_ROLE.EDITOR,
      }));
      await mockMembershipInvite(db(), tenantId, {
        role: MEMBERSHIP_ROLE.EDITOR,
      });
    });

    it('stops every one once the owner fills the Free seat', async () => {
      await expect(
        stopPendingInvitesOverSeats(tenantId, TENANT_PLAN.FREE),
      ).resolves.toBe(2);
    });

    describe('once the site has moved to Growth', () => {
      beforeEach(async () => {
        await db().update(schema.tenants).set({ plan: TENANT_PLAN.GROWTH });
      });

      it('keeps the earliest ones that still fit the seats', async () => {
        await mockMembershipInvite(db(), tenantId, {
          role: MEMBERSHIP_ROLE.EDITOR,
        });

        await stopPendingInvitesOverSeats(tenantId, TENANT_PLAN.GROWTH);

        const remaining = await db().select().from(schema.membershipInvites);
        expect(remaining).toHaveLength(2);
        expect(remaining.map(({ id }) => id)).toContain(keptId);
      });

      it('stops nothing when asked to hold them to Free', async () => {
        await expect(
          stopPendingInvitesOverSeats(tenantId, TENANT_PLAN.FREE),
        ).resolves.toBe(0);
      });
    });
  });

  it('keeps an owner invite', async () => {
    await mockMembershipInvite(db(), tenantId);

    await expect(
      stopPendingInvitesOverSeats(tenantId, TENANT_PLAN.FREE),
    ).resolves.toBe(0);
  });
});

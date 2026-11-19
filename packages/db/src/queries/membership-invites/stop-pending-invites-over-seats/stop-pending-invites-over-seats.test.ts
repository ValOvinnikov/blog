import { TENANT_PLAN } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestUser } from '@shinefold/db/testing/fixtures';
import {
  deleteSeatRows,
  mockMembershipInvite,
} from '@shinefold/db/testing/membership-invites/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { stopPendingInvitesOverSeats } from './stop-pending-invites-over-seats';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(stopPendingInvitesOverSeats, () => {
  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
    await mockMembership(db(), { userId: MOCK_USER_ID, tenantId: tenant().id });
  });

  describe('two editor invites beside the owner', () => {
    let keptId: string;

    beforeEach(async () => {
      ({ id: keptId } = await mockMembershipInvite(db(), tenant().id, {
        role: MEMBERSHIP_ROLE.EDITOR,
      }));
      await mockMembershipInvite(db(), tenant().id, {
        role: MEMBERSHIP_ROLE.EDITOR,
      });
    });

    it('stops every one once the owner fills the Free seat', async () => {
      await expect(
        stopPendingInvitesOverSeats(tenant().id, TENANT_PLAN.FREE),
      ).resolves.toBe(2);
    });

    describe('once the site has moved to Growth', () => {
      beforeEach(async () => {
        await db().update(schema.tenants).set({ plan: TENANT_PLAN.GROWTH });
      });

      it('keeps the earliest ones that still fit the seats', async () => {
        await mockMembershipInvite(db(), tenant().id, {
          role: MEMBERSHIP_ROLE.EDITOR,
        });

        await stopPendingInvitesOverSeats(tenant().id, TENANT_PLAN.GROWTH);

        const remaining = await db().select().from(schema.membershipInvites);
        expect(remaining).toHaveLength(2);
        expect(remaining.map(({ id }) => id)).toContain(keptId);
      });

      it('stops nothing when asked to hold them to Free', async () => {
        await expect(
          stopPendingInvitesOverSeats(tenant().id, TENANT_PLAN.FREE),
        ).resolves.toBe(0);
      });
    });
  });

  it('keeps an owner invite', async () => {
    await mockMembershipInvite(db(), tenant().id);

    await expect(
      stopPendingInvitesOverSeats(tenant().id, TENANT_PLAN.FREE),
    ).resolves.toBe(0);
  });
});

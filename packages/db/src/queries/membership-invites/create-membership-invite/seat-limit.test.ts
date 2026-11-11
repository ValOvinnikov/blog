import { TENANT_PLAN } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import {
  deleteSeatRows,
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@blog/db/testing/membership-invites/fixtures';
import { mockMembership } from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { releaseInvitePastSeatLimit } from './seat-limit';

vi.mock('@blog/db/client');

const EARLIER = new Date('2026-11-01T00:00:00.000Z');
const LATER = new Date('2026-11-02T00:00:00.000Z');

const db = useQueryTestDb();

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(releaseInvitePastSeatLimit, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function inviteIds() {
    const rows = await db().select().from(schema.membershipInvites);

    return rows.map(({ id }) => id);
  }

  describe('on a full tenant with one extra pending invite', () => {
    let earlierId: string;
    let laterId: string;

    beforeEach(async () => {
      ({ id: earlierId } = await mockMembershipInvite(db(), tenantId, {
        createdAt: EARLIER,
      }));
      ({ id: laterId } = await mockMembershipInvite(db(), tenantId, {
        createdAt: LATER,
      }));
    });

    it('removes the later invite', async () => {
      const released = await releaseInvitePastSeatLimit(laterId);

      expect(released).toBe(true);
      expect(await inviteIds()).toEqual([earlierId]);
    });

    it('keeps the earlier invite', async () => {
      const released = await releaseInvitePastSeatLimit(earlierId);

      expect(released).toBe(false);
      expect(await inviteIds()).toHaveLength(2);
    });
  });

  it('counts a membership ahead of every pending invite', async () => {
    const { id: userId } = await insertTestUser(db());
    await mockMembership(db(), { userId, tenantId });
    const { id: inviteId } = await mockMembershipInvite(db(), tenantId);

    const released = await releaseInvitePastSeatLimit(inviteId);

    expect(released).toBe(true);
    expect(await inviteIds()).toEqual([]);
  });

  it('keeps an invite within the seats of a GROWTH tenant', async () => {
    const { id: growthTenantId } = await insertTestTenant(db(), {
      plan: TENANT_PLAN.GROWTH,
    });
    await mockMembershipInvite(db(), growthTenantId, {
      consumedAt: MOCK_INVITE_CONSUMED_AT,
    });
    await mockMembershipInvite(db(), growthTenantId, { createdAt: EARLIER });
    const { id: inviteId } = await mockMembershipInvite(db(), growthTenantId, {
      createdAt: LATER,
    });

    const released = await releaseInvitePastSeatLimit(inviteId);

    expect(released).toBe(false);
  });
});

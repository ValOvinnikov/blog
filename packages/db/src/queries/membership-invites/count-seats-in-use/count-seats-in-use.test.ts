import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import {
  deleteSeatRows,
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@shinefold/db/testing/membership-invites/fixtures';
import { insertTeam } from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { countSeatsInUse } from './count-seats-in-use';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(countSeatsInUse, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('counts the owner, members and pending invites, but not a consumed invite', async () => {
    await insertTeam(db(), tenantId, [
      MEMBERSHIP_ROLE.OWNER,
      MEMBERSHIP_ROLE.EDITOR,
    ]);
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
      consumedAt: MOCK_INVITE_CONSUMED_AT,
    });

    expect(await countSeatsInUse(tenantId)).toBe(3);
  });

  it("does not count another tenant's seats", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTeam(db(), otherTenantId, [MEMBERSHIP_ROLE.OWNER]);
    await mockMembershipInvite(db(), otherTenantId);

    expect(await countSeatsInUse(tenantId)).toBe(0);
  });
});

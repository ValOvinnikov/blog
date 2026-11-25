import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  deleteSeatRows,
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@shinefold/db/testing/membership-invites/fixtures';
import {
  insertTeam,
  insertTestMember,
  MOCK_EDITOR_EMAIL,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { countSeatsInUse, countUnlockedSeatsInUse } from './count-seats-in-use';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

function insertLockedEditor(tenantId: string) {
  return insertTestMember(db(), tenantId, MOCK_EDITOR_EMAIL, {
    role: MEMBERSHIP_ROLE.EDITOR,
    lockedAt: MOCK_NOW,
  });
}

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

  it('counts a locked member', async () => {
    await insertTeam(db(), tenantId, [MEMBERSHIP_ROLE.OWNER]);
    await insertLockedEditor(tenantId);

    expect(await countSeatsInUse(tenantId)).toBe(2);
  });

  it("does not count another tenant's seats", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTeam(db(), otherTenantId, [MEMBERSHIP_ROLE.OWNER]);
    await mockMembershipInvite(db(), otherTenantId);

    expect(await countSeatsInUse(tenantId)).toBe(0);
  });
});

describe(countUnlockedSeatsInUse, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await insertTeam(db(), tenantId, [MEMBERSHIP_ROLE.OWNER]);
    await insertLockedEditor(tenantId);
    await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });
  });

  it('counts unlocked members and pending invites, but not a locked member', async () => {
    expect(await countUnlockedSeatsInUse(tenantId)).toBe(2);
  });
});

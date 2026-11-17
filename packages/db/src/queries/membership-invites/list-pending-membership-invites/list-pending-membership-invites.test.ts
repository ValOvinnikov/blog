import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import {
  insertTestTenant,
  MOCK_INVITE_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  deleteSeatRows,
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@shinefold/db/testing/membership-invites/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { listPendingMembershipInvites } from './list-pending-membership-invites';

vi.mock('@shinefold/db/client');

faker.seed(7168);

const db = useQueryTestDb();

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(listPendingMembershipInvites, () => {
  it('lists only this tenant’s pending invites, with decrypted emails', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await mockMembershipInvite(db(), otherTenantId);
    await mockMembershipInvite(db(), tenantId, {
      consumedAt: MOCK_INVITE_CONSUMED_AT,
    });
    const pending = await mockMembershipInvite(db(), tenantId, {
      email: MOCK_INVITE_EMAIL,
      role: MEMBERSHIP_ROLE.EDITOR,
      createdAt: MOCK_NOW,
    });

    await expect(listPendingMembershipInvites(tenantId)).resolves.toEqual([
      {
        inviteId: pending.id,
        email: MOCK_INVITE_EMAIL,
        role: MEMBERSHIP_ROLE.EDITOR,
        invitedAt: MOCK_NOW,
      },
    ]);
  });
});

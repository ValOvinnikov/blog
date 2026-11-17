import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import {
  deleteSeatRows,
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@shinefold/db/testing/membership-invites/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { cancelMembershipInvite } from './cancel-membership-invite';

vi.mock('@shinefold/db/client');

faker.seed(7169);

const db = useQueryTestDb();

let tenantId: string;

beforeEach(async () => {
  ({ id: tenantId } = await insertTestTenant(db()));
});

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(cancelMembershipInvite, () => {
  it('deletes a pending editor invite', async () => {
    const { id } = await mockMembershipInvite(db(), tenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    await expect(cancelMembershipInvite(tenantId, id)).resolves.toBe(true);
    await expect(db().select().from(schema.membershipInvites)).resolves.toEqual(
      [],
    );
  });

  it.each([
    { role: MEMBERSHIP_ROLE.OWNER, consumedAt: null },
    { role: MEMBERSHIP_ROLE.EDITOR, consumedAt: MOCK_INVITE_CONSUMED_AT },
  ])(
    'keeps a $role invite that is an owner’s or already accepted',
    async (invite) => {
      const { id } = await mockMembershipInvite(db(), tenantId, invite);

      await expect(cancelMembershipInvite(tenantId, id)).resolves.toBe(false);
      await expect(
        db().select().from(schema.membershipInvites),
      ).resolves.toHaveLength(1);
    },
  );

  it('keeps another tenant’s invite', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id } = await mockMembershipInvite(db(), otherTenantId, {
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    await expect(cancelMembershipInvite(tenantId, id)).resolves.toBe(false);
  });
});

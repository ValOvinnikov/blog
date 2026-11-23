import { ADMIN_ROLE } from '@shinefold/db/constants';
import { createAdminInvite } from '@shinefold/db/queries/admin-invites/create-admin-invite';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_ADMIN_INVITE_EXPIRY,
  useAdminInviter,
} from '@shinefold/db/testing/admin-invites/fixtures';
import {
  MOCK_INVITE_EMAIL,
  MOCK_OPERATOR_EMAIL,
  MOCK_USER_NAME,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { findPendingAdminInvite } from './find-pending-admin-invite';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const inviterId = useAdminInviter(db);

async function setInviterPersonalData(
  personalData: Parameters<typeof userPersonalColumns>[0],
): Promise<void> {
  await db()
    .update(schema.users)
    .set(userPersonalColumns(personalData))
    .where(eq(schema.users.id, inviterId()));
}

describe(findPendingAdminInvite, () => {
  describe('with a pending invite', () => {
    beforeEach(async () => {
      await createAdminInvite(
        MOCK_INVITE_EMAIL,
        ADMIN_ROLE.SUPERADMIN,
        inviterId(),
      );
    });

    it("returns the invited role with the inviter's name and email", async () => {
      await setInviterPersonalData({
        email: MOCK_OPERATOR_EMAIL,
        name: MOCK_USER_NAME,
      });

      await expect(findPendingAdminInvite(MOCK_INVITE_EMAIL)).resolves.toEqual({
        role: ADMIN_ROLE.SUPERADMIN,
        inviterName: MOCK_USER_NAME,
        inviterEmail: MOCK_OPERATOR_EMAIL,
      });
    });

    it('matches the address regardless of case and surrounding whitespace', async () => {
      const invite = await findPendingAdminInvite(
        `  ${MOCK_INVITE_EMAIL.toUpperCase()}  `,
      );

      expect(invite?.role).toBe(ADMIN_ROLE.SUPERADMIN);
    });

    it('returns no inviter details once the inviter is deleted', async () => {
      await db().delete(schema.users).where(eq(schema.users.id, inviterId()));

      await expect(findPendingAdminInvite(MOCK_INVITE_EMAIL)).resolves.toEqual({
        role: ADMIN_ROLE.SUPERADMIN,
        inviterName: null,
        inviterEmail: null,
      });
    });

    it('returns nothing once the invite has expired', async () => {
      vi.setSystemTime(MOCK_ADMIN_INVITE_EXPIRY);

      await expect(
        findPendingAdminInvite(MOCK_INVITE_EMAIL),
      ).resolves.toBeUndefined();
    });
  });

  it('returns nothing for an address with no invite', async () => {
    await expect(
      findPendingAdminInvite(MOCK_INVITE_EMAIL),
    ).resolves.toBeUndefined();
  });
});

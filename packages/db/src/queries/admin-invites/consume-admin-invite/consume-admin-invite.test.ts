import { ADMIN_ROLE, GRANTED_VIA } from '@shinefold/db/constants';
import { createAdminInvite } from '@shinefold/db/queries/admin-invites/create-admin-invite';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import {
  useAdminInviter,
  MOCK_ADMIN_INVITE_EXPIRY,
} from '@shinefold/db/testing/admin-invites/fixtures';
import { insertTestAdminForUser } from '@shinefold/db/testing/admins/fixtures';
import {
  insertTestUser,
  MOCK_INVITE_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { consumeAdminInvite } from './consume-admin-invite';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const inviterId = useAdminInviter(db);

let inviteeId: string;

beforeEach(async () => {
  ({ id: inviteeId } = await insertTestUser(
    db(),
    userPersonalColumns({ email: MOCK_INVITE_EMAIL }),
  ));
});

describe(consumeAdminInvite, () => {
  describe('with a pending invite', () => {
    beforeEach(async () => {
      await createAdminInvite(
        MOCK_INVITE_EMAIL,
        ADMIN_ROLE.MODERATOR,
        inviterId(),
      );
    });

    it('grants the invited role through the invite and removes it', async () => {
      const admin = await consumeAdminInvite(MOCK_INVITE_EMAIL, inviteeId);

      const invites = await db().select().from(schema.adminInvites);
      expect(admin).toMatchObject({
        userId: inviteeId,
        role: ADMIN_ROLE.MODERATOR,
        grantedBy: inviterId(),
        grantedVia: GRANTED_VIA.INVITE,
      });
      expect(invites).toHaveLength(0);
    });

    it('grants nothing once the invite has expired', async () => {
      vi.setSystemTime(MOCK_ADMIN_INVITE_EXPIRY);

      const admin = await consumeAdminInvite(MOCK_INVITE_EMAIL, inviteeId);

      const admins = await db().select().from(schema.admins);
      expect(admin).toBeUndefined();
      expect(admins).toHaveLength(0);
    });

    it('keeps the existing grant of a user who is already an admin', async () => {
      await insertTestAdminForUser(db(), inviteeId, {
        role: ADMIN_ROLE.SUPERADMIN,
      });

      const admin = await consumeAdminInvite(MOCK_INVITE_EMAIL, inviteeId);

      const [kept] = await db().select().from(schema.admins);
      const invites = await db().select().from(schema.adminInvites);
      expect(admin).toBeUndefined();
      expect(kept?.role).toBe(ADMIN_ROLE.SUPERADMIN);
      expect(invites).toHaveLength(0);
    });
  });

  it('grants nothing to an address with no invite', async () => {
    await expect(
      consumeAdminInvite(MOCK_INVITE_EMAIL, inviteeId),
    ).resolves.toBeUndefined();
  });
});

import { ADMIN_ROLE } from '@shinefold/db/constants';
import { createAdminInvite } from '@shinefold/db/queries/admin-invites/create-admin-invite';
import {
  adminInviteOf,
  useAdminInviter,
  MOCK_ADMIN_INVITE_EXPIRY,
} from '@shinefold/db/testing/admin-invites/fixtures';
import { MOCK_INVITE_EMAIL } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { listAdminInvites } from './list-admin-invites';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const inviterId = useAdminInviter(db);

describe(listAdminInvites, () => {
  it('still lists an invite past its expiry, with its decrypted address', async () => {
    const { id } = adminInviteOf(
      await createAdminInvite(MOCK_INVITE_EMAIL, ADMIN_ROLE.ADMIN, inviterId()),
    );
    vi.setSystemTime(MOCK_ADMIN_INVITE_EXPIRY);

    await expect(listAdminInvites()).resolves.toEqual([
      {
        inviteId: id,
        email: MOCK_INVITE_EMAIL,
        role: ADMIN_ROLE.ADMIN,
        invitedAt: MOCK_NOW,
        expiresAt: MOCK_ADMIN_INVITE_EXPIRY,
      },
    ]);
  });
});

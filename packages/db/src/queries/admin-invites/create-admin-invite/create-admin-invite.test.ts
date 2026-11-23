import {
  ADMIN_INVITE_LIFETIME_DAYS,
  ADMIN_INVITE_OUTCOME,
  ADMIN_ROLE,
} from '@shinefold/db/constants';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import {
  adminInviteOf,
  useAdminInviter,
  MOCK_ADMIN_INVITE_EXPIRY,
} from '@shinefold/db/testing/admin-invites/fixtures';
import { insertTestAdmin } from '@shinefold/db/testing/admins/fixtures';
import {
  insertTestUser,
  MOCK_INVITE_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { daysAfter } from '@shinefold/db/utils/day-offset/day-offset';

import { createAdminInvite } from './create-admin-invite';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const inviterId = useAdminInviter(db);

describe(createAdminInvite, () => {
  it('creates a pending invite with its role, inviter and expiry', async () => {
    const { role, invitedBy, expiresAt } = adminInviteOf(
      await createAdminInvite(MOCK_INVITE_EMAIL, ADMIN_ROLE.ADMIN, inviterId()),
    );

    expect(role).toBe(ADMIN_ROLE.ADMIN);
    expect(invitedBy).toBe(inviterId());
    expect(expiresAt).toEqual(MOCK_ADMIN_INVITE_EXPIRY);
  });

  it('replaces the role and restarts the expiry of an address already invited', async () => {
    await createAdminInvite(MOCK_INVITE_EMAIL, ADMIN_ROLE.ADMIN, inviterId());
    vi.setSystemTime(MOCK_ADMIN_INVITE_EXPIRY);

    const { role, expiresAt } = adminInviteOf(
      await createAdminInvite(
        MOCK_INVITE_EMAIL,
        ADMIN_ROLE.MODERATOR,
        inviterId(),
      ),
    );

    const rows = await db().select().from(schema.adminInvites);
    expect(rows).toHaveLength(1);
    expect(role).toBe(ADMIN_ROLE.MODERATOR);
    expect(expiresAt).toEqual(
      daysAfter(MOCK_ADMIN_INVITE_EXPIRY, ADMIN_INVITE_LIFETIME_DAYS),
    );
  });

  it('refuses an address that is already an admin', async () => {
    await insertTestAdmin(
      db(),
      userPersonalColumns({ email: MOCK_INVITE_EMAIL }),
    );

    const result = await createAdminInvite(
      MOCK_INVITE_EMAIL,
      ADMIN_ROLE.ADMIN,
      inviterId(),
    );

    const rows = await db().select().from(schema.adminInvites);
    expect(result).toEqual({ outcome: ADMIN_INVITE_OUTCOME.ALREADY_ADMIN });
    expect(rows).toHaveLength(0);
  });

  it('invites an address whose account is not an admin', async () => {
    await insertTestUser(
      db(),
      userPersonalColumns({ email: MOCK_INVITE_EMAIL }),
    );

    const { outcome } = await createAdminInvite(
      MOCK_INVITE_EMAIL,
      ADMIN_ROLE.ADMIN,
      inviterId(),
    );

    expect(outcome).toBe(ADMIN_INVITE_OUTCOME.INVITED);
  });
});

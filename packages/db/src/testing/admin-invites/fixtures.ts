import { ADMIN_INVITE_LIFETIME_DAYS } from '@shinefold/db/constants';
import type { TCreateAdminInviteResult } from '@shinefold/db/queries/admin-invites/create-admin-invite';
import * as schema from '@shinefold/db/schema';
import type { TAdminInvite } from '@shinefold/db/schema/admin-invites';
import { useAdminRowCleanup } from '@shinefold/db/testing/admins/fixtures';
import { insertTestUser, type TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { daysAfter } from '@shinefold/db/utils/day-offset/day-offset';

export const MOCK_ADMIN_INVITE_EXPIRY = daysAfter(
  MOCK_NOW,
  ADMIN_INVITE_LIFETIME_DAYS,
);

export function adminInviteOf(result: TCreateAdminInviteResult): TAdminInvite {
  if (!('invite' in result)) {
    throw new Error(
      `adminInviteOf: the invite was refused (${result.outcome}).`,
    );
  }

  return result.invite;
}

export function useAdminInviter(db: () => TTestDb): () => string {
  let inviterId: string;

  useFrozenClock();

  beforeEach(async () => {
    ({ id: inviterId } = await insertTestUser(db()));
  });

  useAdminRowCleanup(db);

  afterEach(async () => {
    await db().delete(schema.adminInvites);
  });

  return () => inviterId;
}

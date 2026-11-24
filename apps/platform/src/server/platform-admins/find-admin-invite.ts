import 'server-only';

import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TAdminInviteListEntry } from '@shinefold/db/queries/admin-invites/list-admin-invites';

export const findAdminInvite = async (
  inviteId: string,
): Promise<TMaybeUndefined<TAdminInviteListEntry>> =>
  (await queries.adminInvites.listAdminInvites()).find(
    (invite) => invite.inviteId === inviteId,
  );

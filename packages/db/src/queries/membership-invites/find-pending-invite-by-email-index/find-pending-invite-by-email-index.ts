import { getDb } from '@blog/db/client';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import {
  readPersonalValue,
  requireEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { and, eq, isNull } from 'drizzle-orm';

// The index drops `+tag`s so data requests reach every variant; an invite still belongs only to the exact address.
export async function findPendingInviteByEmailIndex(
  email: string,
): Promise<TMembershipInvite[]> {
  const address = normalizeEmail(email);
  const candidates = await getDb()
    .select()
    .from(membershipInvites)
    .where(
      and(
        eq(
          membershipInvites.emailIndex,
          requireEmailIndex(address, personalDataIndex),
        ),
        isNull(membershipInvites.consumedAt),
      ),
    );

  return candidates.filter(
    (invite) =>
      normalizeEmail(readPersonalValue(invite.emailEncrypted, invite.email)) ===
      address,
  );
}

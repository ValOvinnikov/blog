import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import {
  decryptPersonalValue,
  requireDecryptedPersonalValue,
  requireEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { and, eq } from 'drizzle-orm';

const SUBSCRIBER_OWNER = 'Subscriber';

export type TUserSubscriber = Pick<TSubscriber, 'id' | 'status'> & {
  email: string;
};

// The index ignores a `+tag`, which some mail hosts deliver to a different
// mailbox, so a lookup only ever reaches the row for the exact address.
export async function findSubscriberByExactEmail(
  tenantId: string,
  normalizedEmail: string,
): Promise<TMaybeUndefined<TUserSubscriber>> {
  const rows = await getDb()
    .select({
      id: subscribers.id,
      status: subscribers.status,
      emailEncrypted: subscribers.emailEncrypted,
    })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(
          subscribers.emailIndex,
          requireEmailIndex(normalizedEmail, personalDataIndex),
        ),
      ),
    );

  return rows
    .map(({ id, status, emailEncrypted }) => ({
      id,
      status,
      email: requireDecryptedPersonalValue(emailEncrypted, SUBSCRIBER_OWNER),
    }))
    .find(({ email }) => normalizeEmail(email) === normalizedEmail);
}

export async function findUserSubscriber(
  tenantId: string,
  userId: string,
): Promise<TMaybeUndefined<TUserSubscriber>> {
  const [user] = await getDb()
    .select({ emailEncrypted: users.emailEncrypted })
    .from(users)
    .where(eq(users.id, userId));
  if (!user?.emailEncrypted) return undefined;

  return findSubscriberByExactEmail(
    tenantId,
    normalizeEmail(decryptPersonalValue(user.emailEncrypted)),
  );
}

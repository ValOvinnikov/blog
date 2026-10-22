import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import {
  decryptPersonalValue,
  requireDecryptedPersonalValue,
  requirePersonalEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { and, eq } from 'drizzle-orm';

export const SUBSCRIBER_OWNER = 'Subscriber';

export type TUserSubscriber = Pick<TSubscriber, 'id' | 'status'> & {
  email: string;
};

// The index ignores a `+tag`, which some mail hosts deliver to a different
// mailbox, so an account only ever reaches the row for its exact address.
export async function findUserSubscriber(
  tenantId: string,
  userId: string,
): Promise<TMaybeUndefined<TUserSubscriber>> {
  const db = getDb();
  const [user] = await db
    .select({ emailEncrypted: users.emailEncrypted })
    .from(users)
    .where(eq(users.id, userId));
  if (!user?.emailEncrypted) return undefined;

  const accountEmail = normalizeEmail(
    decryptPersonalValue(user.emailEncrypted),
  );
  const rows = await db
    .select({
      id: subscribers.id,
      status: subscribers.status,
      emailEncrypted: subscribers.emailEncrypted,
    })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.emailIndex, requirePersonalEmailIndex(accountEmail)),
      ),
    );

  return rows
    .map(({ id, status, emailEncrypted }) => ({
      id,
      status,
      email: requireDecryptedPersonalValue(emailEncrypted, SUBSCRIBER_OWNER),
    }))
    .find(({ email }) => normalizeEmail(email) === accountEmail);
}

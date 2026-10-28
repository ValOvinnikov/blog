import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import {
  byEmailAddress,
  withExactEmailAddress,
} from '@blog/db/utils/personal-data/email-address-match';
import { decryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { and, eq } from 'drizzle-orm';

export type TUserSubscriber = Pick<TSubscriber, 'id' | 'status'> & {
  email: string;
};

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
        byEmailAddress(normalizedEmail, subscribers.emailIndex),
      ),
    );

  const [found] = withExactEmailAddress(rows, normalizedEmail);
  if (!found) return undefined;

  const {
    row: { id, status },
    address,
  } = found;
  return { id, status, email: address };
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

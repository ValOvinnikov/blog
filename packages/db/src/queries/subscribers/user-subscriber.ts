import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import {
  byEmailAddress,
  withExactEmailAddress,
} from '@blog/db/utils/personal-data/email-address-match';
import { readReportedPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { isNull } from '@blog/utils/primitives';
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
      email: subscribers.email,
      emailEncrypted: subscribers.emailEncrypted,
    })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        byEmailAddress(normalizedEmail, {
          index: subscribers.emailIndex,
          plain: subscribers.email,
          owner: PERSONAL_DATA_OWNER.SUBSCRIBER,
        }),
      ),
    );

  const [found] = withExactEmailAddress(
    rows,
    normalizedEmail,
    PERSONAL_DATA_OWNER.SUBSCRIBER,
  );
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
    .select({ email: users.email, emailEncrypted: users.emailEncrypted })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return undefined;

  const { email, emailEncrypted } = user;
  const address = readReportedPersonalValue(
    PERSONAL_DATA_OWNER.USER,
    emailEncrypted,
    email,
  );
  if (isNull(address)) return undefined;

  return findSubscriberByExactEmail(tenantId, normalizeEmail(address));
}

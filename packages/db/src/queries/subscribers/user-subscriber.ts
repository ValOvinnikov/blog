import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import {
  isEmailIndexConfigured,
  readOptionalPersonalValue,
  readPersonalValue,
  reportPlainPersonalRead,
  requireEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { notifyPersonalDataFallback } from '@blog/db/utils/personal-data/personal-data-fallback';
import { personalDataIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { isNull } from '@blog/utils/primitives';
import {
  and,
  eq,
  isNull as isNullColumn,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

export type TUserSubscriber = Pick<TSubscriber, 'id' | 'status'> & {
  email: string;
};

function byAddress(normalizedEmail: string): TMaybeUndefined<SQL> {
  const plainMatch = sql`lower(trim(${subscribers.email})) = ${normalizedEmail}`;
  if (!isEmailIndexConfigured()) {
    notifyPersonalDataFallback({
      owner: PERSONAL_DATA_OWNER.SUBSCRIBER,
      reason: PERSONAL_DATA_FALLBACK_REASON.INDEX_KEY_UNSET,
    });
    return plainMatch;
  }

  return or(
    eq(
      subscribers.emailIndex,
      requireEmailIndex(normalizedEmail, personalDataIndex),
    ),
    and(isNullColumn(subscribers.emailIndex), plainMatch),
  );
}

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
      email: subscribers.email,
      emailEncrypted: subscribers.emailEncrypted,
    })
    .from(subscribers)
    .where(and(eq(subscribers.tenantId, tenantId), byAddress(normalizedEmail)));

  const found = rows
    .map((row) => ({
      ...row,
      address: readPersonalValue(row.emailEncrypted, row.email),
    }))
    .find(({ address }) => normalizeEmail(address) === normalizedEmail);
  if (!found) return undefined;

  const { id, status, emailEncrypted, address } = found;
  reportPlainPersonalRead(PERSONAL_DATA_OWNER.SUBSCRIBER, emailEncrypted);
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
  const address = readOptionalPersonalValue(emailEncrypted, email);
  if (isNull(address)) return undefined;
  reportPlainPersonalRead(PERSONAL_DATA_OWNER.USER, emailEncrypted);

  return findSubscriberByExactEmail(tenantId, normalizeEmail(address));
}

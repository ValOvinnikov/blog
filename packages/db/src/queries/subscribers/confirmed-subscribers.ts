import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { decryptPersonalValueOrUndefined } from '@shinefold/db/utils/personal-data/personal-data';
import { and, desc, eq, isNotNull, type SQL } from 'drizzle-orm';

export type TConfirmedSubscriber = {
  id: string;
  email: TMaybeUndefined<string>;
  confirmedAt: Date;
};

type TConfirmedSubscriberRow = {
  id: string;
  emailEncrypted: string;
  confirmedAt: TMaybeNull<Date>;
};

export const confirmedSubscriberColumns = {
  id: subscribers.id,
  emailEncrypted: subscribers.emailEncrypted,
  confirmedAt: subscribers.confirmedAt,
};

export const NEWEST_CONFIRMED_FIRST = [
  desc(subscribers.confirmedAt),
  desc(subscribers.id),
];

export function isConfirmedSubscriberOf(
  tenantId: string,
): TMaybeUndefined<SQL> {
  return and(
    eq(subscribers.tenantId, tenantId),
    eq(subscribers.status, SUBSCRIBER_STATUS.ACTIVE),
    isNotNull(subscribers.confirmedAt),
  );
}

export function toConfirmedSubscribers(
  rows: TConfirmedSubscriberRow[],
): TConfirmedSubscriber[] {
  return rows.flatMap(({ id, emailEncrypted, confirmedAt }) =>
    confirmedAt
      ? [
          {
            id,
            email: decryptPersonalValueOrUndefined(emailEncrypted),
            confirmedAt,
          },
        ]
      : [],
  );
}

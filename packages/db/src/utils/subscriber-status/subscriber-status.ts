import { SUBSCRIBER_STATUS, type TSubscriberStatus } from '@blog/db/constants';
import { subscribers } from '@blog/db/schema/subscribers';
import { sql, type SQL } from 'drizzle-orm';

// Case-insensitive while a web deployed before the upper-casing migration can still write lowercase values.
export function hasSubscriberStatus(status: TSubscriberStatus): SQL {
  return sql`upper(${subscribers.status}) = ${status}`;
}

export function toSubscriberStatus(stored: string): TSubscriberStatus {
  return stored.toUpperCase() === SUBSCRIBER_STATUS.ACTIVE
    ? SUBSCRIBER_STATUS.ACTIVE
    : SUBSCRIBER_STATUS.PENDING;
}

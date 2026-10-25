import type { TValueOf } from '@blog/config/utils';

export const SUBSCRIBER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
} as const;

export type TSubscriberStatus = TValueOf<typeof SUBSCRIBER_STATUS>;

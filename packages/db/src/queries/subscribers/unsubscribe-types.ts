import type { SUBSCRIBER_OUTCOME, TOutcome } from '@shinefold/config';

export type TUnsubscribeByLinkResult = TOutcome<
  typeof SUBSCRIBER_OUTCOME.UNSUBSCRIBED | typeof SUBSCRIBER_OUTCOME.NOT_FOUND
>;

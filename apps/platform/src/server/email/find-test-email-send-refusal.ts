import 'server-only';

import {
  DAY_MS,
  HOUR_MS,
} from '@platform/utils/format-relative-time/format-relative-time';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';

// Checked in order, so a sender refused for the hour spends none of the day's sends.
const TEST_EMAIL_SEND_WINDOWS = [
  { keyPrefix: 'test-email-hour', windowMs: HOUR_MS, maxSends: 5 },
  { keyPrefix: 'test-email-day', windowMs: DAY_MS, maxSends: 20 },
] as const;

export type TTestEmailSendRefusal = { retryAt: Date };

/** Counts one test email against its sender's stored limits, shared by every test-email surface. */
export const findTestEmailSendRefusal = async (
  userId: string,
): Promise<TMaybeUndefined<TTestEmailSendRefusal>> => {
  for (const { keyPrefix, windowMs, maxSends } of TEST_EMAIL_SEND_WINDOWS) {
    const { count, windowStartedAt } =
      await queries.testEmailSendCounters.incrementTestEmailSendCount(
        `${keyPrefix}:${userId}`,
        windowMs,
      );
    if (count > maxSends) {
      return { retryAt: new Date(windowStartedAt.getTime() + windowMs) };
    }
  }
  return undefined;
};

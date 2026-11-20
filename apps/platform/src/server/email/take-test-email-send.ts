import 'server-only';

import {
  DAY_MS,
  HOUR_MS,
} from '@platform/utils/format-relative-time/format-relative-time';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';

const MAX_SENDS_PER_HOUR = 5;
const MAX_SENDS_PER_DAY = 20;

export type TTestEmailSendRefusal = { retryAt: Date };

const hourKey = (userId: string) => `test-email-hour:${userId}`;
const dayKey = (userId: string) => `test-email-day:${userId}`;

const windowEnd = (windowStartedAt: Date, windowMs: number): Date =>
  new Date(windowStartedAt.getTime() + windowMs);

const laterOf = (first: Date, second: TMaybeUndefined<Date>): Date =>
  second && second > first ? second : first;

const readFullDayEnd = async (
  userId: string,
): Promise<TMaybeUndefined<Date>> => {
  const day = await queries.testEmailSendCounters.getTestEmailSendCount(
    dayKey(userId),
    DAY_MS,
  );
  return day && day.count >= MAX_SENDS_PER_DAY
    ? windowEnd(day.windowStartedAt, DAY_MS)
    : undefined;
};

export const takeTestEmailSend = async (
  userId: string,
): Promise<TMaybeUndefined<TTestEmailSendRefusal>> => {
  const { incrementTestEmailSendCount } = queries.testEmailSendCounters;
  const hour = await incrementTestEmailSendCount(hourKey(userId), HOUR_MS);
  if (hour.count > MAX_SENDS_PER_HOUR) {
    const hourEnd = windowEnd(hour.windowStartedAt, HOUR_MS);
    return { retryAt: laterOf(hourEnd, await readFullDayEnd(userId)) };
  }

  const day = await incrementTestEmailSendCount(dayKey(userId), DAY_MS);
  if (day.count > MAX_SENDS_PER_DAY) {
    return { retryAt: windowEnd(day.windowStartedAt, DAY_MS) };
  }
  return undefined;
};

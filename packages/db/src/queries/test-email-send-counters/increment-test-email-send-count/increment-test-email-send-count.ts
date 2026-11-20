import { testEmailSendCounters } from '@shinefold/db/schema/test-email-send-counters';
import {
  incrementFixedWindowCount,
  type TFixedWindowCount,
} from '@shinefold/db/utils/increment-fixed-window-count/increment-fixed-window-count';

export async function incrementTestEmailSendCount(
  key: string,
  windowMs: number,
): Promise<TFixedWindowCount> {
  return incrementFixedWindowCount(testEmailSendCounters, key, windowMs);
}

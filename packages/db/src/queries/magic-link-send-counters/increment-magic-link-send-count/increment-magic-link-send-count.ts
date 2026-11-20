import { magicLinkSendCounters } from '@shinefold/db/schema/magic-link-send-counters';
import { incrementFixedWindowCount } from '@shinefold/db/utils/increment-fixed-window-count/increment-fixed-window-count';

export async function incrementMagicLinkSendCount(
  key: string,
  windowMs: number,
): Promise<number> {
  const { count } = await incrementFixedWindowCount(
    magicLinkSendCounters,
    key,
    windowMs,
  );
  return count;
}

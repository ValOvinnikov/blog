import 'server-only';

import { SUPPORT_LIMIT } from '@platform/constants/support';
import { createRateLimitStore } from '@platform/server/rate-limit/create-rate-limit-store';

const store = createRateLimitStore();

export const takeSupportMessageSlot = async (
  userId: string,
): Promise<boolean> => {
  const count = await store.increment(
    `support:user:${userId}`,
    SUPPORT_LIMIT.WINDOW_MS,
  );

  return count <= SUPPORT_LIMIT.MESSAGES_PER_WINDOW;
};

import 'server-only';

import { alertSelfServeLimit } from '@platform/server/create-site-gate/alert-self-serve-limit';
import { createRateLimitStore } from '@platform/server/rate-limit/create-rate-limit-store';
import { logger } from '@platform/utils/logger/logger';

export const MAX_SITES_PER_IP_PER_DAY = 3;
export const MAX_SELF_SERVE_SITES_PER_DAY = 50;

const DAY_MS = 24 * 60 * 60_000;

const store = createRateLimitStore();

const toUtcDay = (now: Date): string => now.toISOString().slice(0, 10);

export const takeCreateSiteSlot = async (
  clientKey: string,
  now = new Date(),
): Promise<boolean> => {
  const day = toUtcDay(now);

  const ipCount = await store.increment(
    `create-site:ip:${day}:${clientKey}`,
    DAY_MS,
  );
  if (ipCount > MAX_SITES_PER_IP_PER_DAY) {
    logger.warn('create_site_gate.ip_limited', { day });
    return false;
  }

  const globalCount = await store.increment(
    `create-site:global:${day}`,
    DAY_MS,
  );
  if (globalCount <= MAX_SELF_SERVE_SITES_PER_DAY) return true;

  logger.warn('create_site_gate.global_limited', { day });
  if (globalCount === MAX_SELF_SERVE_SITES_PER_DAY + 1) {
    await alertSelfServeLimit(day, MAX_SELF_SERVE_SITES_PER_DAY);
  }
  return false;
};

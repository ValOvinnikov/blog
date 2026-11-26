import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { createPublicWriteGuard } from '@web/server/rate-limit/public-write-guard/public-write-guard';

const { isBotOrUnverified, isRateLimited } = createPublicWriteGuard({
  name: 'newsletter-subscribe',
  blockedEvent: NEWSLETTER_LOG.SUBSCRIBE_BLOCKED,
  windowMs: 10 * 60_000,
  maxRequests: 5,
});

export const isSubscribeAttemptRefused = async (
  tenantId: string,
): Promise<boolean> => (await isBotOrUnverified()) || isRateLimited(tenantId);

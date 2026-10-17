import { createPublicWriteGuard } from '@web/server/rate-limit/public-write-guard/public-write-guard';

const { isBotOrUnverified, isRateLimited } = createPublicWriteGuard({
  name: 'newsletter-subscribe',
  blockedEvent: 'newsletter.subscribe_blocked',
  windowMs: 10 * 60_000,
  maxRequests: 5,
});

export const isSubscribeAttemptRefused = async (
  tenantId: string,
): Promise<boolean> => (await isBotOrUnverified()) || isRateLimited(tenantId);

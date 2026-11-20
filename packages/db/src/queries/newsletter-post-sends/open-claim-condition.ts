import type { TMaybeUndefined } from '@shinefold/config/types';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { and, eq, isNull, type SQL } from 'drizzle-orm';

export function isUnsettledClaimOf(
  tenantId: string,
  postId: string,
): TMaybeUndefined<SQL> {
  return and(
    eq(newsletterPostSends.tenantId, tenantId),
    eq(newsletterPostSends.postId, postId),
    isNull(newsletterPostSends.outcome),
  );
}

export function isOpenClaim(
  tenantId: string,
  postId: string,
  claimedAt: Date,
): TMaybeUndefined<SQL> {
  return and(
    isUnsettledClaimOf(tenantId, postId),
    eq(newsletterPostSends.claimedAt, claimedAt),
  );
}

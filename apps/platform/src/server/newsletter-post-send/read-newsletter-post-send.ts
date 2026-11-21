import 'server-only';

import {
  isHandSendableClaim,
  toSendNowEligibility,
} from '@platform/utils/newsletter-send-now-eligibility/newsletter-send-now-eligibility';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  NEWSLETTER_SKIP_REASON,
  type TMaybeUndefined,
  type TNewsletterSendingOffCause,
  type TNewsletterSendNowEligibility,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { EMAIL_REPUTATION_LEVEL } from '@shinefold/db/constants';
import type { INewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends';
import { emailReputationLevel } from '@shinefold/db/utils/email-reputation-level/email-reputation-level';
import { utcNextMonthStart } from '@shinefold/utils/date';

export type TNewsletterPostSendRequest = {
  postId: string;
  isPublished: boolean;
};

export type TNewsletterPostSendRead = {
  claim: TMaybeUndefined<INewsletterPostSend>;
  sendingOffCause: TMaybeUndefined<TNewsletterSendingOffCause>;
  confirmedCount: number;
  bandCeiling: TMaybeUndefined<number>;
  sendNow: TNewsletterSendNowEligibility;
};

const readSendingOffCause = async (
  tenantId: string,
): Promise<TMaybeUndefined<TNewsletterSendingOffCause>> => {
  const result =
    await queries.newsletterPostSends.getNewsletterSendingOffCause(tenantId);
  if (!result.ok) {
    throw new Error(
      `Reading why the site isn't sending failed: ${result.error}`,
    );
  }
  return result.data;
};

const isSendingStopped = async (tenantId: string): Promise<boolean> => {
  const [pausedAt, reputation] = await Promise.all([
    queries.emailConfig.getNewsletterPausedAt(tenantId),
    queries.emailUsage.getEmailReputation(tenantId),
  ]);
  return (
    Boolean(pausedAt) ||
    emailReputationLevel(reputation) === EMAIL_REPUTATION_LEVEL.STOP
  );
};

/** The status route's read, which the send-now route re-runs so both judge a post by the same rules. */
export const readNewsletterPostSend = async (
  tenant: TPlatformTenant,
  { postId, isPublished }: TNewsletterPostSendRequest,
): Promise<TNewsletterPostSendRead> => {
  const { id: tenantId } = tenant;
  const [claim, sendingOffCause] = await Promise.all([
    queries.newsletterPostSends.getNewsletterPostSend(tenantId, postId),
    readSendingOffCause(tenantId),
  ]);
  const isCandidate = isPublished && isHandSendableClaim(claim);
  const isBandSkip =
    claim?.skipReason === NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND;

  if (!isCandidate && !isBandSkip) {
    return {
      claim,
      sendingOffCause,
      confirmedCount:
        await queries.subscribers.countActiveSubscribers(tenantId),
      bandCeiling: undefined,
      sendNow: { isOffered: false },
    };
  }

  const limits = await queries.emailUsage.getNewsletterLimits(tenant);
  const sendNow: TNewsletterSendNowEligibility = isCandidate
    ? toSendNowEligibility({
        sendingOffCause,
        isSendingStopped: await isSendingStopped(tenantId),
        limits,
        resetsAt: utcNextMonthStart(new Date()),
      })
    : { isOffered: false };

  return {
    claim,
    sendingOffCause,
    confirmedCount: limits.activeCount,
    bandCeiling: limits.bandCeiling,
    sendNow,
  };
};

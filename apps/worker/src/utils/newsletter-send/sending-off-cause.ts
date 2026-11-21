import {
  NEWSLETTER_HAND_SENDABLE_SKIP_REASONS,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSendingOffCause,
  type TNewsletterSkipReason,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getNewsletterPausedAt } from '@shinefold/db/queries/email-config';
import { getNewsletterSendingOffCause } from '@shinefold/db/queries/newsletter-post-sends';
import { isOneOf } from '@shinefold/utils/primitives';

/** A cause Send emails can never clear is kept on the claim, so the post is not emailed after the site moves back. */
export function isOffCauseRecorded(cause: TNewsletterSendingOffCause): boolean {
  return !isOneOf(NEWSLETTER_HAND_SENDABLE_SKIP_REASONS, cause);
}

// A send stopped part-way must never be offered Send emails, so a cause it could clear is stored as a pause.
export async function readPageStopReason(
  tenantId: string,
): Promise<TMaybeUndefined<TNewsletterSkipReason>> {
  const [pausedAt, offCause] = await Promise.all([
    getNewsletterPausedAt(tenantId),
    getNewsletterSendingOffCause(tenantId),
  ]);
  if (pausedAt || !offCause.ok) return NEWSLETTER_SKIP_REASON.SITE_PAUSED;
  const cause = offCause.data;
  if (!cause) return undefined;
  return isOffCauseRecorded(cause) ? cause : NEWSLETTER_SKIP_REASON.SITE_PAUSED;
}

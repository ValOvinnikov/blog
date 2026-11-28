import { MOCK_NEWSLETTER_LIMITS } from '@platform/testing/newsletter-post-send/fixtures';
import {
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_EARLIER_CLAIMED_AT,
  MOCK_LATER,
  MOCK_POST_SEND_START,
  MOCK_SKIP_DETAILS,
  mockNewsletterPostSend,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';

import { toNewsletterPostSendState } from './newsletter-post-send-state';

const MOCK_SENT_COUNT = 7;
const { recipientCount } = MOCK_POST_SEND_START;

describe(toNewsletterPostSendState, () => {
  it('reports no send for a post with no claim', () => {
    expect(toNewsletterPostSendState(undefined, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.NONE,
    });
  });

  it('reports a future send date as scheduled, never as sending', () => {
    const claim = mockNewsletterPostSend({ scheduledFor: MOCK_LATER });

    expect(toNewsletterPostSendState(claim, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.SCHEDULED,
      scheduledFor: MOCK_LATER.toISOString(),
    });
  });

  it('reports a queued claim as sending, without counts', () => {
    const claim = mockNewsletterPostSend({ handStartedAt: MOCK_NOW });

    expect(toNewsletterPostSendState(claim, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.SENDING,
    });
  });

  it('reports a started run with its progress', () => {
    const claim = mockNewsletterPostSend({
      recipientCount,
      sentCount: MOCK_SENT_COUNT,
      scheduledFor: MOCK_EARLIER_CLAIMED_AT,
    });

    expect(toNewsletterPostSendState(claim, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.SENDING,
      sent: MOCK_SENT_COUNT,
      recipients: recipientCount,
    });
  });

  it('reports a sent post with its recipients and when it settled', () => {
    const claim = mockNewsletterPostSend({
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
      recipientCount,
      sentCount: recipientCount,
      settledAt: MOCK_LATER,
    });

    expect(toNewsletterPostSendState(claim, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.SENT,
      recipients: recipientCount,
      settledAt: MOCK_LATER.toISOString(),
    });
  });

  it.each([
    NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
    NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ])('reports a post skipped for %s with that reason', (skipReason) => {
    const claim = mockNewsletterPostSend({
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
      skipReason,
    });

    expect(toNewsletterPostSendState(claim, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.SKIPPED,
      skipReason,
    });
  });

  describe('for a band skip', () => {
    const bandSkip = {
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
      skipReason: NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    } as const;

    it('names the band the skip was measured against, not the site’s current band', () => {
      const claim = mockNewsletterPostSend({
        ...bandSkip,
        bandCeiling: MOCK_SKIP_DETAILS.bandCeiling,
      });

      expect(
        toNewsletterPostSendState(
          claim,
          MOCK_NEWSLETTER_LIMITS.bandCeiling,
          MOCK_NOW,
        ),
      ).toEqual({
        status: NEWSLETTER_SEND_STATUS.SKIPPED,
        skipReason: bandSkip.skipReason,
        bandCeiling: MOCK_SKIP_DETAILS.bandCeiling,
      });
    });

    it('falls back to the site’s band for a skip that recorded none', () => {
      const claim = mockNewsletterPostSend(bandSkip);

      expect(
        toNewsletterPostSendState(
          claim,
          MOCK_NEWSLETTER_LIMITS.bandCeiling,
          MOCK_NOW,
        ),
      ).toEqual({
        status: NEWSLETTER_SEND_STATUS.SKIPPED,
        skipReason: bandSkip.skipReason,
        bandCeiling: MOCK_NEWSLETTER_LIMITS.bandCeiling,
      });
    });
  });

  it('reports a failed run with how far it got', () => {
    const claim = mockNewsletterPostSend({
      outcome: NEWSLETTER_POST_SEND_OUTCOME.FAILED,
      recipientCount,
      sentCount: MOCK_SENT_COUNT,
    });

    expect(toNewsletterPostSendState(claim, undefined, MOCK_NOW)).toEqual({
      status: NEWSLETTER_SEND_STATUS.FAILED,
      sent: MOCK_SENT_COUNT,
      recipients: recipientCount,
    });
  });
});

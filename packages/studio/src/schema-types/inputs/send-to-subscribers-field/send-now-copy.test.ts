import { NEWSLETTER_SEND_NOW_REFUSAL } from '@shinefold/config';
import { MOCK_EMAILS_LEFT } from '@shinefold/studio/testing/newsletter-post-send-status';

import { sendNowDisabledReason } from './send-now-copy';
import { formatSendCount, formatSendDay } from './send-status-format';

const MOCK_BAND_CEILING = 2_500;
const MOCK_EMAILS_NEEDED = 3_100;
const MOCK_RESETS_AT = '2026-12-01T00:00:00.000Z';

describe(sendNowDisabledReason, () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  it('gives no reason once the post can be sent', () => {
    expect(
      sendNowDisabledReason({ isOffered: true, emailsLeft: MOCK_EMAILS_LEFT }),
    ).toBeUndefined();
  });

  it.each([
    NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF,
    NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF,
  ] as const)('gives a reason while %s', (disabledBy) => {
    expect(sendNowDisabledReason({ isOffered: true, disabledBy })).toBeTypeOf(
      'string',
    );
  });

  it('names the band the site is over', () => {
    const reason = sendNowDisabledReason({
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND,
      bandCeiling: MOCK_BAND_CEILING,
    });

    expect(reason).toContain(formatSendCount(MOCK_BAND_CEILING));
  });

  it('names the emails needed, the emails left and the reset date', () => {
    const reason = sendNowDisabledReason({
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH,
      emailsNeeded: MOCK_EMAILS_NEEDED,
      emailsLeft: MOCK_EMAILS_LEFT,
      resetsAt: MOCK_RESETS_AT,
    });

    expect([
      reason?.includes(formatSendCount(MOCK_EMAILS_NEEDED)),
      reason?.includes(formatSendCount(MOCK_EMAILS_LEFT)),
      reason?.includes(formatSendDay(MOCK_RESETS_AT)),
    ]).toStrictEqual([true, true, true]);
  });
});

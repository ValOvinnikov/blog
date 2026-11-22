import { faker } from '@faker-js/faker';
import { NEWSLETTER_SEND_NOW_REFUSAL } from '@shinefold/config';
import {
  MOCK_BAND_CEILING,
  MOCK_EMAILS_LEFT,
} from '@shinefold/studio/testing/newsletter-post-send-status';

import { sendNowDisabledReason } from './send-now-copy';
import { formatSendCount } from './send-status-format';

faker.seed(7711);

const MOCK_EMAILS_NEEDED =
  MOCK_EMAILS_LEFT + faker.number.int({ min: 1, max: 999 });
const MOCK_RESETS_AT = '2026-12-01T00:00:00.000Z';

describe(sendNowDisabledReason, () => {
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

  it('names the emails needed, the emails left and the UTC reset day', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
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
      reason?.includes('1 Dec 2026'),
    ]).toStrictEqual([true, true, true]);
  });
});

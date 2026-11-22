import { faker } from '@faker-js/faker';
import {
  ACTION_OUTCOME,
  NEWSLETTER_TEST_SEND_REFUSAL,
} from '@shinefold/config';
import { formatSendTime } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-format';

import { SEND_TEST_FAILED_TOAST, toSendTestToast } from './send-test-toast';

faker.seed(7711);

const MOCK_EMAIL = faker.internet.email();
const MOCK_RETRY_AT = '2026-11-22T15:40:00.000Z';

describe(toSendTestToast, () => {
  it('confirms a sent test with the address it went to', () => {
    const toast = toSendTestToast(
      { outcome: ACTION_OUTCOME.SUCCESS },
      MOCK_EMAIL,
    );

    expect([
      toast.status,
      String(toast.title).includes(MOCK_EMAIL),
    ]).toStrictEqual(['success', true]);
  });

  it('names the time to try again once over the limit', () => {
    const toast = toSendTestToast(
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED,
        retryAt: MOCK_RETRY_AT,
      },
      MOCK_EMAIL,
    );

    expect(String(toast.title)).toContain(formatSendTime(MOCK_RETRY_AT));
  });

  it.each([
    NEWSLETTER_TEST_SEND_REFUSAL.SEND_FAILED,
    NEWSLETTER_TEST_SEND_REFUSAL.INVALID_FIELDS,
    NEWSLETTER_TEST_SEND_REFUSAL.FORBIDDEN,
  ] as const)('says to try again after a %s refusal', (reason) => {
    expect(
      toSendTestToast({ outcome: ACTION_OUTCOME.REFUSED, reason }, MOCK_EMAIL),
    ).toBe(SEND_TEST_FAILED_TOAST);
  });
});

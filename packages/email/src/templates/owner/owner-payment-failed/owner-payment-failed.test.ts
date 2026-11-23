import { faker } from '@faker-js/faker';
import { buildOwnerEmail } from '@shinefold/email/templates/owner/owner-email/owner-email';
import { MOCK_NOW } from '@shinefold/email/testing/email-fixtures';
import {
  MOCK_EMAIL_DETAILS,
  MOCK_OWNER_EMAIL_INPUT,
} from '@shinefold/email/testing/owner-email';

import { buildOwnerPaymentFailedEmail } from './owner-payment-failed';

faker.seed(7861);

const MOCK_PLAN_ENDING_NOTICE = faker.lorem.sentence();
const MOCK_NEXT_RETRY = {
  label: faker.lorem.word({ length: { min: 5, max: 10 } }),
  value: faker.date.future({ refDate: MOCK_NOW }).toISOString(),
};
const MOCK_INPUT = {
  ...MOCK_OWNER_EMAIL_INPUT,
  details: MOCK_EMAIL_DETAILS,
  planEndingNotice: MOCK_PLAN_ENDING_NOTICE,
};

describe(buildOwnerPaymentFailedEmail, () => {
  describe('when Stripe will retry the payment', () => {
    it('lists the next retry after the amount and plan rows', () => {
      const email = buildOwnerPaymentFailedEmail({
        ...MOCK_INPUT,
        nextRetry: MOCK_NEXT_RETRY,
      });

      expect(email).toEqual(
        buildOwnerEmail({
          ...MOCK_OWNER_EMAIL_INPUT,
          details: [...MOCK_EMAIL_DETAILS, MOCK_NEXT_RETRY],
        }),
      );
    });
  });

  describe('when Stripe will not retry the payment', () => {
    it('says the plan will end in place of a retry date', () => {
      const email = buildOwnerPaymentFailedEmail({
        ...MOCK_INPUT,
        nextRetry: undefined,
      });

      expect(email).toEqual(
        buildOwnerEmail({
          ...MOCK_OWNER_EMAIL_INPUT,
          paragraphs: [
            ...MOCK_OWNER_EMAIL_INPUT.paragraphs,
            MOCK_PLAN_ENDING_NOTICE,
          ],
          details: MOCK_EMAIL_DETAILS,
        }),
      );
    });
  });
});

import { MOCK_NOW } from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { buildSelfServeLimitAlertEmail } from './self-serve-limit-alert';

faker.seed(6026);

const MOCK_DAY = faker.date
  .recent({ refDate: MOCK_NOW })
  .toISOString()
  .slice(0, 10);
const MOCK_DAILY_LIMIT = faker.number.int({ min: 1000, max: 9999 });

describe(buildSelfServeLimitAlertEmail, () => {
  let email: ReturnType<typeof buildSelfServeLimitAlertEmail>;

  beforeEach(() => {
    email = buildSelfServeLimitAlertEmail({
      day: MOCK_DAY,
      dailyLimit: MOCK_DAILY_LIMIT,
    });
  });

  it('names the day in the subject', () => {
    expect(email.subject).toContain(MOCK_DAY);
  });

  it('states the limit reached and its day in the body', () => {
    expect(email.html).toContain(String(MOCK_DAILY_LIMIT));
    expect(email.html).toContain(MOCK_DAY);
  });
});

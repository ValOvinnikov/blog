import { faker } from '@faker-js/faker';
import { MOCK_RATE_LIMIT_START_MS } from '@platform/testing/rate-limit/fixtures';

import { takeTestEmailSend } from './test-email-rate-limit';

faker.seed(5998);

const SENDS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60_000;
const MOCK_ADMIN_A_ID = faker.string.uuid();
const MOCK_ADMIN_B_ID = faker.string.uuid();
const MOCK_ADMIN_C_ID = faker.string.uuid();
const MOCK_ADMIN_D_ID = faker.string.uuid();

const exhaustWindow = (userId: string) =>
  Array.from({ length: SENDS_PER_WINDOW }, () =>
    takeTestEmailSend(userId, MOCK_RATE_LIMIT_START_MS),
  );

describe(takeTestEmailSend, () => {
  it('allows five sends per admin in ten minutes, then refuses', () => {
    const allowed = Array.from({ length: SENDS_PER_WINDOW + 1 }, () =>
      takeTestEmailSend(MOCK_ADMIN_A_ID, MOCK_RATE_LIMIT_START_MS),
    );

    expect(allowed).toEqual([true, true, true, true, true, false]);
  });

  it('counts each admin separately', () => {
    exhaustWindow(MOCK_ADMIN_B_ID);

    const exhaustedAdmin = takeTestEmailSend(
      MOCK_ADMIN_B_ID,
      MOCK_RATE_LIMIT_START_MS,
    );
    const otherAdmin = takeTestEmailSend(
      MOCK_ADMIN_C_ID,
      MOCK_RATE_LIMIT_START_MS,
    );

    expect(exhaustedAdmin).toBe(false);
    expect(otherAdmin).toBe(true);
  });

  it('allows sends again once the window has passed', () => {
    exhaustWindow(MOCK_ADMIN_D_ID);

    const afterWindow = takeTestEmailSend(
      MOCK_ADMIN_D_ID,
      MOCK_RATE_LIMIT_START_MS + WINDOW_MS,
    );

    expect(afterWindow).toBe(true);
  });
});

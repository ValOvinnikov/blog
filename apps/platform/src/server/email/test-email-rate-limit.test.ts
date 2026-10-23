import { MOCK_RATE_LIMIT_START_MS } from '@platform/testing/rate-limit/fixtures';

import { takeTestEmailSend } from './test-email-rate-limit';

describe(takeTestEmailSend, () => {
  it('allows five sends per admin in ten minutes, then refuses', () => {
    const allowed = Array.from({ length: 6 }, () =>
      takeTestEmailSend('admin-a', MOCK_RATE_LIMIT_START_MS),
    );

    expect(allowed).toEqual([true, true, true, true, true, false]);
  });

  it('counts each admin separately', () => {
    Array.from({ length: 5 }, () =>
      takeTestEmailSend('admin-b', MOCK_RATE_LIMIT_START_MS),
    );

    expect(takeTestEmailSend('admin-b', MOCK_RATE_LIMIT_START_MS)).toBe(false);
    expect(takeTestEmailSend('admin-c', MOCK_RATE_LIMIT_START_MS)).toBe(true);
  });

  it('allows sends again once the window has passed', () => {
    Array.from({ length: 5 }, () =>
      takeTestEmailSend('admin-d', MOCK_RATE_LIMIT_START_MS),
    );

    expect(
      takeTestEmailSend('admin-d', MOCK_RATE_LIMIT_START_MS + 10 * 60_000),
    ).toBe(true);
  });
});

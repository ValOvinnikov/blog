import { buildSelfServeLimitAlertEmail } from './self-serve-limit-alert';

const DAY = '2026-10-21';

describe('buildSelfServeLimitAlertEmail', () => {
  it('names the day in the subject', () => {
    const { subject } = buildSelfServeLimitAlertEmail({
      day: DAY,
      dailyLimit: 50,
    });

    expect(subject).toBe(
      'Self-serve site creation hit its daily limit (2026-10-21)',
    );
  });

  it('states the limit that was reached', () => {
    const { html } = buildSelfServeLimitAlertEmail({
      day: DAY,
      dailyLimit: 50,
    });

    expect(html).toContain(
      'reached the limit of 50 new sites for 2026-10-21 (UTC)',
    );
  });
});

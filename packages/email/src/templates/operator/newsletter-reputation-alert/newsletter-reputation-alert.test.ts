import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_SIGN_IN_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import {
  buildNewsletterReputationAlertEmail,
  NEWSLETTER_REPUTATION_ALERT_LEVEL,
} from './newsletter-reputation-alert';

const { WARN, SLOW, STOP } = NEWSLETTER_REPUTATION_ALERT_LEVEL;
const MOCK_WINDOW_DAYS = 7;
const MOCK_ALERT = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  level: WARN,
  bounceRate: 0.0315,
  complaintRate: 0.00056,
  resolvedCount: 48_120,
  windowDays: MOCK_WINDOW_DAYS,
  adminUrl: MOCK_SIGN_IN_URL,
};

describe(buildNewsletterReputationAlertEmail, () => {
  describe('for a warning', () => {
    let email: ReturnType<typeof buildNewsletterReputationAlertEmail>;

    beforeEach(() => {
      email = buildNewsletterReputationAlertEmail(MOCK_ALERT);
    });

    it('names the tenant and its id in the subject', () => {
      expect(email.subject).toContain(MOCK_TENANT_NAME);
      expect(email.subject).toContain(MOCK_TENANT_ID);
    });

    it.each(['html', 'text'] as const)(
      'states both rates, the grouped sample and the window in the %s body',
      (part) => {
        expect(email[part]).toContain('3.15%');
        expect(email[part]).toContain('0.056%');
        expect(email[part]).toContain('48,120');
        expect(email[part]).toContain(String(MOCK_WINDOW_DAYS));
      },
    );

    it('links to the platform admin panel', () => {
      expect(email.html).toContain(`href="${MOCK_SIGN_IN_URL}"`);
      expect(email.text.endsWith(`: ${MOCK_SIGN_IN_URL}`)).toBe(true);
    });
  });

  it('gives each level its own subject and body', () => {
    const emails = [WARN, SLOW, STOP].map((level) =>
      buildNewsletterReputationAlertEmail({ ...MOCK_ALERT, level }),
    );

    expect(new Set(emails.map(({ subject }) => subject)).size).toBe(3);
    expect(new Set(emails.map(({ text }) => text)).size).toBe(3);
  });

  it('escapes every caller-supplied value in the HTML', () => {
    const { html } = buildNewsletterReputationAlertEmail({
      ...MOCK_ALERT,
      tenantName: MOCK_UNSAFE_MARKUP,
      tenantId: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});

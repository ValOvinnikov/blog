import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_SIGN_IN_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildNewsletterReputationAlertEmail } from './newsletter-reputation-alert';

const MOCK_RESOLVED_COUNT = 4812;
const MOCK_WINDOW_DAYS = 7;
const MOCK_ALERT = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  bounceRate: 0.0315,
  complaintRate: 0.0006,
  resolvedCount: MOCK_RESOLVED_COUNT,
  windowDays: MOCK_WINDOW_DAYS,
  isSendingPaused: false,
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
      'states both rates as percentages, the sample and the window in the %s body',
      (part) => {
        expect(email[part]).toContain('3.15%');
        expect(email[part]).toContain('0.06%');
        expect(email[part]).toContain(String(MOCK_RESOLVED_COUNT));
        expect(email[part]).toContain(String(MOCK_WINDOW_DAYS));
      },
    );

    it('links to the platform admin panel', () => {
      expect(email.html).toContain(`href="${MOCK_SIGN_IN_URL}"`);
      expect(email.text.endsWith(`: ${MOCK_SIGN_IN_URL}`)).toBe(true);
    });
  });

  it('gives a paused site a different subject from a warning', () => {
    const warning = buildNewsletterReputationAlertEmail(MOCK_ALERT);
    const paused = buildNewsletterReputationAlertEmail({
      ...MOCK_ALERT,
      isSendingPaused: true,
    });

    expect(paused.subject).not.toBe(warning.subject);
    expect(paused.text).not.toBe(warning.text);
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

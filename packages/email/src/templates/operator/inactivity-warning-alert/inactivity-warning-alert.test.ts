import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_NOW,
  MOCK_SIGN_IN_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { buildInactivityWarningAlertEmail } from './inactivity-warning-alert';

faker.seed(6026);

const MOCK_OWNER_EMAIL = faker.internet.email();
const MOCK_PAUSE_DATE = faker.date.future({ refDate: MOCK_NOW }).toDateString();
const MOCK_ALERT = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  ownerEmail: MOCK_OWNER_EMAIL,
  pauseDate: MOCK_PAUSE_DATE,
  signInUrl: MOCK_SIGN_IN_URL,
};

describe(buildInactivityWarningAlertEmail, () => {
  describe('for a tenant about to be paused', () => {
    let email: ReturnType<typeof buildInactivityWarningAlertEmail>;

    beforeEach(() => {
      email = buildInactivityWarningAlertEmail(MOCK_ALERT);
    });

    it('names the tenant, its id and the pause date in the subject', () => {
      expect(email.subject).toContain(MOCK_TENANT_NAME);
      expect(email.subject).toContain(MOCK_TENANT_ID);
      expect(email.subject).toContain(MOCK_PAUSE_DATE);
    });

    it.each(['html', 'text'] as const)(
      'names the tenant, its owner and the pause date in the %s body',
      (part) => {
        expect(email[part]).toContain(MOCK_TENANT_NAME);
        expect(email[part]).toContain(MOCK_TENANT_ID);
        expect(email[part]).toContain(MOCK_OWNER_EMAIL);
        expect(email[part]).toContain(MOCK_PAUSE_DATE);
      },
    );

    it('links to the platform sign-in', () => {
      expect(email.html).toContain(`href="${MOCK_SIGN_IN_URL}"`);
    });

    it('ends the plain text with the sign-in link', () => {
      expect(email.text.endsWith(`: ${MOCK_SIGN_IN_URL}`)).toBe(true);
    });
  });

  it('escapes every caller-supplied value in the HTML', () => {
    const { html } = buildInactivityWarningAlertEmail({
      ...MOCK_ALERT,
      tenantName: MOCK_UNSAFE_MARKUP,
      tenantId: MOCK_UNSAFE_MARKUP,
      ownerEmail: MOCK_UNSAFE_MARKUP,
      pauseDate: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});

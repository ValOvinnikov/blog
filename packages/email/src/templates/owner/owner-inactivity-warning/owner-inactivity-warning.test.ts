import {
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_SIGN_IN_URL,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerInactivityWarningEmail } from './owner-inactivity-warning';

const SUBJECT = 'Acme Blog will be paused on 28 October 2026';

describe(buildOwnerInactivityWarningEmail, () => {
  it('renders the caller’s subject, copy and sign-in action in the platform shell', () => {
    const email = buildOwnerInactivityWarningEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: SUBJECT,
      paragraphs: [
        'Sign in before 28 October 2026 to keep <Acme Blog> online.',
      ],
      action: { label: 'Sign in to keep your site', url: MOCK_SIGN_IN_URL },
    });

    expect(email.subject).toBe(SUBJECT);
    expect(email.html).toContain(
      'Sign in before 28 October 2026 to keep &lt;Acme Blog&gt; online.',
    );
    expect(email.html).toContain(`href="${MOCK_SIGN_IN_URL}"`);
    expect(email.html).toContain('>Sign in to keep your site</a>');
  });
});

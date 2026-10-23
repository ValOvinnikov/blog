import {
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_SIGN_IN_URL,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerDeletionNoticeEmail } from './owner-deletion-notice';

const SUBJECT = 'Acme Blog will be deleted on 7 November 2026';

describe(buildOwnerDeletionNoticeEmail, () => {
  it('renders the caller’s subject, copy and sign-in action in the platform shell', () => {
    const email = buildOwnerDeletionNoticeEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: SUBJECT,
      paragraphs: ['Sign in before 7 November 2026 to keep <Acme Blog>.'],
      action: { label: 'Keep my site', url: MOCK_SIGN_IN_URL },
    });

    expect(email.subject).toBe(SUBJECT);
    expect(email.html).toContain(
      'Sign in before 7 November 2026 to keep &lt;Acme Blog&gt;.',
    );
    expect(email.html).toContain(`href="${MOCK_SIGN_IN_URL}"`);
    expect(email.html).toContain('>Keep my site</a>');
  });
});

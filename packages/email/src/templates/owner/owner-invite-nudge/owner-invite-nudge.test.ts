import { MOCK_PLATFORM_BRAND_NAME } from '@blog/email/testing/email-fixtures';

import { buildOwnerInviteNudgeEmail } from './owner-invite-nudge';

const SUBJECT = 'Your Sanity invite is still waiting';

describe(buildOwnerInviteNudgeEmail, () => {
  it('renders the caller’s subject, escaped copy and action in the platform shell', () => {
    const email = buildOwnerInviteNudgeEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: SUBJECT,
      paragraphs: ['Accept it to start editing <Acme Blog>.'],
      action: {
        label: 'Check now',
        url: 'https://platform.example.com/dashboard',
      },
    });

    expect(email.subject).toBe(SUBJECT);
    expect(email.html).toContain('editing &lt;Acme Blog&gt;.');
    expect(email.html).toContain(
      'href="https://platform.example.com/dashboard"',
    );
    expect(email.html).toContain('Check now');
  });
});

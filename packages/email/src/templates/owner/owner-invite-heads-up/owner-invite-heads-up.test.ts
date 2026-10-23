import { MOCK_PLATFORM_BRAND_NAME } from '@blog/email/testing/email-fixtures';

import { buildOwnerInviteHeadsUpEmail } from './owner-invite-heads-up';

const SUBJECT = 'Check your inbox for a Sanity invite';

describe(buildOwnerInviteHeadsUpEmail, () => {
  it('renders the caller’s subject and escaped copy in the platform shell without an action', () => {
    const email = buildOwnerInviteHeadsUpEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: SUBJECT,
      paragraphs: ['Accept it with the account you’ll use <every day>.'],
    });

    expect(email.subject).toBe(SUBJECT);
    expect(email.html).toContain('<!doctype html>');
    expect(email.html).toContain('the account you’ll use &lt;every day&gt;.');
    expect(email.html).not.toContain('<a ');
  });
});

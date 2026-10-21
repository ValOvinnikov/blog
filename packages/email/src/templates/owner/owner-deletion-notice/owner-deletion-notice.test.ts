import {
  ESCAPED_UNSAFE_MARKUP,
  TEST_PLATFORM_BRAND_NAME,
  TEST_SIGN_IN_URL,
  UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerDeletionNoticeEmail } from './owner-deletion-notice';

const NOTICE = {
  brandName: TEST_PLATFORM_BRAND_NAME,
  siteName: 'Acme Blog',
  deletionDate: '7 November 2026',
  signInUrl: TEST_SIGN_IN_URL,
};

describe(buildOwnerDeletionNoticeEmail, () => {
  let email: ReturnType<typeof buildOwnerDeletionNoticeEmail>;

  beforeEach(() => {
    email = buildOwnerDeletionNoticeEmail(NOTICE);
  });

  it('names the site and the deletion date in the subject', () => {
    expect(email.subject).toBe('Acme Blog will be deleted on 7 November 2026');
  });

  it('names the site and the deletion date in the body', () => {
    expect(email.html).toContain(
      '<p>Acme Blog is paused because nobody has signed in to it. On 7 November 2026 we will delete it with all of its content, and it cannot be restored.</p>',
    );
  });

  it('links to sign-in', () => {
    expect(email.html).toContain(`href="${TEST_SIGN_IN_URL}"`);
    expect(email.html).toContain('>Sign in to keep your site</a>');
  });

  it('carries the same copy and link as plain text', () => {
    expect(email.text).toBe(
      `Acme Blog is paused because nobody has signed in to it. On 7 November 2026 we will delete it with all of its content, and it cannot be restored.\n\nSign in before then to keep it.\n\nSign in to keep your site: ${TEST_SIGN_IN_URL}`,
    );
  });

  it('escapes the site name in the HTML', () => {
    const { html } = buildOwnerDeletionNoticeEmail({
      ...NOTICE,
      siteName: UNSAFE_MARKUP,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(ESCAPED_UNSAFE_MARKUP);
  });
});

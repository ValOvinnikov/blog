import {
  ESCAPED_UNSAFE_MARKUP,
  TEST_PLATFORM_BRAND_NAME,
  TEST_SIGN_IN_URL,
  UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerInactivityWarningEmail } from './owner-inactivity-warning';

const WARNING = {
  brandName: TEST_PLATFORM_BRAND_NAME,
  siteName: 'Acme Blog',
  pauseDate: '28 October 2026',
  signInUrl: TEST_SIGN_IN_URL,
};

describe(buildOwnerInactivityWarningEmail, () => {
  let email: ReturnType<typeof buildOwnerInactivityWarningEmail>;

  beforeEach(() => {
    email = buildOwnerInactivityWarningEmail(WARNING);
  });

  it('names the site and the pause date in the subject', () => {
    expect(email.subject).toBe('Acme Blog will be paused on 28 October 2026');
  });

  it('names the site and the pause date in the body', () => {
    expect(email.html).toContain(
      '<p>Nobody has signed in to Acme Blog for a while, so we will pause it on 28 October 2026. A paused site is no longer shown to readers.</p>',
    );
  });

  it('links to sign-in', () => {
    expect(email.html).toContain(`href="${TEST_SIGN_IN_URL}"`);
    expect(email.html).toContain('>Sign in to keep your site</a>');
  });

  it('carries the same copy and link as plain text', () => {
    expect(email.text).toBe(
      `Nobody has signed in to Acme Blog for a while, so we will pause it on 28 October 2026. A paused site is no longer shown to readers.\n\nSign in before then to keep it online.\n\nSign in to keep your site: ${TEST_SIGN_IN_URL}`,
    );
  });

  it('escapes the site name in the HTML', () => {
    const { html } = buildOwnerInactivityWarningEmail({
      ...WARNING,
      siteName: UNSAFE_MARKUP,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(ESCAPED_UNSAFE_MARKUP);
  });
});

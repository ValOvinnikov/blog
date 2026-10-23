import {
  MOCK_EMAIL_ACTION,
  MOCK_EMAIL_SUBJECT,
  MOCK_PLATFORM_BRAND_NAME,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerSiteReadyEmail } from './owner-site-ready';

describe(buildOwnerSiteReadyEmail, () => {
  it('renders the caller’s subject, escaped copy and action in the platform shell', () => {
    const email = buildOwnerSiteReadyEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: MOCK_EMAIL_SUBJECT,
      paragraphs: ['<Acme Blog> is live.'],
      action: MOCK_EMAIL_ACTION,
    });

    expect(email.subject).toBe(MOCK_EMAIL_SUBJECT);
    expect(email.html).toContain('&lt;Acme Blog&gt; is live.');
    expect(email.html).toContain(`href="${MOCK_EMAIL_ACTION.url}"`);
    expect(email.html).toContain(MOCK_EMAIL_ACTION.label);
  });
});

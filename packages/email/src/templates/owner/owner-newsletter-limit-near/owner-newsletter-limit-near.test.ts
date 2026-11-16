import { buildOwnerEmail } from '@shinefold/email/templates/owner/owner-email/owner-email';
import { MOCK_OWNER_EMAIL_INPUT } from '@shinefold/email/testing/owner-email';

import { buildOwnerNewsletterLimitNearEmail } from './owner-newsletter-limit-near';

describe(buildOwnerNewsletterLimitNearEmail, () => {
  it('renders the owner email for the given copy and action', () => {
    expect(buildOwnerNewsletterLimitNearEmail(MOCK_OWNER_EMAIL_INPUT)).toEqual(
      buildOwnerEmail(MOCK_OWNER_EMAIL_INPUT),
    );
  });
});

import { buildOwnerLimitEmail } from '@shinefold/email/templates/owner/owner-limit-email/owner-limit-email';
import { MOCK_OWNER_LIMIT_EMAIL_INPUT } from '@shinefold/email/testing/owner-email';

import { buildOwnerNewsletterPausedEmail } from './owner-newsletter-paused';

describe(buildOwnerNewsletterPausedEmail, () => {
  it('renders the owner limit email for the given copy, usage and action', () => {
    expect(
      buildOwnerNewsletterPausedEmail(MOCK_OWNER_LIMIT_EMAIL_INPUT),
    ).toEqual(buildOwnerLimitEmail(MOCK_OWNER_LIMIT_EMAIL_INPUT));
  });
});

import { buildOwnerEmail } from '@shinefold/email/templates/owner/owner-email/owner-email';
import { MOCK_OWNER_EMAIL_INPUT } from '@shinefold/email/testing/owner-email';

import { buildOwnerEntitlementEmail } from './owner-entitlement';

describe(buildOwnerEntitlementEmail, () => {
  it('renders the owner email for the given copy and action', () => {
    expect(buildOwnerEntitlementEmail(MOCK_OWNER_EMAIL_INPUT)).toEqual(
      buildOwnerEmail(MOCK_OWNER_EMAIL_INPUT),
    );
  });
});

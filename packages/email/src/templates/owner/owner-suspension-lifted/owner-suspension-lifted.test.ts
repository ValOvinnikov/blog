import { buildOwnerEmail } from '@blog/email/templates/owner/owner-email/owner-email';
import { MOCK_OWNER_EMAIL_INPUT } from '@blog/email/testing/owner-email';

import { buildOwnerSuspensionLiftedEmail } from './owner-suspension-lifted';

describe(buildOwnerSuspensionLiftedEmail, () => {
  it('renders the owner email for the given copy and action', () => {
    expect(buildOwnerSuspensionLiftedEmail(MOCK_OWNER_EMAIL_INPUT)).toEqual(
      buildOwnerEmail(MOCK_OWNER_EMAIL_INPUT),
    );
  });
});

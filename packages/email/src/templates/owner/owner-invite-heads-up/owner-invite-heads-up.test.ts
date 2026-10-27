import { buildOwnerEmail } from '@blog/email/templates/owner/owner-email/owner-email';
import { MOCK_OWNER_EMAIL_INPUT } from '@blog/email/testing/owner-email';

import { buildOwnerInviteHeadsUpEmail } from './owner-invite-heads-up';

describe(buildOwnerInviteHeadsUpEmail, () => {
  it('renders the owner email for the given copy and action', () => {
    expect(buildOwnerInviteHeadsUpEmail(MOCK_OWNER_EMAIL_INPUT)).toEqual(
      buildOwnerEmail(MOCK_OWNER_EMAIL_INPUT),
    );
  });
});

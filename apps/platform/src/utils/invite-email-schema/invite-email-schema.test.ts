import { MOCK_NOT_AN_EMAIL } from '@platform/testing/data-requests/fixtures';
import { MOCK_INVITED_ADMIN_EMAIL } from '@platform/testing/platform-admins/fixtures';

import { inviteEmailSchema } from './invite-email-schema';

describe('inviteEmailSchema', () => {
  it('trims and lower-cases an address', () => {
    const parsed = inviteEmailSchema.parse(
      ` ${MOCK_INVITED_ADMIN_EMAIL.toUpperCase()} `,
    );

    expect(parsed).toBe(MOCK_INVITED_ADMIN_EMAIL);
  });

  it('rejects something that is not an address', () => {
    const result = inviteEmailSchema.safeParse(MOCK_NOT_AN_EMAIL);

    expect(result.success).toBe(false);
  });
});

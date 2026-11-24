import {
  MOCK_ADMIN_INVITE_EXPIRES_AT,
  MOCK_ADMIN_INVITE_ID,
  MOCK_ADMIN_INVITED_AT,
  MOCK_ADMIN_GRANTED_AT,
  MOCK_INVITED_ADMIN_EMAIL,
  MOCK_LISTED_ADMIN_EMAIL,
  MOCK_LISTED_ADMIN_ID,
  MOCK_LISTED_ADMIN_NAME,
} from '@platform/testing/platform-admins/fixtures';
import { ADMIN_ROLE } from '@shinefold/db/constants';

import { loadPlatformAdmins } from './load-platform-admins';

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/platform-admins/fixtures')
  ).mockPlatformAdminsDb(),
);

describe(loadPlatformAdmins, () => {
  it('lists each admin, marking the viewer, and each invite still in date', async () => {
    vi.setSystemTime(MOCK_ADMIN_INVITED_AT);

    const { admins, invites } = await loadPlatformAdmins(MOCK_LISTED_ADMIN_ID);

    expect(admins).toEqual([
      {
        adminId: MOCK_LISTED_ADMIN_ID,
        name: MOCK_LISTED_ADMIN_NAME,
        email: MOCK_LISTED_ADMIN_EMAIL,
        role: ADMIN_ROLE.ADMIN,
        grantedAt: MOCK_ADMIN_GRANTED_AT,
        isYou: true,
      },
    ]);
    expect(invites).toEqual([
      {
        inviteId: MOCK_ADMIN_INVITE_ID,
        email: MOCK_INVITED_ADMIN_EMAIL,
        role: ADMIN_ROLE.ADMIN,
        invitedAt: MOCK_ADMIN_INVITED_AT,
        isExpired: false,
      },
    ]);
  });

  it('marks an invite expired from its expiry onwards', async () => {
    vi.setSystemTime(MOCK_ADMIN_INVITE_EXPIRES_AT);

    const { admins, invites } = await loadPlatformAdmins(MOCK_ADMIN_INVITE_ID);

    expect(admins[0]?.isYou).toBe(false);
    expect(invites[0]?.isExpired).toBe(true);
  });
});

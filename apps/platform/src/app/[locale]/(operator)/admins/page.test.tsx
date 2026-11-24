import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  MOCK_INVITED_ADMIN_EMAIL,
  MOCK_LISTED_ADMIN_NAME,
} from '@platform/testing/platform-admins/fixtures';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';

import AdminsPage from './page';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/platform-admins/invite-admin-action');

vi.mock('@platform/server/platform-admins/resend-admin-invite-action');

vi.mock('@platform/server/platform-admins/cancel-admin-invite-action');

vi.mock('@platform/server/platform-admins/remove-admin-action');

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/platform-admins/fixtures')
  ).mockPlatformAdminsDb(),
);

const setup = customRenderAsync(AdminsPage, {});

describe(`<${AdminsPage.name}/>`, () => {
  it('404s for anyone who is not a super admin without reading the lists', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(queries.admins.listAdmins).not.toHaveBeenCalled();
  });

  it('lists the admins and their pending invites', async () => {
    await setup();

    const admin = screen.getByText(MOCK_LISTED_ADMIN_NAME);
    const invite = screen.getByText(MOCK_INVITED_ADMIN_EMAIL);

    expect(admin).toBeVisible();
    expect(invite).toBeVisible();
  });
});

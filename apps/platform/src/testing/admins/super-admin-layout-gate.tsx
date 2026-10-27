import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import type { ReactNode } from 'react';
import type { Mock } from 'vitest';

const GATED_CONTENT = 'gated content';

type TGatedLayout = (props: { children: ReactNode }) => Promise<ReactNode>;

// The calling file mocks `@platform/server/auth/auth` and `@blog/db`'s `getAdminByUserId`.
export const itGatesToSuperAdmins = (
  Layout: TGatedLayout,
  getAdminByUserIdMock: Mock,
): void => {
  const setup = customRenderAsync(Layout, {
    children: <div>{GATED_CONTENT}</div>,
  });

  it('404s for an admin below SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(mockAdmin());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('renders its children for a SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );

    await setup();

    const content = screen.getByText(GATED_CONTENT);

    expect(content).toBeVisible();
  });
};

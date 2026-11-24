import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import type { ReactNode } from 'react';

const GATED_CONTENT = 'gated content';

type TGatedLayout = (props: { children: ReactNode }) => Promise<ReactNode>;

// The calling file mocks `@platform/server/auth/auth`, and `@shinefold/db` with `mockSuperAdminGateDb`.
export const itGatesToSuperAdmins = (Layout: TGatedLayout): void => {
  const getAdminByUserIdMock = vi.mocked(queries.admins.getAdminByUserId);
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

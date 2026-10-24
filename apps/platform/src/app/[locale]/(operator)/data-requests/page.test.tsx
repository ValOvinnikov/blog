import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { notFound } from 'next/navigation';

import DataRequestsPage from './page';

const { requireSuperAdminMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/data-requests/look-up-personal-data-action', () => ({
  lookUpPersonalDataAction: vi.fn(),
}));

vi.mock('@platform/server/data-requests/export-personal-data-action', () => ({
  exportPersonalDataAction: vi.fn(),
}));

vi.mock('@platform/server/data-requests/erase-personal-data-action', () => ({
  erasePersonalDataAction: vi.fn(),
}));

const setup = customRenderAsync(DataRequestsPage, {});

describe(DataRequestsPage, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(mockAdmin());
  });

  it('404s for anyone who is not a super admin', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('offers a search by email address', async () => {
    await setup();

    const heading = screen.getByRole('heading', { level: 1 });
    const emailField = screen.getByRole('textbox', { name: 'Email address' });

    expect(heading).toHaveTextContent('Data requests');
    expect(emailField).toBeVisible();
  });
});

import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { customRenderAsync, screen } from '@platform/testing/custom-render';

import DataRequestsPage from './page';

vi.mock('@platform/server/auth/require-super-admin');

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

describe(`<${DataRequestsPage.name}/>`, () => {
  it('404s for anyone who is not a super admin', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('offers a search by email address', async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: messages.dataRequestView.title,
    });
    const emailField = screen.getByRole('textbox', {
      name: messages.dataRequestSearchCard.emailLabel,
    });

    expect(heading).toBeVisible();
    expect(emailField).toBeVisible();
  });
});

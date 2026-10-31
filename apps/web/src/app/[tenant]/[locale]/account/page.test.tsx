import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { auth } from '@web/server/auth/auth';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSession } from '@web/testing/shared/session/fixtures';
import { notFound } from 'next/navigation';

import AccountRoute from './page';

const ACCOUNT_PAGE_TEST_ID = 'account-page';

vi.mock('@web/metadata/account-metadata', () => ({
  buildAccountMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/account-page', () => ({
  AccountPage: () => <div data-testid={ACCOUNT_PAGE_TEST_ID} />,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/auth/auth');

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
  () => ({
    isReaderAccountEnabled: vi.fn(),
  }),
);

const authMock = vi.mocked(auth as () => Promise<unknown>);

const setup = customRenderAsync(AccountRoute, { params: mockRouteParams() });

describe(`<${AccountRoute.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(isReaderAccountEnabled).mockReset();
    authMock.mockResolvedValue(mockSession());
  });

  it('renders AccountPage when the tenant has reader accounts enabled', async () => {
    vi.mocked(isReaderAccountEnabled).mockResolvedValue(true);
    authMock.mockResolvedValue(null);

    await setup();

    const accountPage = screen.getByTestId(ACCOUNT_PAGE_TEST_ID);
    expect(accountPage).toBeVisible();
    expect(notFound).not.toHaveBeenCalled();
  });

  describe('when the tenant has reader accounts disabled', () => {
    beforeEach(() => {
      vi.mocked(isReaderAccountEnabled).mockResolvedValue(false);
    });

    it('renders AccountPage for a reader who is already signed in', async () => {
      await setup();

      const accountPage = screen.getByTestId(ACCOUNT_PAGE_TEST_ID);
      expect(accountPage).toBeVisible();
      expect(notFound).not.toHaveBeenCalled();
    });

    it('responds not-found to a signed-out visitor', async () => {
      authMock.mockResolvedValue(null);

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(notFound).toHaveBeenCalledTimes(1);
    });
  });
});

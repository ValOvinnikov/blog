import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import AccountRoute from './page';

vi.mock('@web/metadata/account-metadata', () => ({
  buildAccountMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/account-page', () => ({
  AccountPage: () => <div data-testid="account-page" />,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
  () => ({
    isReaderAccountEnabled: vi.fn(),
  }),
);

const setup = customRenderAsync(AccountRoute, { params: mockRouteParams() });

describe(`<${AccountRoute.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(isReaderAccountEnabled).mockReset();
  });

  it('renders AccountPage when the tenant has reader accounts enabled', async () => {
    vi.mocked(isReaderAccountEnabled).mockResolvedValue(true);

    await setup();

    const accountPage = screen.getByTestId('account-page');
    expect(accountPage).toBeVisible();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('responds not-found when the tenant has reader accounts disabled', async () => {
    vi.mocked(isReaderAccountEnabled).mockResolvedValue(false);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { mockRouteParams } from '@web/testing/app/route-params';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import BookmarksRoute from './page';

vi.mock('@web/metadata/bookmarks-metadata', () => ({
  buildBookmarksMetadata: vi.fn(),
}));

vi.mock('@web/components/pages/bookmarks-page', () => ({
  BookmarksPage: () => <div data-testid="bookmarks-page" />,
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
  () => ({
    isReaderAccountEnabled: vi.fn(),
  }),
);

const setup = customRenderAsync(BookmarksRoute, { params: mockRouteParams() });

describe(`<${BookmarksRoute.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(isReaderAccountEnabled).mockReset();
  });

  it('renders BookmarksPage when the tenant has reader accounts enabled', async () => {
    vi.mocked(isReaderAccountEnabled).mockResolvedValue(true);

    await setup();

    const bookmarksPage = screen.getByTestId('bookmarks-page');
    expect(bookmarksPage).toBeVisible();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('responds not-found when the tenant has reader accounts disabled', async () => {
    vi.mocked(isReaderAccountEnabled).mockResolvedValue(false);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

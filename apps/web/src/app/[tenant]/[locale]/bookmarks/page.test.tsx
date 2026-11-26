import { CAPABILITY, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { isReaderAccountFeatureEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
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
);

const setup = customRenderAsync(BookmarksRoute, { params: mockRouteParams() });

describe(`<${BookmarksRoute.name}/>`, () => {
  describe('when bookmarks are enabled', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders BookmarksPage', () => {
      const bookmarksPage = screen.getByTestId('bookmarks-page');

      expect(bookmarksPage).toBeVisible();
      expect(notFound).not.toHaveBeenCalled();
    });

    it('checks bookmarks as a reader-account feature', () => {
      expect(isReaderAccountFeatureEnabled).toHaveBeenCalledWith(
        CAPABILITY.BOOKMARKS,
      );
    });
  });

  it('responds not-found when bookmarks are disabled', async () => {
    vi.mocked(isReaderAccountFeatureEnabled).mockResolvedValueOnce(false);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

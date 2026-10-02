import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
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

vi.mock('@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled', () => ({
  isReaderAccountEnabled: vi.fn(),
}));

const isReaderAccountEnabledMock = vi.mocked(isReaderAccountEnabled);

const setup = customRenderAsync(BookmarksRoute, {
  params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' as const }),
});

describe('BookmarksRoute', () => {
  beforeEach(() => {
    isReaderAccountEnabledMock.mockReset();
  });

  it('renders BookmarksPage when the tenant has a reader-account capability enabled', async () => {
    isReaderAccountEnabledMock.mockResolvedValue(true);

    await setup();

    expect(screen.getByTestId('bookmarks-page')).toBeInTheDocument();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(isReaderAccountEnabledMock).toHaveBeenCalledWith();
  });

  it('answers 404 when the tenant has no reader-account capability enabled', async () => {
    isReaderAccountEnabledMock.mockResolvedValue(false);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });
});

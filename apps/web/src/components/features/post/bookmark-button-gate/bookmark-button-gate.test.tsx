import { ToastProvider } from '@web/context/toast-provider';
import { getBookmarkStatus } from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import {
  customRenderServerAsync,
  screen,
  waitFor,
} from '@web/testing/custom-render';
import { useSession } from 'next-auth/react';

import { BookmarkButtonGate } from './bookmark-button-gate';

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
  () => ({
    isCapabilityEnabled: vi.fn(),
  }),
);

vi.mock('@web/server/bookmarks/bookmark-actions/bookmark-actions', () => ({
  getBookmarkStatus: vi.fn(),
  setBookmarkStatus: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

const setup = customRenderServerAsync(
  BookmarkButtonGate,
  { postId: 'post-1' },
  { wrapper: ToastProvider },
);

describe(`<${BookmarkButtonGate.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user-1' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });
    vi.mocked(getBookmarkStatus).mockResolvedValue(false);
  });

  it('renders the bookmark toggle when bookmarks are enabled', async () => {
    vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(true);

    await setup();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled(),
    );
    expect(getBookmarkStatus).toHaveBeenCalledWith('post-1');
  });

  describe('when bookmarks are not enabled', () => {
    beforeEach(async () => {
      vi.mocked(isCapabilityEnabled).mockResolvedValueOnce(false);
      await setup();
    });

    it('renders no toggle when bookmarks are not enabled', async () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('checks the bookmarks capability ', async () => {
      expect(isCapabilityEnabled).toHaveBeenCalledWith('BOOKMARKS');
    });
  });
});

import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { BookmarkButton } from './bookmark-button';

const { useSessionMock, getBookmarkStatusMock, setBookmarkStatusMock } =
  vi.hoisted(() => ({
    useSessionMock: vi.fn(),
    getBookmarkStatusMock: vi.fn(),
    setBookmarkStatusMock: vi.fn(),
  }));

vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));

vi.mock('@web/server/bookmarks/bookmark-actions', () => ({
  getBookmarkStatus: getBookmarkStatusMock,
  setBookmarkStatus: setBookmarkStatusMock,
}));

const setup = customRender(BookmarkButton, { postId: 'post-1' });

describe(`<${BookmarkButton.name}/>`, () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    getBookmarkStatusMock.mockReset();
    setBookmarkStatusMock.mockReset();
  });

  it('renders nothing when the session is unauthenticated', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });

    setup();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a disabled, not-pressed toggle while the session is resolving', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'loading' });

    setup();

    const button = screen.getByRole('button', { name: 'Save post' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('stays disabled once authenticated until the initial bookmark status resolves', () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockReturnValue(new Promise(() => {}));

    setup();

    expect(screen.getByRole('button', { name: 'Save post' })).toBeDisabled();
  });

  it('reflects the resolved bookmark status once it loads, then becomes interactive', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(true);

    setup();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toBeEnabled();
    });
    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('recovers to an enabled, not-bookmarked toggle (instead of staying stuck disabled) when the initial status fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockRejectedValue(new Error('db unavailable'));

    setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled();
    });
    expect(screen.getByRole('button', { name: 'Save post' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to load bookmark status:',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it('optimistically toggles on click and calls setBookmarkStatus with the new value', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(false);
    setBookmarkStatusMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save post' }));

    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', true);
  });

  it('rolls back the optimistic toggle and shows a transient error when the write fails', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(false);
    setBookmarkStatusMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();

    setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save post' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't save that. Try again.",
    );
  });
});

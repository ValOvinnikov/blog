import userEvent from '@testing-library/user-event';
import { act, customRender, screen, waitFor } from '@web/testing/custom-render';

import { BookmarkButton } from './bookmark-button';

const {
  useSessionMock,
  getBookmarkStatusMock,
  setBookmarkStatusMock,
  toastSuccessMock,
  toastInfoMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  getBookmarkStatusMock: vi.fn(),
  setBookmarkStatusMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastInfoMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));

vi.mock('@web/server/bookmarks/bookmark-actions', () => ({
  getBookmarkStatus: getBookmarkStatusMock,
  setBookmarkStatus: setBookmarkStatusMock,
}));

vi.mock('@web/components/shared/toast-provider', () => ({
  useToast: () => ({
    success: toastSuccessMock,
    info: toastInfoMock,
    warning: vi.fn(),
    error: toastErrorMock,
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const setup = customRender(BookmarkButton, { postId: 'post-1' });

describe(`<${BookmarkButton.name}/>`, () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    getBookmarkStatusMock.mockReset();
    setBookmarkStatusMock.mockReset();
    toastSuccessMock.mockReset();
    toastInfoMock.mockReset();
    toastErrorMock.mockReset();
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
    expect(button).toHaveTextContent('save');
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
    expect(
      screen.getByRole('button', { name: 'Remove bookmark' }),
    ).toHaveTextContent('saved');
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

  it('optimistically toggles on click, calls setBookmarkStatus with the new value, and shows a success toast', async () => {
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

    const toggledButton = screen.getByRole('button', {
      name: 'Remove bookmark',
    });
    expect(toggledButton).toHaveAttribute('aria-pressed', 'true');
    expect(toggledButton).toHaveTextContent('saved');
    expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', true);
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith({
        command: 'bookmark',
        state: 'saved',
        message: 'stashed to ~/bookmarks',
        action: expect.objectContaining({ label: 'undo', keyHint: '⌘Z' }),
      });
    });
    expect(toastInfoMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('shows an info toast when unsaving an already-bookmarked post', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(true);
    setBookmarkStatusMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    setup();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Remove bookmark' }));

    expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', false);
    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledWith({
        command: 'bookmark',
        state: 'removed',
        message: 'removed from ~/bookmarks',
        action: expect.objectContaining({ label: 'undo', keyHint: '⌘Z' }),
      });
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('rolls back the optimistic toggle and shows an error toast when the write fails', async () => {
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
    expect(toastErrorMock).toHaveBeenCalledWith({
      command: 'bookmark',
      state: 'failed',
      message: "Couldn't save that. Try again.",
      action: expect.objectContaining({ label: 'retry', keyHint: 'R' }),
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(toastInfoMock).not.toHaveBeenCalled();
  });

  it('undoes a successful save: reverts state, re-invokes setBookmarkStatus, and shows a reverted-state info toast', async () => {
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
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalled();
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', true);

    const { action } = toastSuccessMock.mock.calls[0]![0];
    await act(async () => action.onAct());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
    expect(setBookmarkStatusMock).toHaveBeenNthCalledWith(2, 'post-1', false);
    expect(toastInfoMock).toHaveBeenCalledWith({
      command: 'bookmark',
      state: 'reverted',
      message: 'reverted',
    });
  });

  it('undoes a successful remove: re-bookmarks, re-invokes setBookmarkStatus, and shows a reverted-state info toast', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(true);
    setBookmarkStatusMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    setup();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Remove bookmark' }));
    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledTimes(1);
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', false);

    const { action } = toastInfoMock.mock.calls[0]![0];
    await act(async () => action.onAct());

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
    expect(setBookmarkStatusMock).toHaveBeenNthCalledWith(2, 'post-1', true);
    // The undo's own success path is always `toast.info`, regardless of
    // which direction it reverted — this is the second `info` call.
    expect(toastInfoMock).toHaveBeenNthCalledWith(2, {
      command: 'bookmark',
      state: 'reverted',
      message: 'reverted',
    });
  });

  it('rolls back to the pre-undo committed state and shows an action-less error toast when the undo write fails', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(false);
    setBookmarkStatusMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();

    setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save post' }));
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalled();
    });

    const { action } = toastSuccessMock.mock.calls[0]![0];
    await act(async () => action.onAct());

    // Rolls back to the committed (saved) state the undo started from.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
    // Deliberate: no `action` on the undo-failure toast, to avoid an
    // unbounded retry/undo chain.
    expect(toastErrorMock).toHaveBeenCalledWith({
      command: 'bookmark',
      state: 'failed',
      message: "Couldn't save that. Try again.",
    });
    expect(toastInfoMock).not.toHaveBeenCalled();
  });

  it('retries a failed save: re-invokes setBookmarkStatus with the same value and shows a success toast once it succeeds', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(false);
    setBookmarkStatusMock
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();

    setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save post' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save post' }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });

    const { action } = toastErrorMock.mock.calls[0]![0];
    await act(async () => action.onAct());

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Remove bookmark' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
    expect(setBookmarkStatusMock).toHaveBeenNthCalledWith(2, 'post-1', true);
    expect(toastSuccessMock).toHaveBeenCalledWith({
      command: 'bookmark',
      state: 'saved',
      message: 'stashed to ~/bookmarks',
      action: expect.objectContaining({ label: 'undo', keyHint: '⌘Z' }),
    });
  });

  it('shows a fresh retry action when the retried save fails again', async () => {
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
      expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });

    const { action } = toastErrorMock.mock.calls[0]![0];
    await act(async () => action.onAct());

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledTimes(2);
    });
    expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Save post' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    const { action: secondAction } = toastErrorMock.mock.calls[1]![0];
    expect(secondAction).toEqual(
      expect.objectContaining({ label: 'retry', keyHint: 'R' }),
    );
  });
});

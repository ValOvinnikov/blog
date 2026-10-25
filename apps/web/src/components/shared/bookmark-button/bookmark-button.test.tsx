import { ACTION_OUTCOME } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { BOOKMARK_LOG } from '@web/constants/bookmark';
import { ACCOUNT_OVERLAY_ID } from '@web/context/header-overlay-provider';
import { act, customRender, screen, waitFor } from '@web/testing/custom-render';
import { logger } from '@web/utils/logger/logger';

import { BookmarkButton } from './bookmark-button';

const {
  useSessionMock,
  getBookmarkStatusMock,
  setBookmarkStatusMock,
  toastSuccessMock,
  toastInfoMock,
  toastErrorMock,
  reportClientErrorMock,
  setActiveOverlayMock,
} = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  getBookmarkStatusMock: vi.fn(),
  setBookmarkStatusMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastInfoMock: vi.fn(),
  toastErrorMock: vi.fn(),
  reportClientErrorMock: vi.fn(),
  setActiveOverlayMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));

vi.mock('@web/context/header-overlay-provider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useHeaderOverlay: () => ({
    activeId: null,
    setActiveId: setActiveOverlayMock,
  }),
}));

vi.mock('@web/utils/report-client-error', () => ({
  reportClientError: reportClientErrorMock,
}));

vi.mock('@web/server/bookmarks/bookmark-actions/bookmark-actions', () => ({
  getBookmarkStatus: getBookmarkStatusMock,
  setBookmarkStatus: setBookmarkStatusMock,
}));

vi.mock('@web/context/toast-provider', () => ({
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

const REMOVE_BOOKMARK = 'Remove bookmark';
const SAVE_POST = 'Save post';
const ARIA_PRESSED = 'aria-pressed';
const SAVED_MESSAGE = 'Saved to bookmarks';
const SAVE_FAILED_MESSAGE = "Couldn't save that. Try again.";
const UNAVAILABLE_MESSAGE =
  "Bookmarking isn't available on this site right now.";

describe(`<${BookmarkButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    useSessionMock.mockReset();
    getBookmarkStatusMock.mockReset();
    setBookmarkStatusMock.mockReset();
    toastSuccessMock.mockReset();
    toastInfoMock.mockReset();
    toastErrorMock.mockReset();
    reportClientErrorMock.mockReset();
    setActiveOverlayMock.mockReset();
  });

  describe('when signed out', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      setup();
    });

    it('renders an enabled, not-bookmarked toggle', () => {
      expect(screen.getByRole('button', { name: SAVE_POST })).toBeEnabled();
      expect(screen.getByRole('button', { name: SAVE_POST })).toHaveAttribute(
        ARIA_PRESSED,
        'false',
      );
    });

    it('opens the sign-in panel instead of saving when pressed', async () => {
      await user.click(screen.getByRole('button', { name: SAVE_POST }));

      expect(setActiveOverlayMock).toHaveBeenCalledWith(ACCOUNT_OVERLAY_ID);
      expect(setBookmarkStatusMock).not.toHaveBeenCalled();
      expect(getBookmarkStatusMock).not.toHaveBeenCalled();
    });
  });

  describe('while the session is resolving', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({ data: null, status: 'loading' });
      setup();
    });

    it('renders a not-bookmarked toggle', () => {
      expect(screen.getByRole('button', { name: SAVE_POST })).toHaveAttribute(
        ARIA_PRESSED,
        'false',
      );
    });

    it('neither saves nor opens the sign-in panel when pressed', async () => {
      await user.click(screen.getByRole('button', { name: SAVE_POST }));

      expect(setBookmarkStatusMock).not.toHaveBeenCalled();
      expect(setActiveOverlayMock).not.toHaveBeenCalled();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({
        data: { user: { id: 'user-1' } },
        status: 'authenticated',
      });
    });

    it('renders a not-bookmarked toggle that does not save until the initial bookmark status resolves', async () => {
      getBookmarkStatusMock.mockReturnValue(new Promise(() => {}));

      setup();
      await user.click(screen.getByRole('button', { name: SAVE_POST }));

      expect(screen.getByRole('button', { name: SAVE_POST })).toHaveAttribute(
        ARIA_PRESSED,
        'false',
      );
      expect(setBookmarkStatusMock).not.toHaveBeenCalled();
    });

    it('reflects the resolved bookmark status once it loads, then becomes interactive', async () => {
      getBookmarkStatusMock.mockResolvedValue(true);

      setup();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: REMOVE_BOOKMARK }),
        ).toBeEnabled();
      });
      expect(
        screen.getByRole('button', { name: REMOVE_BOOKMARK }),
      ).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(
        screen.getByRole('button', { name: REMOVE_BOOKMARK }),
      ).toHaveTextContent('Saved');
    });

    it('recovers to an enabled, not-bookmarked toggle (instead of staying stuck disabled) when the initial status fetch rejects', async () => {
      const fetchError = new Error('db unavailable');
      getBookmarkStatusMock.mockRejectedValue(fetchError);

      setup();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: SAVE_POST })).toBeEnabled();
      });
      expect(screen.getByRole('button', { name: SAVE_POST })).toHaveAttribute(
        ARIA_PRESSED,
        'false',
      );
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        BOOKMARK_LOG.BUTTON_STATUS_FETCH_FAILED,
        expect.anything(),
      );
      expect(reportClientErrorMock).toHaveBeenCalledWith(
        BOOKMARK_LOG.BUTTON_STATUS_FETCH_FAILED,
        fetchError,
      );
    });

    describe('with a not-bookmarked post', () => {
      beforeEach(async () => {
        getBookmarkStatusMock.mockResolvedValue(false);
        setup();
        await waitFor(() => {
          expect(screen.getByRole('button', { name: SAVE_POST })).toBeEnabled();
        });
      });

      describe('when the write succeeds', () => {
        beforeEach(() => {
          setBookmarkStatusMock.mockResolvedValue({
            outcome: ACTION_OUTCOME.SUCCESS,
          });
        });

        it('optimistically toggles on click, calls setBookmarkStatus with the new value, and shows a success toast', async () => {
          await user.click(screen.getByRole('button', { name: SAVE_POST }));

          const toggledButton = screen.getByRole('button', {
            name: REMOVE_BOOKMARK,
          });
          expect(toggledButton).toHaveAttribute(ARIA_PRESSED, 'true');
          expect(toggledButton).toHaveTextContent('Saved');
          expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', true);
          await waitFor(() => {
            expect(toastSuccessMock).toHaveBeenCalledWith({
              message: SAVED_MESSAGE,
              action: expect.objectContaining({ label: 'Undo' }),
            });
          });
          expect(toastInfoMock).not.toHaveBeenCalled();
          expect(toastErrorMock).not.toHaveBeenCalled();
        });

        it('undoes a successful save: reverts state, re-invokes setBookmarkStatus, and shows a reverted-state info toast', async () => {
          await user.click(screen.getByRole('button', { name: SAVE_POST }));
          await waitFor(() => {
            expect(toastSuccessMock).toHaveBeenCalled();
          });
          expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', true);

          const { action } = toastSuccessMock.mock.calls[0]![0];
          await act(async () => action.onAct());

          await waitFor(() => {
            expect(
              screen.getByRole('button', { name: SAVE_POST }),
            ).toHaveAttribute(ARIA_PRESSED, 'false');
          });
          expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
          expect(setBookmarkStatusMock).toHaveBeenNthCalledWith(
            2,
            'post-1',
            false,
          );
          expect(toastInfoMock).toHaveBeenCalledWith({
            message: 'Reverted',
          });
        });
      });

      describe('when the write fails', () => {
        beforeEach(() => {
          setBookmarkStatusMock.mockResolvedValue({
            outcome: ACTION_OUTCOME.SERVER_ERROR,
          });
        });

        it('rolls back the optimistic toggle and shows an error toast when the write fails', async () => {
          await user.click(screen.getByRole('button', { name: SAVE_POST }));

          await waitFor(() => {
            expect(
              screen.getByRole('button', { name: SAVE_POST }),
            ).toHaveAttribute(ARIA_PRESSED, 'false');
          });
          expect(toastErrorMock).toHaveBeenCalledWith({
            message: SAVE_FAILED_MESSAGE,
            action: expect.objectContaining({ label: 'Retry', keyHint: 'R' }),
          });
          expect(toastSuccessMock).not.toHaveBeenCalled();
          expect(toastInfoMock).not.toHaveBeenCalled();
        });

        it('shows a fresh retry action when the retried save fails again', async () => {
          await user.click(screen.getByRole('button', { name: SAVE_POST }));
          await waitFor(() => {
            expect(toastErrorMock).toHaveBeenCalledTimes(1);
          });

          const { action } = toastErrorMock.mock.calls[0]![0];
          await act(async () => action.onAct());

          await waitFor(() => {
            expect(toastErrorMock).toHaveBeenCalledTimes(2);
          });
          expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
          expect(
            screen.getByRole('button', { name: SAVE_POST }),
          ).toHaveAttribute(ARIA_PRESSED, 'false');
          const { action: secondAction } = toastErrorMock.mock.calls[1]![0];
          expect(secondAction).toEqual(
            expect.objectContaining({ label: 'Retry', keyHint: 'R' }),
          );
        });
      });

      it('shows the unavailable toast with no Retry action when the write is refused as unavailable', async () => {
        setBookmarkStatusMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.UNAVAILABLE,
        });

        await user.click(screen.getByRole('button', { name: SAVE_POST }));

        await waitFor(() => {
          expect(toastErrorMock).toHaveBeenCalledWith({
            message: UNAVAILABLE_MESSAGE,
          });
        });
      });

      it('shows the unavailable toast when the undo write is refused as unavailable', async () => {
        setBookmarkStatusMock
          .mockResolvedValueOnce({ outcome: ACTION_OUTCOME.SUCCESS })
          .mockResolvedValueOnce({ outcome: ACTION_OUTCOME.UNAVAILABLE });

        await user.click(screen.getByRole('button', { name: SAVE_POST }));
        await waitFor(() => {
          expect(toastSuccessMock).toHaveBeenCalled();
        });

        const { action } = toastSuccessMock.mock.calls[0]![0];
        await act(async () => action.onAct());

        await waitFor(() => {
          expect(toastErrorMock).toHaveBeenCalledWith({
            message: UNAVAILABLE_MESSAGE,
          });
        });
      });

      it('rolls back to the pre-undo committed state and shows an action-less error toast when the undo write fails', async () => {
        setBookmarkStatusMock
          .mockResolvedValueOnce({ outcome: ACTION_OUTCOME.SUCCESS })
          .mockResolvedValueOnce({ outcome: ACTION_OUTCOME.SERVER_ERROR });

        await user.click(screen.getByRole('button', { name: SAVE_POST }));
        await waitFor(() => {
          expect(toastSuccessMock).toHaveBeenCalled();
        });

        const { action } = toastSuccessMock.mock.calls[0]![0];
        await act(async () => action.onAct());

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: REMOVE_BOOKMARK }),
          ).toHaveAttribute(ARIA_PRESSED, 'true');
        });
        expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
        expect(toastErrorMock).toHaveBeenCalledWith({
          message: SAVE_FAILED_MESSAGE,
        });
        expect(toastInfoMock).not.toHaveBeenCalled();
      });

      it('retries a failed save: re-invokes setBookmarkStatus with the same value and shows a success toast once it succeeds', async () => {
        setBookmarkStatusMock
          .mockResolvedValueOnce({ outcome: ACTION_OUTCOME.SERVER_ERROR })
          .mockResolvedValueOnce({ outcome: ACTION_OUTCOME.SUCCESS });

        await user.click(screen.getByRole('button', { name: SAVE_POST }));
        await waitFor(() => {
          expect(toastErrorMock).toHaveBeenCalled();
        });

        const { action } = toastErrorMock.mock.calls[0]![0];
        await act(async () => action.onAct());

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: REMOVE_BOOKMARK }),
          ).toHaveAttribute(ARIA_PRESSED, 'true');
        });
        expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
        expect(setBookmarkStatusMock).toHaveBeenNthCalledWith(
          2,
          'post-1',
          true,
        );
        expect(toastSuccessMock).toHaveBeenCalledWith({
          message: SAVED_MESSAGE,
          action: expect.objectContaining({ label: 'Undo' }),
        });
      });
    });

    describe('with a bookmarked post', () => {
      beforeEach(async () => {
        getBookmarkStatusMock.mockResolvedValue(true);
        setBookmarkStatusMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.SUCCESS,
        });
        setup();
        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: REMOVE_BOOKMARK }),
          ).toBeEnabled();
        });
      });

      it('shows an info toast when unsaving an already-bookmarked post', async () => {
        await user.click(screen.getByRole('button', { name: REMOVE_BOOKMARK }));

        expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', false);
        await waitFor(() => {
          expect(toastInfoMock).toHaveBeenCalledWith({
            message: 'Removed from bookmarks',
            action: expect.objectContaining({ label: 'Undo' }),
          });
        });
        expect(toastSuccessMock).not.toHaveBeenCalled();
        expect(toastErrorMock).not.toHaveBeenCalled();
      });

      it('undoes a successful remove: re-bookmarks, re-invokes setBookmarkStatus, and shows a reverted-state info toast', async () => {
        await user.click(screen.getByRole('button', { name: REMOVE_BOOKMARK }));
        await waitFor(() => {
          expect(toastInfoMock).toHaveBeenCalledTimes(1);
        });
        expect(setBookmarkStatusMock).toHaveBeenCalledWith('post-1', false);

        const { action } = toastInfoMock.mock.calls[0]![0];
        await act(async () => action.onAct());

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: REMOVE_BOOKMARK }),
          ).toHaveAttribute(ARIA_PRESSED, 'true');
        });
        expect(setBookmarkStatusMock).toHaveBeenCalledTimes(2);
        expect(setBookmarkStatusMock).toHaveBeenNthCalledWith(
          2,
          'post-1',
          true,
        );
        expect(toastInfoMock).toHaveBeenNthCalledWith(2, {
          message: 'Reverted',
        });
      });
    });
  });
});

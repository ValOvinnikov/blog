import { ACTION_OUTCOME } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { AuthMenu } from '@web/components/shared/auth-menu';
import { BOOKMARK_LOG } from '@web/constants/bookmark';
import { SESSION_STATUS } from '@web/constants/session';
import { ToastProvider } from '@web/context/toast-provider';
import {
  getBookmarkStatus,
  setBookmarkStatus,
  type TSetBookmarkResult,
} from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';
import { reportClientError } from '@web/utils/report-client-error';
import { type SessionContextValue, useSession } from 'next-auth/react';

import { BookmarkButton } from './bookmark-button';

vi.mock('next-auth/react', () => ({ useSession: vi.fn(), signIn: vi.fn() }));

vi.mock('@web/server/bookmarks/bookmark-actions/bookmark-actions', () => ({
  getBookmarkStatus: vi.fn(),
  setBookmarkStatus: vi.fn(),
}));

vi.mock('@web/utils/report-client-error');

faker.seed(5901);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_SESSION = { user: { id: faker.string.uuid() }, expires: '' };

const SAVE_POST = 'Save post';
const REMOVE_BOOKMARK = 'Remove bookmark';
const SIGN_IN_PANEL = 'Sign in options';
const UNDO = 'Undo';
const RETRY = /^Retry/;
const ARIA_PRESSED = 'aria-pressed';
const SAVED_MESSAGE = 'Saved to bookmarks';
const REMOVED_MESSAGE = 'Removed from bookmarks';
const REVERTED_MESSAGE = 'Reverted';
const SAVE_FAILED_MESSAGE = "Couldn't save that. Try again.";
const UNAVAILABLE_MESSAGE =
  "Bookmarking isn't available on this site right now.";

const mockSessionStatus = (status: TValueOf<typeof SESSION_STATUS>) => {
  vi.mocked(useSession).mockReturnValue({
    data: status === SESSION_STATUS.AUTHENTICATED ? MOCK_SESSION : null,
    status,
    update: vi.fn(),
  } as SessionContextValue);
};

const setup = () =>
  renderElement(
    <ToastProvider>
      <AuthMenu oauthProviderIds={['github']} />
      <BookmarkButton postId={MOCK_POST_ID} />
    </ToastProvider>,
  );

const mockWriteOutcomes = (...outcomes: TSetBookmarkResult['outcome'][]) => {
  for (const outcome of outcomes) {
    vi.mocked(setBookmarkStatus).mockResolvedValueOnce({
      outcome,
    } as TSetBookmarkResult);
  }
};

describe(`<${BookmarkButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(getBookmarkStatus).mockReset();
    vi.mocked(setBookmarkStatus).mockReset();
  });

  describe('when signed out', () => {
    let saveButton: HTMLElement;

    beforeEach(() => {
      mockSessionStatus(SESSION_STATUS.UNAUTHENTICATED);
      setup();
      saveButton = screen.getByRole('button', { name: SAVE_POST });
    });

    it('renders an enabled, not-pressed save toggle', () => {
      expect(saveButton).toBeEnabled();
      expect(saveButton).toHaveAttribute(ARIA_PRESSED, 'false');
    });

    it('opens the sign-in panel and saves nothing when pressed', async () => {
      await user.click(saveButton);

      const signInPanel = screen.getByRole('menu', { name: SIGN_IN_PANEL });
      expect(signInPanel).toBeVisible();
      expect(setBookmarkStatus).not.toHaveBeenCalled();
    });
  });

  describe('while the session is resolving', () => {
    beforeEach(() => {
      mockSessionStatus(SESSION_STATUS.LOADING);
      setup();
    });

    it('neither saves nor opens the sign-in panel when pressed', async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_POST });

      await user.click(saveButton);

      const signInPanel = screen.queryByRole('menu', { name: SIGN_IN_PANEL });
      expect(signInPanel).not.toBeInTheDocument();
      expect(setBookmarkStatus).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      mockSessionStatus(SESSION_STATUS.AUTHENTICATED);
    });

    it('does not save while the bookmark status is still loading', async () => {
      vi.mocked(getBookmarkStatus).mockReturnValue(new Promise(() => {}));
      setup();
      const saveButton = screen.getByRole('button', { name: SAVE_POST });

      await user.click(saveButton);

      expect(saveButton).toHaveAttribute(ARIA_PRESSED, 'false');
      expect(setBookmarkStatus).not.toHaveBeenCalled();
    });

    it('shows Saved once the bookmark status loads as saved', async () => {
      vi.mocked(getBookmarkStatus).mockResolvedValue(true);
      setup();

      const savedButton = await screen.findByRole('button', {
        name: REMOVE_BOOKMARK,
      });

      expect(savedButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(savedButton).toHaveTextContent('Saved');
    });

    it('logs and falls back to unsaved when the status fetch fails', async () => {
      vi.mocked(getBookmarkStatus).mockRejectedValue(MOCK_ERROR);
      setup();

      await waitFor(() => {
        expect(reportClientError).toHaveBeenCalledWith(
          BOOKMARK_LOG.BUTTON_STATUS_FETCH_FAILED,
          MOCK_ERROR,
        );
      });
      const saveButton = screen.getByRole('button', { name: SAVE_POST });
      expect(saveButton).toHaveAttribute(ARIA_PRESSED, 'false');
      expect(logger.error).toHaveBeenCalledWith(
        BOOKMARK_LOG.BUTTON_STATUS_FETCH_FAILED,
        { postId: MOCK_POST_ID, error: MOCK_ERROR },
      );
    });

    describe('with an unsaved post', () => {
      let saveButton: HTMLElement;

      beforeEach(async () => {
        vi.mocked(getBookmarkStatus).mockResolvedValue(false);
        setup();
        await waitFor(() => {
          expect(getBookmarkStatus).toHaveBeenCalledWith(MOCK_POST_ID);
        });
        saveButton = screen.getByRole('button', { name: SAVE_POST });
      });

      it('saves the post and confirms with a toast', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.SUCCESS);

        await user.click(saveButton);

        const confirmation = await screen.findByText(SAVED_MESSAGE);
        const savedButton = screen.getByRole('button', {
          name: REMOVE_BOOKMARK,
        });
        expect(confirmation).toBeVisible();
        expect(savedButton).toHaveAttribute(ARIA_PRESSED, 'true');
        expect(setBookmarkStatus).toHaveBeenCalledWith(MOCK_POST_ID, true);
      });

      it('undoes a save from the toast', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.SUCCESS, ACTION_OUTCOME.SUCCESS);
        await user.click(saveButton);
        const undoButton = await screen.findByRole('button', { name: UNDO });

        await user.click(undoButton);

        const reverted = await screen.findByText(REVERTED_MESSAGE);
        const unsavedButton = screen.getByRole('button', { name: SAVE_POST });
        expect(reverted).toBeVisible();
        expect(unsavedButton).toHaveAttribute(ARIA_PRESSED, 'false');
        expect(setBookmarkStatus).toHaveBeenLastCalledWith(MOCK_POST_ID, false);
      });

      it('rolls back and offers Retry when the save fails', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.SERVER_ERROR);

        await user.click(saveButton);

        const failure = await screen.findByText(SAVE_FAILED_MESSAGE);
        const retryButton = screen.getByRole('button', { name: RETRY });
        expect(failure).toBeVisible();
        expect(retryButton).toBeVisible();
        expect(saveButton).toHaveAttribute(ARIA_PRESSED, 'false');
      });

      it('saves the post when Retry succeeds', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.SERVER_ERROR, ACTION_OUTCOME.SUCCESS);
        await user.click(saveButton);
        const retryButton = await screen.findByRole('button', { name: RETRY });

        await user.click(retryButton);

        const confirmation = await screen.findByText(SAVED_MESSAGE);
        const savedButton = screen.getByRole('button', {
          name: REMOVE_BOOKMARK,
        });
        expect(confirmation).toBeVisible();
        expect(savedButton).toHaveAttribute(ARIA_PRESSED, 'true');
      });

      it('offers Retry again when the retried save fails too', async () => {
        mockWriteOutcomes(
          ACTION_OUTCOME.SERVER_ERROR,
          ACTION_OUTCOME.SERVER_ERROR,
        );
        await user.click(saveButton);
        const retryButton = await screen.findByRole('button', { name: RETRY });

        await user.click(retryButton);

        await waitFor(() => {
          expect(setBookmarkStatus).toHaveBeenCalledTimes(2);
        });
        const nextRetryButton = await screen.findByRole('button', {
          name: RETRY,
        });
        expect(nextRetryButton).toBeVisible();
        expect(saveButton).toHaveAttribute(ARIA_PRESSED, 'false');
      });

      it('shows the unavailable message with no Retry when refused', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.UNAVAILABLE);

        await user.click(saveButton);

        const unavailable = await screen.findByText(UNAVAILABLE_MESSAGE);
        const retryButton = screen.queryByRole('button', { name: RETRY });
        expect(unavailable).toBeVisible();
        expect(retryButton).not.toBeInTheDocument();
      });

      it.each([
        [ACTION_OUTCOME.SERVER_ERROR, SAVE_FAILED_MESSAGE],
        [ACTION_OUTCOME.UNAVAILABLE, UNAVAILABLE_MESSAGE],
      ])(
        'keeps the save and explains when Undo fails (%s)',
        async (undoOutcome, message) => {
          mockWriteOutcomes(ACTION_OUTCOME.SUCCESS, undoOutcome);
          await user.click(saveButton);
          const undoButton = await screen.findByRole('button', { name: UNDO });

          await user.click(undoButton);

          const failure = await screen.findByText(message);
          const savedButton = screen.getByRole('button', {
            name: REMOVE_BOOKMARK,
          });
          expect(failure).toBeVisible();
          expect(savedButton).toHaveAttribute(ARIA_PRESSED, 'true');
        },
      );
    });

    describe('with a saved post', () => {
      let savedButton: HTMLElement;

      beforeEach(async () => {
        vi.mocked(getBookmarkStatus).mockResolvedValue(true);
        setup();
        savedButton = await screen.findByRole('button', {
          name: REMOVE_BOOKMARK,
        });
      });

      it('removes the bookmark and confirms with a toast', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.SUCCESS);

        await user.click(savedButton);

        const confirmation = await screen.findByText(REMOVED_MESSAGE);
        expect(confirmation).toBeVisible();
        expect(setBookmarkStatus).toHaveBeenCalledWith(MOCK_POST_ID, false);
      });

      it('restores the bookmark when the removal is undone', async () => {
        mockWriteOutcomes(ACTION_OUTCOME.SUCCESS, ACTION_OUTCOME.SUCCESS);
        await user.click(savedButton);
        const undoButton = await screen.findByRole('button', { name: UNDO });

        await user.click(undoButton);

        const reverted = await screen.findByText(REVERTED_MESSAGE);
        const restoredButton = screen.getByRole('button', {
          name: REMOVE_BOOKMARK,
        });
        expect(reverted).toBeVisible();
        expect(restoredButton).toHaveAttribute(ARIA_PRESSED, 'true');
        expect(setBookmarkStatus).toHaveBeenLastCalledWith(MOCK_POST_ID, true);
      });
    });
  });
});

import { faker } from '@faker-js/faker';
import {
  act,
  renderHook,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TOAST_EXIT_BUFFER_MS } from '@platform/testing/toast/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ToastProvider, useToast } from './toast-provider';

faker.seed(5);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();
const MOCK_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_LOADING_MESSAGE = faker.lorem.sentence();
const MOCK_FAILED_MESSAGE = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_ACTION_KEY_HINT = faker.string.alpha(1);
const MOCK_PROMISE_VALUE = faker.lorem.word();
const MOCK_BEFORE_HOVER_MS = 1000;
const MOCK_HOVERED_MS = 4000;
const MOCK_TABS_TO_SUCCESS_CLOSE = 4;
const MOCK_TABS_TO_ERROR_CLOSE = 3;

const FIRE_SUCCESS = 'fire-success';
const FIRE_ERROR = 'fire-error';
const FIRE_PROMISE = 'fire-promise';

const dismissLabel = makeEnTranslator('toast')('dismissLabel');
const mergeCountSuffix = makeEnTranslator('toastProvider')('mergeCountSuffix', {
  count: 2,
});

const successAction = vi.fn();

const ToastHarness = () => {
  const toast = useToast();

  return (
    <>
      <button
        onClick={() =>
          toast.success({
            title: MOCK_TITLE,
            message: MOCK_SUCCESS_MESSAGE,
            action: {
              label: MOCK_ACTION_LABEL,
              onAct: successAction,
              keyHint: MOCK_ACTION_KEY_HINT,
            },
          })
        }
      >
        {FIRE_SUCCESS}
      </button>
      <button
        onClick={() =>
          toast.error({ title: MOCK_TITLE, message: MOCK_ERROR_MESSAGE })
        }
      >
        {FIRE_ERROR}
      </button>
      <button
        onClick={() =>
          toast.promise(Promise.resolve(MOCK_PROMISE_VALUE), {
            loading: { title: MOCK_TITLE, message: MOCK_LOADING_MESSAGE },
            success: { title: MOCK_TITLE, message: MOCK_SUCCESS_MESSAGE },
            error: { title: MOCK_TITLE, message: MOCK_FAILED_MESSAGE },
          })
        }
      >
        {FIRE_PROMISE}
      </button>
    </>
  );
};

const advanceTimers = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const runAllTimers = () =>
  act(async () => {
    await vi.runAllTimersAsync();
  });

describe(`<${ToastProvider.name}/>`, () => {
  let user: UserEvent;

  const tabTimes = async (count: number) => {
    for (let i = 0; i < count; i++) {
      await user.tab();
    }
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with the toast harness', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'requestAnimationFrame',
        (callback: FrameRequestCallback) => {
          callback(0);
          return 0;
        },
      );
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
      renderWithIntl(<ToastHarness />);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders no toast until one is fired', () => {
      const toastStatus = screen.queryByRole('status');

      expect(toastStatus).not.toBeInTheDocument();
    });

    it('shows a success toast with polite status semantics', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });

      await user.click(fireSuccess);

      const toastStatus = screen.getByRole('status');
      const message = screen.getByText(MOCK_SUCCESS_MESSAGE);
      expect(toastStatus).toBeVisible();
      expect(message).toBeVisible();
    });

    it('shows the payload title', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });

      await user.click(fireSuccess);

      const title = screen.getByText(MOCK_TITLE);
      expect(title).toBeVisible();
    });

    it('shows an error toast with assertive alert semantics', async () => {
      const fireError = screen.getByRole('button', { name: FIRE_ERROR });

      await user.click(fireError);

      const toastAlert = screen.getByRole('alert');
      const message = screen.getByText(MOCK_ERROR_MESSAGE);
      expect(toastAlert).toBeVisible();
      expect(message).toBeVisible();
    });

    it('dismisses a toast via its close button', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireSuccess);

      const closeButton = screen.getByRole('button', { name: dismissLabel });
      await user.click(closeButton);
      await advanceTimers(MOCK_TOAST_EXIT_BUFFER_MS);

      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      expect(message).not.toBeInTheDocument();
    });

    it('runs the action callback and dismisses the toast', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireSuccess);

      const actionButton = screen.getByRole('button', {
        name: new RegExp(`^${MOCK_ACTION_LABEL}`),
      });
      await user.click(actionButton);
      await advanceTimers(MOCK_TOAST_EXIT_BUFFER_MS);

      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      expect(successAction).toHaveBeenCalledTimes(1);
      expect(message).not.toBeInTheDocument();
    });

    it('pauses auto-dismiss on hover and resumes on mouse-leave', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireSuccess);
      const toastStatus = screen.getByRole('status');

      await advanceTimers(MOCK_BEFORE_HOVER_MS);
      await user.hover(toastStatus);
      await advanceTimers(MOCK_HOVERED_MS);
      const messageWhileHovered = screen.getByText(MOCK_SUCCESS_MESSAGE);
      expect(messageWhileHovered).toBeVisible();

      await user.unhover(toastStatus);
      await runAllTimers();

      const messageAfterLeave = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      expect(messageAfterLeave).not.toBeInTheDocument();
    });

    it('keeps the timer paused on mouse-leave while focus is inside', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireSuccess);
      const toastStatus = screen.getByRole('status');
      const closeButton = screen.getByRole('button', { name: dismissLabel });

      await user.hover(toastStatus);
      await tabTimes(MOCK_TABS_TO_SUCCESS_CLOSE);
      expect(closeButton).toHaveFocus();
      await user.unhover(toastStatus);
      await advanceTimers(MOCK_HOVERED_MS);
      const messageWhileFocused = screen.getByText(MOCK_SUCCESS_MESSAGE);
      expect(messageWhileFocused).toBeVisible();

      await user.tab();
      await runAllTimers();

      const messageAfterBlur = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      expect(messageAfterBlur).not.toBeInTheDocument();
    });

    it('collapses a rapid identical success repeat into one counted toast', async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });

      await user.click(fireSuccess);
      await user.click(fireSuccess);

      const toastStatuses = screen.getAllByRole('status');
      const countedMessage = screen.getByText(
        `${MOCK_SUCCESS_MESSAGE}${mergeCountSuffix}`,
      );
      expect(toastStatuses).toHaveLength(1);
      expect(countedMessage).toBeVisible();
    });

    it('dismisses the newest toast on Escape when no toast is focused', async () => {
      const fireError = screen.getByRole('button', { name: FIRE_ERROR });
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireError);
      await user.click(fireSuccess);

      await user.keyboard('{Escape}');
      await advanceTimers(MOCK_TOAST_EXIT_BUFFER_MS);

      const dismissedMessage = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      const keptMessage = screen.getByText(MOCK_ERROR_MESSAGE);
      expect(dismissedMessage).not.toBeInTheDocument();
      expect(keptMessage).toBeVisible();
    });

    it('dismisses the focused toast on Escape, not the newest', async () => {
      const fireError = screen.getByRole('button', { name: FIRE_ERROR });
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireError);
      await user.click(fireSuccess);
      const [errorCloseButton] = screen.getAllByRole('button', {
        name: dismissLabel,
      });

      await tabTimes(MOCK_TABS_TO_ERROR_CLOSE);
      expect(errorCloseButton).toHaveFocus();
      await user.keyboard('{Escape}');
      await advanceTimers(MOCK_TOAST_EXIT_BUFFER_MS);

      const dismissedMessage = screen.queryByText(MOCK_ERROR_MESSAGE);
      const keptMessage = screen.getByText(MOCK_SUCCESS_MESSAGE);
      expect(dismissedMessage).not.toBeInTheDocument();
      expect(keptMessage).toBeVisible();
    });

    it('shows only the resolved toast when a promise settles quickly', async () => {
      const firePromise = screen.getByRole('button', { name: FIRE_PROMISE });

      await user.click(firePromise);

      const toastStatus = await screen.findByRole('status');
      const message = screen.getByText(MOCK_SUCCESS_MESSAGE);
      const loadingMessage = screen.queryByText(MOCK_LOADING_MESSAGE);
      expect(toastStatus).toBeVisible();
      expect(message).toBeVisible();
      expect(loadingMessage).not.toBeInTheDocument();
    });
  });

  describe('enter frames', () => {
    const pendingFrames = new Map<number, FrameRequestCallback>();

    beforeEach(() => {
      pendingFrames.clear();
      let nextFrameId = 1;
      vi.stubGlobal(
        'requestAnimationFrame',
        (callback: FrameRequestCallback) => {
          const frameId = nextFrameId++;
          pendingFrames.set(frameId, callback);
          return frameId;
        },
      );
      vi.stubGlobal('cancelAnimationFrame', (frameId: number) => {
        pendingFrames.delete(frameId);
      });
      renderWithIntl(<ToastHarness />);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("cancels a toast's pending enter frames once it is dismissed", async () => {
      const fireSuccess = screen.getByRole('button', { name: FIRE_SUCCESS });
      await user.click(fireSuccess);
      expect(pendingFrames.size).toBeGreaterThan(0);

      await user.keyboard('{Escape}');
      await advanceTimers(MOCK_TOAST_EXIT_BUFFER_MS);

      const message = screen.queryByText(MOCK_SUCCESS_MESSAGE);
      expect(message).not.toBeInTheDocument();
      expect(pendingFrames.size).toBe(0);
    });
  });

  describe(useToast, () => {
    it('throws when called outside a ToastProvider', () => {
      expect(() => renderHook(() => useToast())).toThrow(
        'useToast must be used within a ToastProvider',
      );
    });
  });
});

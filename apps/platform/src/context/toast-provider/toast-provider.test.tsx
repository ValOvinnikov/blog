import { LOCALE_ISO_CODES } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { TOAST_EXIT_BUFFER_MS } from '@platform/testing/toast-timing';
import {
  act,
  fireEvent,
  render as rtlRender,
  renderHook,
  screen,
  type RenderOptions,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

import { ToastProvider, useToast } from './toast-provider';

const withIntl = (ui: ReactElement, options?: RenderOptions) =>
  rtlRender(
    <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );

const SAVED_TO_BOOKMARKS = 'Saved to bookmarks';
const BOOKMARK = 'Bookmark';
const FIRE_SUCCESS = 'fire-success';
const FIRE_ERROR = 'fire-error';
const COULDNT_SAVE = "couldn't save";
const DISMISS_NOTIFICATION = 'Dismiss notification';

const successAction = vi.fn();

const ToastHarness = () => {
  const toast = useToast();

  return (
    <>
      <button
        onClick={() =>
          toast.success({
            title: BOOKMARK,
            message: SAVED_TO_BOOKMARKS,
            action: { label: 'Undo', onAct: successAction, keyHint: '⌘Z' },
          })
        }
      >
        {FIRE_SUCCESS}
      </button>
      <button
        onClick={() =>
          toast.error({
            title: BOOKMARK,
            message: COULDNT_SAVE,
          })
        }
      >
        {FIRE_ERROR}
      </button>
      <button
        onClick={() =>
          toast.promise(Promise.resolve('done'), {
            loading: {
              title: BOOKMARK,
              message: 'saving…',
            },
            success: {
              title: BOOKMARK,
              message: SAVED_TO_BOOKMARKS,
            },
            error: { title: BOOKMARK, message: 'failed' },
          })
        }
      >
        fire-promise
      </button>
    </>
  );
};

describe(ToastProvider, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders children', () => {
    withIntl(
      <ToastProvider>
        <p>Article body</p>
      </ToastProvider>,
    );

    expect(screen.getByText('Article body')).toBeVisible();
  });

  describe('with the toast harness', () => {
    beforeEach(() => {
      withIntl(
        <ToastProvider>
          <ToastHarness />
        </ToastProvider>,
      );
    });

    it('renders no toast until one is fired', () => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows a success toast with polite status semantics when fired', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));

      expect(screen.getByRole('status')).toBeVisible();
      expect(screen.getByText(SAVED_TO_BOOKMARKS)).toBeVisible();
    });

    it('renders a payload title, so a caller that sets one actually gets it shown', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));

      expect(screen.getByText(BOOKMARK).tagName).toBe('STRONG');
    });

    it('shows an error toast with assertive alert semantics when fired', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_ERROR }));

      expect(screen.getByRole('alert')).toBeVisible();
      expect(screen.getByText(COULDNT_SAVE)).toBeVisible();
    });

    it('dismisses a toast via its close button', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));
      fireEvent.click(
        screen.getByRole('button', { name: DISMISS_NOTIFICATION }),
      );
      act(() => {
        vi.advanceTimersToNextTimer();
      });

      expect(screen.queryByText(SAVED_TO_BOOKMARKS)).not.toBeInTheDocument();
    });

    it('running the action callback also dismisses the toast', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));
      fireEvent.click(screen.getByRole('button', { name: /^Undo/ }));
      act(() => {
        vi.advanceTimersToNextTimer();
      });

      expect(successAction).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(SAVED_TO_BOOKMARKS)).not.toBeInTheDocument();
    });

    it('pauses auto-dismiss on hover and resumes on mouse-leave', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));
      const toastEl = screen.getByRole('status');

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      fireEvent.mouseEnter(toastEl);

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText(SAVED_TO_BOOKMARKS)).toBeVisible();

      fireEvent.mouseLeave(toastEl);
      act(() => {
        vi.runAllTimers();
      });

      expect(screen.queryByText(SAVED_TO_BOOKMARKS)).not.toBeInTheDocument();
    });

    it('mouse-leave does not resume the timer while focus remains inside the toast', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));
      const toastEl = screen.getByRole('status');
      const dismissButton = screen.getByRole('button', {
        name: DISMISS_NOTIFICATION,
      });

      fireEvent.mouseEnter(toastEl);
      act(() => {
        dismissButton.focus();
      });
      fireEvent.mouseLeave(toastEl, { relatedTarget: document.body });

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText(SAVED_TO_BOOKMARKS)).toBeVisible();

      act(() => {
        dismissButton.blur();
      });
      act(() => {
        vi.runAllTimers();
      });
      expect(screen.queryByText(SAVED_TO_BOOKMARKS)).not.toBeInTheDocument();
    });

    it('collapses a rapid identical success repeat into one toast with a count suffix', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));

      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getByText('Saved to bookmarks ×2')).toBeVisible();
    });

    it('Esc with no toast focused dismisses the newest toast', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_ERROR }));
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));

      fireEvent.keyDown(document, { key: 'Escape' });
      act(() => {
        vi.advanceTimersToNextTimer();
      });

      expect(screen.queryByText(SAVED_TO_BOOKMARKS)).not.toBeInTheDocument();
      expect(screen.getByText(COULDNT_SAVE)).toBeVisible();
    });

    it('Esc with focus inside a toast dismisses that toast, not the newest', () => {
      fireEvent.click(screen.getByRole('button', { name: FIRE_ERROR }));
      fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));

      const errorDismiss = screen.getAllByRole('button', {
        name: DISMISS_NOTIFICATION,
      })[0]!;
      act(() => {
        errorDismiss.focus();
      });
      fireEvent.keyDown(errorDismiss, { key: 'Escape' });
      act(() => {
        vi.advanceTimersByTime(TOAST_EXIT_BUFFER_MS);
      });

      expect(screen.queryByText(COULDNT_SAVE)).not.toBeInTheDocument();
      expect(screen.getByText(SAVED_TO_BOOKMARKS)).toBeVisible();
    });

    it('toast.promise shows the resolved toast when the promise settles quickly', async () => {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'fire-promise' }));
        await Promise.resolve();
      });

      expect(screen.getByRole('status')).toBeVisible();
      expect(screen.getByText(SAVED_TO_BOOKMARKS)).toBeVisible();
      expect(screen.queryByText('saving…')).not.toBeInTheDocument();
    });
  });

  it("cancels a toast's pending enter frames once it is dismissed", () => {
    const pendingFrames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 1;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const frameId = nextFrameId++;
      pendingFrames.set(frameId, callback);
      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (frameId: number) => {
      pendingFrames.delete(frameId);
    });
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: FIRE_SUCCESS }));
    expect(pendingFrames.size).toBeGreaterThan(0);

    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_BUFFER_MS);
    });

    expect(screen.queryByText(SAVED_TO_BOOKMARKS)).not.toBeInTheDocument();
    expect(pendingFrames.size).toBe(0);
  });

  it('useToast throws when called outside a ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider',
    );
  });
});

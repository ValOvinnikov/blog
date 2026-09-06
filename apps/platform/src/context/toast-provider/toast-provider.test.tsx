import { LOCALE_ISO_CODES } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
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
import { TOAST_EXIT_ANIMATION_MS } from './toast-store';

const withIntl = (ui: ReactElement, options?: RenderOptions) =>
  rtlRender(
    <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );

const successAction = vi.fn();

/** Fires a distinct, known toast per button so tests can target one precisely. */
const ToastHarness = () => {
  const toast = useToast();

  return (
    <>
      <button
        onClick={() =>
          toast.success({
            title: 'Bookmark',
            message: 'Saved to bookmarks',
            action: { label: 'Undo', onAct: successAction, keyHint: '⌘Z' },
          })
        }
      >
        fire-success
      </button>
      <button
        onClick={() =>
          toast.error({
            title: 'Bookmark',
            message: "couldn't save",
          })
        }
      >
        fire-error
      </button>
      <button
        onClick={() =>
          toast.promise(Promise.resolve('done'), {
            loading: {
              title: 'Bookmark',
              message: 'saving…',
            },
            success: {
              title: 'Bookmark',
              message: 'Saved to bookmarks',
            },
            error: { title: 'Bookmark', message: 'failed' },
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
    successAction.mockClear();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
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

  it('renders no toast until one is fired', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a success toast with polite status semantics when fired', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('renders a payload title, so a caller that sets one actually gets it shown', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    expect(screen.getByText('Bookmark').tagName).toBe('STRONG');
  });

  it('shows an error toast with assertive alert semantics when fired', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-error' }));

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText("couldn't save")).toBeVisible();
  });

  it('dismisses a toast via its close button', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);
    });

    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('running the action callback also dismisses the toast', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    // The accessible name concatenates the label and key-hint with no
    // separating space ("Undo⌘Z"), so match by substring.
    fireEvent.click(screen.getByRole('button', { name: /^Undo/ }));
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);
    });

    expect(successAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('pauses auto-dismiss on hover and resumes from the exact remaining time on mouse-leave', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    const toastEl = screen.getByRole('status');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.mouseEnter(toastEl);

    // The default 3.6s life would have elapsed by now if the timer had kept
    // running while hovered — it must still be present.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();

    fireEvent.mouseLeave(toastEl);
    act(() => {
      vi.advanceTimersByTime(2600 + TOAST_EXIT_ANIMATION_MS);
    });

    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('mouse-leave does not resume the timer while focus remains inside the toast', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    const toastEl = screen.getByRole('status');
    const dismissButton = screen.getByRole('button', {
      name: 'Dismiss notification',
    });

    // Hover pauses, then focus also enters (tabbing to the dismiss button)
    // before the mouse leaves without focus moving. `.focus()`/`.blur()` are
    // used directly (not `fireEvent.focus`/`fireEvent.blur`, which dispatch
    // only the non-bubbling `focus`/`blur` events) so jsdom also fires the
    // bubbling `focusin`/`focusout` React's delegated onFocus/onBlur listens
    // for.
    fireEvent.mouseEnter(toastEl);
    act(() => {
      dismissButton.focus();
    });
    // `relatedTarget` must be something *outside* the toast — React only
    // synthesizes a `mouseleave` when the pointer's destination isn't a
    // descendant of the element (moving onto a child, like the dismiss
    // button, correctly does not count as leaving).
    fireEvent.mouseLeave(toastEl, { relatedTarget: document.body });

    // The default 3.6s life would have elapsed by now if leaving with the
    // mouse alone had resumed the timer — it must not have, since focus is
    // still inside the toast.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();

    // Only once focus *also* leaves does the timer actually resume.
    act(() => {
      dismissButton.blur();
    });
    act(() => {
      vi.advanceTimersByTime(3600 + TOAST_EXIT_ANIMATION_MS);
    });
    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('collapses a rapid identical success repeat into one toast with a count suffix', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText('Saved to bookmarks ×2')).toBeVisible();
  });

  it('Esc with no toast focused dismisses the newest toast', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-error' }));
    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);
    });

    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
    expect(screen.getByText("couldn't save")).toBeVisible();
  });

  it('Esc with focus inside a toast dismisses that toast, not the newest', () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-error' }));
    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    const errorDismiss = screen.getAllByRole('button', {
      name: 'Dismiss notification',
    })[0]!;
    // `fireEvent.focus` only dispatches the event — it doesn't move
    // `document.activeElement` in jsdom, which the Esc handler reads.
    act(() => {
      errorDismiss.focus();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_ANIMATION_MS);
    });

    expect(screen.queryByText("couldn't save")).not.toBeInTheDocument();
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('toast.promise shows the resolved toast when the promise settles quickly', async () => {
    withIntl(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'fire-promise' }));
      // Flushes the already-resolved promise's microtask so the `.then`
      // callback (which enqueues the toast) runs before assertions.
      await Promise.resolve();
    });

    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
    expect(screen.queryByText('saving…')).not.toBeInTheDocument();
  });

  it('useToast throws when called outside a ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider',
    );
  });
});

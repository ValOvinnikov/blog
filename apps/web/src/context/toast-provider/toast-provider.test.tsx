import {
  act,
  fireEvent,
  renderElement,
  renderHook,
  screen,
} from '@web/testing/custom-render';

import { ToastProvider, useToast } from './toast-provider';

const successAction = vi.fn();

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
            loading: { message: 'saving…' },
            success: { message: 'Saved to bookmarks' },
            error: { message: 'failed' },
          })
        }
      >
        fire-promise
      </button>
    </>
  );
};

describe(`<${ToastProvider.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    renderElement(
      <ToastProvider>
        <p>Article body</p>
      </ToastProvider>,
    );

    expect(screen.getByText('Article body')).toBeVisible();
  });

  it('renders no toast until one is fired (nothing in the static/initial render)', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a success toast with polite status semantics when fired', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('renders the given title alongside the message', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    expect(screen.getByText('Bookmark')).toBeVisible();
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('shows an error toast with assertive alert semantics when fired', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-error' }));

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText("couldn't save")).toBeVisible();
  });

  it('dismisses a toast via its close button', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('running the action callback also dismisses the toast', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    fireEvent.click(screen.getByRole('button', { name: /^Undo/ }));
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(successAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('pauses auto-dismiss on hover and resumes from the exact remaining time on mouse-leave', () => {
    renderElement(
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

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();

    fireEvent.mouseLeave(toastEl);
    act(() => {
      vi.runOnlyPendingTimers();
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('mouse-leave does not resume the timer while focus remains inside the toast', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));
    const toastEl = screen.getByRole('status');
    const dismissButton = screen.getByRole('button', {
      name: 'Dismiss notification',
    });

    fireEvent.mouseEnter(toastEl);
    act(() => {
      dismissButton.focus();
    });
    fireEvent.mouseLeave(toastEl, { relatedTarget: document.body });

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();

    act(() => {
      dismissButton.blur();
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
  });

  it('collapses a rapid identical success repeat into one toast with a count suffix', () => {
    renderElement(
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
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-error' }));
    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByText('Saved to bookmarks')).not.toBeInTheDocument();
    expect(screen.getByText("couldn't save")).toBeVisible();
  });

  it('Esc with focus inside a toast dismisses that toast, not the newest', () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'fire-error' }));
    fireEvent.click(screen.getByRole('button', { name: 'fire-success' }));

    const errorDismiss = screen.getAllByRole('button', {
      name: 'Dismiss notification',
    })[0]!;
    act(() => {
      errorDismiss.focus();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByText("couldn't save")).not.toBeInTheDocument();
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('toast.promise shows the resolved toast when the promise settles quickly', async () => {
    renderElement(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'fire-promise' }));
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

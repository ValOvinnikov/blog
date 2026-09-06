import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useRouter } from 'next/navigation';

import { NewsletterSubscriptionControl } from './newsletter-subscription-control';

const {
  routerRefreshMock,
  unsubscribeActionMock,
  resendConfirmationActionMock,
  toastPromiseMock,
} = vi.hoisted(() => ({
  routerRefreshMock: vi.fn(),
  unsubscribeActionMock: vi.fn(),
  resendConfirmationActionMock: vi.fn(),
  // Mirrors the real `toast.promise`'s contract closely enough for these
  // tests: it forwards the given promise unchanged, so awaiting/rejecting
  // it in the component under test behaves the same as the real store.
  toastPromiseMock: vi.fn((promise: Promise<unknown>) => promise),
}));

// `next/navigation` is already globally mocked (`vitest-setup.ts`), but its
// default `useRouter` stub returns a brand-new `refresh: vi.fn()` on every
// call — this override pins a stable `refresh` mock this suite can assert
// against.
vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: routerRefreshMock,
} as unknown as ReturnType<typeof useRouter>);

vi.mock('@web/server/newsletter/newsletter-subscription-actions', () => ({
  unsubscribeAction: unsubscribeActionMock,
  resendConfirmationAction: resendConfirmationActionMock,
}));

vi.mock('@web/context/toast-provider', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    promise: toastPromiseMock,
    dismiss: vi.fn(),
  }),
}));

const setup = customRender(NewsletterSubscriptionControl, {
  action: 'unsubscribe' as const,
});

describe(`<${NewsletterSubscriptionControl.name}/>`, () => {
  beforeEach(() => {
    routerRefreshMock.mockReset();
    unsubscribeActionMock.mockReset();
    resendConfirmationActionMock.mockReset();
    toastPromiseMock.mockClear();
    toastPromiseMock.mockImplementation((promise: Promise<unknown>) => promise);
  });

  it('renders the unsubscribe button copy for the "unsubscribe" action', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeVisible();
  });

  it('renders the resend button copy for the "resend" action', () => {
    setup({ action: 'resend' });

    expect(
      screen.getByRole('button', { name: 'Resend confirmation' }),
    ).toBeVisible();
  });

  it('runs unsubscribeAction through toast.promise and refreshes the router on success', async () => {
    unsubscribeActionMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Unsubscribe' }));

    await waitFor(() => {
      expect(unsubscribeActionMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });

    expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
      loading: { message: 'Unsubscribing…' },
      success: { message: "You've been unsubscribed." },
      error: { message: "Couldn't unsubscribe. Try again." },
    });
  });

  it('runs resendConfirmationAction through toast.promise and refreshes the router on success', async () => {
    resendConfirmationActionMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    setup({ action: 'resend' });

    await user.click(
      screen.getByRole('button', { name: 'Resend confirmation' }),
    );

    await waitFor(() => {
      expect(resendConfirmationActionMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });

    expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
      loading: { message: 'Resending the confirmation email…' },
      success: { message: 'Confirmation email resent.' },
      error: { message: "Couldn't resend the confirmation email. Try again." },
    });
  });

  it('does not refresh the router when the action fails', async () => {
    unsubscribeActionMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Unsubscribe' }));

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Unsubscribe' }),
      ).toHaveAttribute('aria-busy', 'false');
    });
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('marks the button aria-busy while the action is pending, and clears it once settled', async () => {
    let resolveAction!: (result: { ok: true }) => void;
    unsubscribeActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    setup();

    const button = screen.getByRole('button', { name: 'Unsubscribe' });
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveAction({ ok: true });

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });
});

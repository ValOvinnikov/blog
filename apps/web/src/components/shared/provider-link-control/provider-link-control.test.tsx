import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useRouter } from 'next/navigation';

import { ProviderLinkControl } from './provider-link-control';

const {
  routerRefreshMock,
  signInMock,
  unlinkProviderActionMock,
  toastPromiseMock,
} = vi.hoisted(() => ({
  routerRefreshMock: vi.fn(),
  signInMock: vi.fn(),
  unlinkProviderActionMock: vi.fn(),
  // Mirrors the real `toast.promise`'s contract closely enough for these
  // tests: it forwards the given promise unchanged, so awaiting/rejecting it
  // in the component under test behaves the same as the real store.
  toastPromiseMock: vi.fn((promise: Promise<unknown>) => promise),
}));

type TToastPromiseCallArgs = [
  promise: Promise<unknown>,
  messages: { error: (error: unknown) => { message: string } },
];

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

vi.mock('next-auth/react', () => ({ signIn: signInMock }));

vi.mock('@web/server/account/identity-actions', () => ({
  unlinkProviderAction: unlinkProviderActionMock,
}));

vi.mock('@web/components/shared/toast-provider', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    promise: toastPromiseMock,
    dismiss: vi.fn(),
  }),
}));

const setup = customRender(ProviderLinkControl, {
  provider: 'github' as const,
  action: 'link' as const,
});

describe(`<${ProviderLinkControl.name}/>`, () => {
  beforeEach(() => {
    routerRefreshMock.mockReset();
    signInMock.mockReset();
    unlinkProviderActionMock.mockReset();
    toastPromiseMock.mockClear();
    toastPromiseMock.mockImplementation((promise: Promise<unknown>) => promise);
  });

  it('renders the link button copy for the "link" action', () => {
    setup();

    expect(screen.getByRole('button', { name: 'link' })).toBeVisible();
  });

  it('renders the unlink button copy for the "unlink" action', () => {
    setup({ action: 'unlink' });

    expect(screen.getByRole('button', { name: 'unlink' })).toBeVisible();
  });

  it('calls signIn with the provider and the /account redirect on "link"', async () => {
    signInMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'link' }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('github', {
        redirectTo: '/account',
      });
    });
  });

  it('runs unlinkProviderAction through toast.promise and refreshes the router on success', async () => {
    unlinkProviderActionMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    setup({ action: 'unlink' });

    await user.click(screen.getByRole('button', { name: 'unlink' }));

    await waitFor(() => {
      expect(unlinkProviderActionMock).toHaveBeenCalledWith('github');
    });
    await waitFor(() => {
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });

    expect(toastPromiseMock).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: {
          command: 'identity',
          state: 'unlinking',
          message: 'Unlinking your account…',
        },
        success: {
          command: 'identity',
          state: 'unlinked',
          message: 'Account unlinked.',
        },
      }),
    );
  });

  it('does not refresh the router when unlinking fails generically', async () => {
    unlinkProviderActionMock.mockResolvedValue({
      ok: false,
      reason: 'unknown',
    });
    const user = userEvent.setup();
    setup({ action: 'unlink' });

    await user.click(screen.getByRole('button', { name: 'unlink' }));

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'unlink' })).toHaveAttribute(
        'aria-busy',
        'false',
      );
    });
    expect(routerRefreshMock).not.toHaveBeenCalled();

    const [, messages] = toastPromiseMock.mock
      .calls[0] as unknown as TToastPromiseCallArgs;
    expect(messages.error(new Error('unknown')).message).toBe(
      "Couldn't unlink. Try again.",
    );
  });

  it('surfaces a distinct message when the server rejects the last remaining method', async () => {
    unlinkProviderActionMock.mockResolvedValue({
      ok: false,
      reason: 'last-method',
    });
    const user = userEvent.setup();
    setup({ action: 'unlink' });

    await user.click(screen.getByRole('button', { name: 'unlink' }));

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });

    const [, messages] = toastPromiseMock.mock
      .calls[0] as unknown as TToastPromiseCallArgs;
    expect(messages.error(new Error('last-method')).message).toBe(
      "That's your only remaining sign-in method — link another before unlinking this one.",
    );
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it('marks the button aria-busy while the "link" action is pending', async () => {
    let resolveSignIn!: () => void;
    signInMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    const user = userEvent.setup();
    setup();

    const button = screen.getByRole('button', { name: 'link' });
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveSignIn();

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });
});

import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { DeleteAccountControl } from './delete-account-control';

const { signOutMock, deleteAccountActionMock, toastPromiseMock } = vi.hoisted(
  () => ({
    signOutMock: vi.fn(),
    deleteAccountActionMock: vi.fn(),
    // Mirrors the real `toast.promise`'s contract closely enough for these
    // tests: it forwards the given promise unchanged, so awaiting/rejecting
    // it in the component under test behaves the same as the real store.
    toastPromiseMock: vi.fn((promise: Promise<unknown>) => promise),
  }),
);

vi.mock('next-auth/react', () => ({ signOut: signOutMock }));

vi.mock('@web/server/account/account-actions', () => ({
  deleteAccountAction: deleteAccountActionMock,
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

const setup = customRender(DeleteAccountControl, { handle: 'val' });

const armAndClickDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByRole('textbox', {
      name: 'Type your handle to confirm deletion',
    }),
    'val',
  );
  await user.click(screen.getByRole('button', { name: 'delete account' }));
};

describe(`<${DeleteAccountControl.name}/>`, () => {
  beforeEach(() => {
    signOutMock.mockReset();
    deleteAccountActionMock.mockReset();
    toastPromiseMock.mockClear();
    toastPromiseMock.mockImplementation((promise: Promise<unknown>) => promise);
  });

  it('renders the delete button disabled until the typed value matches the handle', async () => {
    const user = userEvent.setup();
    setup();

    const button = screen.getByRole('button', { name: 'delete account' });
    const field = screen.getByRole('textbox', {
      name: 'Type your handle to confirm deletion',
    });
    expect(button).toBeDisabled();

    await user.type(field, 'not-val');
    expect(button).toBeDisabled();

    await user.clear(field);
    await user.type(field, 'val');
    expect(button).toBeEnabled();
  });

  it('arms the button case-insensitively', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(
      screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      }),
      'VAL',
    );

    expect(
      screen.getByRole('button', { name: 'delete account' }),
    ).toBeEnabled();
  });

  it('runs the delete through toast.promise with loading/success/error messages, deletes, signs out, and redirects home', async () => {
    deleteAccountActionMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    setup();

    await armAndClickDelete(user);

    await waitFor(() => {
      expect(deleteAccountActionMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
      command: 'account',
      loading: {
        state: 'deleting',
        message: 'Deleting your account…',
      },
      success: {
        state: 'deleted',
        message: 'Your account has been deleted.',
      },
      error: {
        state: 'failed',
        message: "Couldn't delete your account. Try again.",
      },
    });
  });

  it('marks the delete button aria-busy while the delete is pending, and clears it once settled', async () => {
    let resolveDelete!: (result: { ok: true }) => void;
    deleteAccountActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    );
    const user = userEvent.setup();
    setup();

    const button = screen.getByRole('button', { name: 'delete account' });
    await armAndClickDelete(user);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveDelete({ ok: true });

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });

  it('does not sign out when the delete fails, and the rejection surfaces through toast.promise', async () => {
    deleteAccountActionMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    setup();

    await armAndClickDelete(user);

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'delete account' }),
      ).toHaveAttribute('aria-busy', 'false');
    });
    expect(signOutMock).not.toHaveBeenCalled();
  });
});

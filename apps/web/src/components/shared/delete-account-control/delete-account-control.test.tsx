import { ACTION_OUTCOME } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { IToastPromiseMessages } from '@web/context/toast-provider/toast-store';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { DeleteAccountControl } from './delete-account-control';

const { signOutMock, deleteAccountActionMock, toastPromiseMock } = vi.hoisted(
  () => ({
    signOutMock: vi.fn(),
    deleteAccountActionMock: vi.fn(),
    toastPromiseMock: vi.fn<
      (
        promise: Promise<unknown>,
        messages: IToastPromiseMessages<unknown>,
      ) => Promise<unknown>
    >((promise) => promise),
  }),
);

vi.mock('next-auth/react', () => ({ signOut: signOutMock }));

vi.mock('@web/server/account/account-actions/account-actions', () => ({
  deleteAccountAction: deleteAccountActionMock,
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

const errorMessageFor = (outcome: string) => {
  const [, messages] = toastPromiseMock.mock.calls[0] ?? [];
  const error = messages?.error;
  return typeof error === 'function'
    ? error(new Error(outcome)).message
    : error?.message;
};

const setup = customRender(DeleteAccountControl, { handle: 'val' });

const armAndClickDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByRole('textbox', {
      name: 'Type your handle to confirm deletion',
    }),
    'val',
  );
  await user.click(screen.getByRole('button', { name: 'Delete account' }));
};

describe(`<${DeleteAccountControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    signOutMock.mockReset();
    deleteAccountActionMock.mockReset();
    toastPromiseMock.mockImplementation((promise) => promise);
    user = userEvent.setup();
    setup();
  });

  it('renders the delete button disabled until the typed value matches the handle', async () => {
    const button = screen.getByRole('button', { name: 'Delete account' });
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
    await user.type(
      screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      }),
      'VAL',
    );

    expect(
      screen.getByRole('button', { name: 'Delete account' }),
    ).toBeEnabled();
  });

  it('runs the delete through toast.promise with loading/success/error messages, deletes, signs out, and redirects home', async () => {
    deleteAccountActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    await armAndClickDelete(user);

    await waitFor(() => {
      expect(deleteAccountActionMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
      loading: { message: 'Deleting your account…' },
      success: { message: 'Your account has been deleted.' },
      error: expect.any(Function),
    });
  });

  it('marks the delete button aria-busy while the delete is pending, and clears it once settled', async () => {
    let resolveDelete!: (result: {
      outcome: typeof ACTION_OUTCOME.SUCCESS;
    }) => void;
    deleteAccountActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    );
    const button = screen.getByRole('button', { name: 'Delete account' });
    await armAndClickDelete(user);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveDelete({ outcome: ACTION_OUTCOME.SUCCESS });

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });

  it('does not sign out when the delete fails, and the rejection surfaces through toast.promise', async () => {
    deleteAccountActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    await armAndClickDelete(user);

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete account' }),
      ).toHaveAttribute('aria-busy', 'false');
    });
    expect(signOutMock).not.toHaveBeenCalled();
    expect(errorMessageFor(ACTION_OUTCOME.SERVER_ERROR)).toBe(
      "Couldn't delete your account. Try again.",
    );
  });

  it('explains the refusal and does not sign out when the account holds a platform role', async () => {
    deleteAccountActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    await armAndClickDelete(user);

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete account' }),
      ).toHaveAttribute('aria-busy', 'false');
    });
    expect(signOutMock).not.toHaveBeenCalled();
    expect(errorMessageFor(ACTION_OUTCOME.BLOCKED)).toBe(
      "This account manages a site on the platform, so it can't be deleted here. Ask the platform team to hand the site over first.",
    );
  });
});

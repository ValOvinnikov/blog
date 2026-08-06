import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';

import { DeleteAccountControl } from './delete-account-control';

const { signOutMock, deleteAccountActionMock, toastErrorMock } = vi.hoisted(
  () => ({
    signOutMock: vi.fn(),
    deleteAccountActionMock: vi.fn(),
    toastErrorMock: vi.fn(),
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
    error: toastErrorMock,
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const setup = customRender(DeleteAccountControl, { handle: 'val' });

describe(`<${DeleteAccountControl.name}/>`, () => {
  beforeEach(() => {
    signOutMock.mockReset();
    deleteAccountActionMock.mockReset();
    toastErrorMock.mockReset();
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

  it('deletes, signs out, and redirects home when the armed button is clicked', async () => {
    deleteAccountActionMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    setup();

    await user.type(
      screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      }),
      'val',
    );
    await user.click(screen.getByRole('button', { name: 'delete account' }));

    await waitFor(() => {
      expect(deleteAccountActionMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('shows an error toast and does not sign out when the delete fails', async () => {
    deleteAccountActionMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    setup();

    await user.type(
      screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      }),
      'val',
    );
    await user.click(screen.getByRole('button', { name: 'delete account' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith({
        command: 'account',
        state: 'failed',
        message: "Couldn't delete your account. Try again.",
      });
    });
    expect(signOutMock).not.toHaveBeenCalled();
  });
});

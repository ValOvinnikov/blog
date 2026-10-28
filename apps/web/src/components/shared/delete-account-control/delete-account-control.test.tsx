import { ACTION_OUTCOME, routes, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import { withToastProvider } from '@web/testing/providers';
import { findToastStatus } from '@web/testing/shared/toast/find-toast-status';

import { DeleteAccountControl } from './delete-account-control';

faker.seed(6007);

const { signOutMock, deleteAccountActionMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  deleteAccountActionMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({ signOut: signOutMock }));

vi.mock('@web/server/account/account-actions/account-actions', () => ({
  deleteAccountAction: deleteAccountActionMock,
}));

const {
  deleteConfirmAriaLabel: CONFIRM_FIELD_LABEL,
  deleteButton: DELETE_BUTTON_LABEL,
  deleteToastSuccessMessage: SUCCESS_MESSAGE,
  deleteError: GENERIC_ERROR_MESSAGE,
  deletePlatformRoleError: PLATFORM_ROLE_ERROR_MESSAGE,
} = SITE_MESSAGES.accountPage.privacy;

const MOCK_HANDLE = faker.internet.username();
const MOCK_WRONG_HANDLE = `${MOCK_HANDLE}-${faker.string.alpha(4)}`;

const setup = customRender(withToastProvider(DeleteAccountControl), {
  handle: MOCK_HANDLE,
});

describe(`<${DeleteAccountControl.name}/>`, () => {
  let user: UserEvent;

  const typeHandle = async (value: string) => {
    const confirmField = screen.getByRole('textbox', {
      name: CONFIRM_FIELD_LABEL,
    });
    await user.type(confirmField, value);
  };

  const armAndClickDelete = async () => {
    await typeHandle(MOCK_HANDLE);
    const deleteButton = screen.getByRole('button', {
      name: DELETE_BUTTON_LABEL,
    });
    await user.click(deleteButton);
  };

  beforeEach(() => {
    signOutMock.mockReset();
    deleteAccountActionMock.mockReset();
    user = userEvent.setup();
    setup();
  });

  it('keeps the delete button disabled until the typed value matches the handle', async () => {
    const deleteButton = screen.getByRole('button', {
      name: DELETE_BUTTON_LABEL,
    });
    expect(deleteButton).toBeDisabled();

    await typeHandle(MOCK_WRONG_HANDLE);

    expect(deleteButton).toBeDisabled();
  });

  it.each([
    { casing: 'exact', typed: MOCK_HANDLE },
    { casing: 'upper', typed: MOCK_HANDLE.toUpperCase() },
  ])('arms the delete button for a $casing-case handle', async ({ typed }) => {
    await typeHandle(typed);

    const deleteButton = screen.getByRole('button', {
      name: DELETE_BUTTON_LABEL,
    });

    expect(deleteButton).toBeEnabled();
  });

  it('deletes the account, announces it, signs out and redirects home', async () => {
    deleteAccountActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    await armAndClickDelete();

    const successToast = await findToastStatus();

    expect(successToast).toHaveTextContent(SUCCESS_MESSAGE);
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: routes.home() });
  });

  it('marks the delete button aria-busy only while the delete is pending', async () => {
    let resolveDelete!: (result: { outcome: string }) => void;
    deleteAccountActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    );
    const deleteButton = screen.getByRole('button', {
      name: DELETE_BUTTON_LABEL,
    });
    await armAndClickDelete();
    expect(deleteButton).toHaveAttribute('aria-busy', 'true');

    resolveDelete({ outcome: ACTION_OUTCOME.SUCCESS });

    await findToastStatus();
    expect(deleteButton).not.toHaveAttribute('aria-busy');
  });

  it.each([
    {
      reason: 'the delete fails',
      outcome: ACTION_OUTCOME.SERVER_ERROR,
      message: GENERIC_ERROR_MESSAGE,
    },
    {
      reason: 'the account holds a platform role',
      outcome: ACTION_OUTCOME.BLOCKED,
      message: PLATFORM_ROLE_ERROR_MESSAGE,
    },
  ])(
    'explains the refusal and stays signed in when $reason',
    async ({ outcome, message }) => {
      deleteAccountActionMock.mockResolvedValue({ outcome });
      await armAndClickDelete();

      const errorToast = await screen.findByRole('alert');

      expect(errorToast).toHaveTextContent(message);
      expect(signOutMock).not.toHaveBeenCalled();
    },
  );
});

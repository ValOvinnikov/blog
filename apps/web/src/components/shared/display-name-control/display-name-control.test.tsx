import { ACTION_OUTCOME, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import { withToastProvider } from '@web/testing/providers';
import { useRouter } from 'next/navigation';

import { DisplayNameControl } from './display-name-control';

faker.seed(6007);

const { routerRefreshMock, updateDisplayNameActionMock } = vi.hoisted(() => ({
  routerRefreshMock: vi.fn(),
  updateDisplayNameActionMock: vi.fn(),
}));

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: routerRefreshMock,
} as unknown as ReturnType<typeof useRouter>);

vi.mock('@web/server/account/identity-actions/identity-actions', () => ({
  updateDisplayNameAction: updateDisplayNameActionMock,
}));

const {
  displayNameAriaLabel: NAME_FIELD_LABEL,
  saveButton: SAVE_LABEL,
  saveToastSuccessMessage: SAVE_SUCCESS_MESSAGE,
  saveError: SAVE_ERROR_MESSAGE,
} = SITE_MESSAGES.accountPage.identity;

const MOCK_FIRST_NAME = faker.person.firstName();
const MOCK_LAST_NAME = faker.person.lastName();
const MOCK_NAME = `${MOCK_FIRST_NAME} ${MOCK_LAST_NAME}`;
const MOCK_INITIALS = `${MOCK_FIRST_NAME[0]}${MOCK_LAST_NAME[0]}`.toUpperCase();
const MOCK_EMAIL = faker.internet.email();
const MOCK_NEW_NAME = faker.person.fullName();

const setup = customRender(withToastProvider(DisplayNameControl), {
  initialName: MOCK_NAME,
  email: MOCK_EMAIL,
  image: null,
});

describe(`<${DisplayNameControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    routerRefreshMock.mockReset();
    updateDisplayNameActionMock.mockReset();
    user = userEvent.setup();
    setup();
  });

  it('renders the current display name in the field and avatar initials', () => {
    const nameField = screen.getByRole('textbox', { name: NAME_FIELD_LABEL });
    const initials = screen.getByText(MOCK_INITIALS);
    const promptIcon = screen.getByTestId('display-name-prompt-icon');

    expect(nameField).toHaveValue(MOCK_NAME);
    expect(initials).toBeVisible();
    expect(promptIcon).toBeVisible();
  });

  it('saves the edited name, announces it and refreshes the page', async () => {
    updateDisplayNameActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    const nameField = screen.getByRole('textbox', { name: NAME_FIELD_LABEL });
    const saveButton = screen.getByRole('button', { name: SAVE_LABEL });
    await user.clear(nameField);
    await user.type(nameField, MOCK_NEW_NAME);
    await user.click(saveButton);

    const successToast = await screen.findByRole('status');

    expect(successToast).toHaveTextContent(SAVE_SUCCESS_MESSAGE);
    expect(updateDisplayNameActionMock).toHaveBeenCalledWith(MOCK_NEW_NAME);
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });

  it('disables the save button when the name is cleared to empty', async () => {
    const nameField = screen.getByRole('textbox', { name: NAME_FIELD_LABEL });
    await user.clear(nameField);

    const saveButton = screen.getByRole('button', { name: SAVE_LABEL });

    expect(saveButton).toBeDisabled();
    expect(updateDisplayNameActionMock).not.toHaveBeenCalled();
  });

  it('explains the failure and keeps the page when the save fails', async () => {
    updateDisplayNameActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    const saveButton = screen.getByRole('button', { name: SAVE_LABEL });
    await user.click(saveButton);

    const errorToast = await screen.findByRole('alert');

    expect(errorToast).toHaveTextContent(SAVE_ERROR_MESSAGE);
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });
});

import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_USER } from '@web/testing/pages/account-page/session-user-fixtures';

import { IdentitySection } from './identity-section';

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: { account: { getLinkedProviders: vi.fn() } },
}));

const authMock = vi.mocked(auth as () => Promise<unknown>);
const getLinkedProvidersMock = vi.mocked(queries.account.getLinkedProviders);

const setup = customRenderServerAsync(
  IdentitySection,
  {},
  { wrapper: ToastProvider },
);

const SECTION_HEADING = 'Connected accounts';
faker.seed(5960);

const MOCK_HANDLE = faker.internet.username();
const MOCK_NAMELESS_USER = {
  ...MOCK_ACCOUNT_USER,
  name: null,
  email: `${MOCK_HANDLE}@${faker.internet.domainName()}`,
};
const DISPLAY_NAME_LABEL = 'Display name';
const LAST_METHOD_NOTE = "Last remaining method — can't unlink";

describe(`<${IdentitySection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: MOCK_ACCOUNT_USER,
    });
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await setup();

    const sectionHeading = screen.queryByRole('heading', {
      name: SECTION_HEADING,
    });

    expect(sectionHeading).not.toBeInTheDocument();
    expect(getLinkedProvidersMock).not.toHaveBeenCalled();
  });

  it('reads the linked providers of the signed-in user', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    const sectionHeading = screen.getByRole('heading', {
      level: 2,
      name: SECTION_HEADING,
    });

    expect(getLinkedProvidersMock).toHaveBeenCalledWith(MOCK_ACCOUNT_USER.id);
    expect(sectionHeading).toBeVisible();
  });

  it('offers to unlink each linked provider that is not the last method', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: true,
      emailLink: false,
    });

    await setup();

    const unlinkButtons = screen.getAllByRole('button', { name: 'Unlink' });
    const linkButton = screen.queryByRole('button', { name: 'Link' });

    expect(unlinkButtons).toHaveLength(2);
    expect(linkButton).not.toBeInTheDocument();
  });

  it('offers to link a provider that is not linked', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: true,
      emailLink: true,
    });

    await setup();

    const linkButton = screen.getByRole('button', { name: 'Link' });

    expect(linkButton).toBeVisible();
  });

  describe('with GitHub as the only linked method', () => {
    beforeEach(() => {
      getLinkedProvidersMock.mockResolvedValue({
        github: true,
        google: false,
        emailLink: false,
      });
    });

    it('shows the last-method notice instead of a control for the sole method', async () => {
      await setup();

      const lastMethodNote = screen.getByText(LAST_METHOD_NOTE);
      const unlinkButton = screen.queryByRole('button', { name: 'Unlink' });

      expect(lastMethodNote).toBeVisible();
      expect(unlinkButton).not.toBeInTheDocument();
    });

    it('prefills the display-name field with the session name', async () => {
      await setup();

      const displayNameTextbox = screen.getByRole('textbox', {
        name: DISPLAY_NAME_LABEL,
      });
      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(displayNameTextbox).toHaveValue(MOCK_ACCOUNT_USER.name);
      expect(saveButton).toBeVisible();
    });
  });

  it('shows the last-method notice when email link is the only method', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: false,
      emailLink: true,
    });

    await setup();

    const lastMethodNote = screen.getByText(LAST_METHOD_NOTE);

    expect(lastMethodNote).toBeVisible();
  });

  it('prefills the display-name field with the handle when the reader has no name', async () => {
    authMock.mockResolvedValue({ user: MOCK_NAMELESS_USER });
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: false,
      emailLink: true,
    });
    await setup();
    const displayNameTextbox = screen.getByRole('textbox', {
      name: DISPLAY_NAME_LABEL,
    });
    expect(displayNameTextbox).toHaveValue(MOCK_HANDLE);
  });
});

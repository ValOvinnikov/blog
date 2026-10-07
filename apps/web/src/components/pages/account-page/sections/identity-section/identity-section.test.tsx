import { queries } from '@blog/db';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';

import { IdentitySection } from './identity-section';

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: { account: { getLinkedProviders: vi.fn() } },
}));

vi.mock('@web/utils/logger/logger');

const authMock = vi.mocked(auth as () => Promise<unknown>);
const getLinkedProvidersMock = vi.mocked(queries.account.getLinkedProviders);

const setup = customRenderServerAsync(
  IdentitySection,
  {},
  { wrapper: ToastProvider },
);

describe(`<${IdentitySection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@icloud.com' },
    });
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Connected accounts' }),
    ).not.toBeInTheDocument();
    expect(getLinkedProvidersMock).not.toHaveBeenCalled();
  });

  it('reads the linked providers of the signed-in user', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(getLinkedProvidersMock).toHaveBeenCalledWith('user-1');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Connected accounts' }),
    ).toBeVisible();
  });

  it('offers to unlink each linked provider that is not the last method', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: true,
      emailLink: false,
    });

    await setup();

    expect(screen.getAllByRole('button', { name: 'Unlink' })).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Link' }),
    ).not.toBeInTheDocument();
  });

  it('offers to link a provider that is not linked', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: true,
      emailLink: true,
    });

    await setup();

    expect(screen.getByRole('button', { name: 'Link' })).toBeVisible();
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

      expect(
        screen.getByText("Last remaining method — can't unlink"),
      ).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Unlink' }),
      ).not.toBeInTheDocument();
    });

    it('prefills the display-name field with the session name', async () => {
      await setup();

      expect(screen.getByRole('textbox', { name: 'Display name' })).toHaveValue(
        'Jane Doe',
      );
      expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
    });
  });

  it('shows the last-method notice when email link is the only method', async () => {
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(
      screen.getByText("Last remaining method — can't unlink"),
    ).toBeVisible();
  });
});

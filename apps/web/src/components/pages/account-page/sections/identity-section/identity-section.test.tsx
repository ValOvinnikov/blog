import { customRenderAsync, screen } from '@web/testing/custom-render';

import { IdentitySection } from './identity-section';

const { authMock, getLinkedProvidersMock, getChromeOnMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getLinkedProvidersMock: vi.fn(),
    getChromeOnMock: vi.fn(),
  }),
);

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    account: { getLinkedProviders: getLinkedProvidersMock },
  },
}));

vi.mock('@web/utils/get-chrome-on', () => ({
  getChromeOn: getChromeOnMock,
}));

vi.mock('@web/components/shared/provider-link-control', () => ({
  ProviderLinkControl: ({
    provider,
    action,
  }: {
    provider: string;
    action: string;
  }) => <div data-testid={`provider-link-control-${provider}`}>{action}</div>,
}));

vi.mock('@web/components/shared/display-name-control', () => ({
  DisplayNameControl: ({ initialName }: { initialName: string }) => (
    <div data-testid="display-name-control">{initialName}</div>
  ),
}));

const setup = customRenderAsync(IdentitySection, {});

const authedSession = {
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@icloud.com' },
};

describe(`<${IdentitySection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getLinkedProvidersMock.mockReset();
    getChromeOnMock.mockReset();
    getChromeOnMock.mockResolvedValue(true);
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getLinkedProvidersMock).not.toHaveBeenCalled();
  });

  it('calls getLinkedProviders with the signed-in user id and renders the derived handle', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(getLinkedProvidersMock).toHaveBeenCalledWith('user-1');
    expect(screen.getByText(/Connected accounts/)).toBeVisible();
  });

  it('shows an unlink control for a linked provider that is not the last method', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: true,
      emailLink: false,
    });

    await setup();

    expect(
      screen.getByTestId('provider-link-control-github'),
    ).toHaveTextContent('unlink');
    expect(
      screen.getByTestId('provider-link-control-google'),
    ).toHaveTextContent('unlink');
  });

  it('shows a link control for a provider that is not linked', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: true,
      emailLink: true,
    });

    await setup();

    expect(
      screen.getByTestId('provider-link-control-github'),
    ).toHaveTextContent('link');
  });

  it('replaces the control with a last-method notice for the sole remaining linked method', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: false,
    });

    await setup();

    expect(
      screen.queryByTestId('provider-link-control-github'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Last remaining method — can't unlink"),
    ).toBeVisible();
  });

  it('applies the last-method notice to email link too when it is the only linked method', async () => {
    authMock.mockResolvedValue(authedSession);
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

  it('renders the display-name control with the session name', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: false,
    });

    await setup();

    expect(screen.getByTestId('display-name-control')).toHaveTextContent(
      'Jane Doe',
    );
  });
});

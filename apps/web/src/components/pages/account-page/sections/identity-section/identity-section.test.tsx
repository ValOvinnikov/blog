import { customRenderAsync, screen } from '@web/testing/custom-render';

import { IdentitySection } from './identity-section';

const { authMock, getLinkedProvidersMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getLinkedProvidersMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    account: { getLinkedProviders: getLinkedProvidersMock },
  },
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
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getLinkedProvidersMock).not.toHaveBeenCalled();
  });

  it('renders the 6c window with the derived handle', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(screen.getByText('~$')).toBeVisible();
    expect(screen.getByText(/account --identities/)).toBeVisible();
    expect(getLinkedProvidersMock).toHaveBeenCalledWith('user-1');
  });

  it('shows unlink controls for linked providers that are not the last method', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: true,
      emailLink: false,
    });

    await setup();

    expect(screen.getAllByText('✓ linked')).toHaveLength(2);
    expect(
      screen.getByTestId('provider-link-control-github'),
    ).toHaveTextContent('unlink');
    expect(
      screen.getByTestId('provider-link-control-google'),
    ).toHaveTextContent('unlink');
  });

  it('renders the bar as a level-2 heading', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
  });

  it('renders each provider name as a level-3 heading, keeping the rows in the page heading outline', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 3, name: 'GitHub' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Google' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Email link' }),
    ).toBeVisible();
  });

  it('shows no status text for a provider that is not linked', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: true,
      emailLink: true,
    });

    await setup();

    expect(screen.queryByText(/not linked/)).not.toBeInTheDocument();
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

  it('replaces the unlink control with a static notice for the last remaining linked method', async () => {
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
    const linkedStatus = screen.getByText('✓ linked');
    const notice = screen.getByText("last remaining method — can't unlink");
    expect(notice).toBeVisible();
    expect(
      linkedStatus.compareDocumentPosition(notice) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows the last-method notice for email link when it is the only linked method', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: false,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(
      screen.getByText("last remaining method — can't unlink"),
    ).toBeVisible();
  });

  it('shows no action for email link when it is linked but not the last method', async () => {
    authMock.mockResolvedValue(authedSession);
    getLinkedProvidersMock.mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });

    await setup();

    expect(
      screen.queryByText("last remaining method — can't unlink"),
    ).not.toBeInTheDocument();
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

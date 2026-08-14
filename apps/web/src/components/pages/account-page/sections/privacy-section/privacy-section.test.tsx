import { customRenderAsync, screen } from '@web/testing/custom-render';

import { PrivacySection } from './privacy-section';

const { authMock, getChromeOnMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getChromeOnMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/utils/get-chrome-on', () => ({
  getChromeOn: getChromeOnMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@web/components/shared/delete-account-control', () => ({
  DeleteAccountControl: ({ handle }: { handle: string }) => (
    <div data-testid="delete-account-control">{handle}</div>
  ),
}));

const setup = customRenderAsync(PrivacySection, {});

describe(`<${PrivacySection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getChromeOnMock.mockReset();
    getChromeOnMock.mockResolvedValue(true);
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the 6a privacy & data window', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    });

    await setup();

    expect(screen.getByText(/Privacy/)).toBeVisible();
    // The session's email local part ("jane") is the derived handle, shown
    // both in the window's user segment and passed to the delete control.
    expect(screen.getAllByText('jane').length).toBeGreaterThan(0);
  });

  it('renders the bar as a level-2 heading', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    });

    await setup();

    expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
  });

  it('renders the export-my-data row as a download link to the export route', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    });

    await setup();

    const exportLink = screen.getByRole('link', {
      name: 'Request export',
    });
    expect(exportLink).toHaveAttribute('href', '/api/account/export');
    expect(exportLink).toHaveAttribute('download');
  });

  it('renders the delete-account row with the derived handle passed to the control', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    });

    await setup();

    expect(screen.getByText('Delete account')).toBeVisible();
    expect(screen.getByTestId('delete-account-control')).toHaveTextContent(
      'jane',
    );
  });

  describe('plain (chromeOn: false)', () => {
    beforeEach(() => {
      getChromeOnMock.mockResolvedValue(false);
    });

    it('renders a plain section heading + card, dropping the WindowChrome.Tag pill', async () => {
      authMock.mockResolvedValue({
        user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
      });

      await setup();

      expect(
        screen.getByRole('heading', { level: 2, name: 'Privacy' }),
      ).toBeVisible();
      const exportLink = screen.getByRole('link', { name: 'Request export' });
      expect(exportLink).toHaveAttribute('href', '/api/account/export');
      expect(screen.getByText('Delete account')).toBeVisible();
    });
  });
});

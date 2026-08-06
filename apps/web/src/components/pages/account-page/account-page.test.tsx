import { customRenderAsync, screen } from '@web/testing/custom-render';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

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

const setup = customRenderAsync(AccountPage, {});

describe(`<${AccountPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('redirects home when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  it('renders the page heading and the 6a privacy & data window', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Val Ovinnikov', email: 'val@example.com' },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Account' }),
    ).toBeVisible();
    expect(screen.getByText('~$')).toBeVisible();
    expect(screen.getByText(/account --privacy/)).toBeVisible();
    expect(screen.getByText('data')).toBeVisible();
    // The session's email local part ("val") is the derived handle, shown
    // both in the window's user segment and passed to the delete control.
    expect(screen.getAllByText('val').length).toBeGreaterThan(0);
  });

  it('renders the export-my-data row as a download link to the export route', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Val Ovinnikov', email: 'val@example.com' },
    });

    await setup();

    const exportLink = screen.getByRole('link', {
      name: '↓ request export',
    });
    expect(exportLink).toHaveAttribute('href', '/api/account/export');
    expect(exportLink).toHaveAttribute('download');
  });

  it('renders the delete-account row with the derived handle passed to the control', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Val Ovinnikov', email: 'val@example.com' },
    });

    await setup();

    expect(screen.getByText('⚠ Delete account')).toBeVisible();
    expect(screen.getByTestId('delete-account-control')).toHaveTextContent(
      'val',
    );
  });
});

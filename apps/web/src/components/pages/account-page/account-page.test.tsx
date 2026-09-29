import { queries } from '@blog/db';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: {
    account: { getLinkedProviders: vi.fn() },
    subscribers: { getSubscriptionStatus: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/get-request-tenant-id');

vi.mock('@web/i18n/navigation');

vi.mock('@web/utils/logger/logger');

const authMock = vi.mocked(auth as () => Promise<unknown>);

const setup = customRenderServerAsync(
  AccountPage,
  {},
  { wrapper: ToastProvider },
);

describe(`<${AccountPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    });
    vi.mocked(queries.account.getLinkedProviders).mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });
    vi.mocked(queries.subscribers.getSubscriptionStatus).mockResolvedValue({
      outcome: 'active',
      subscriber: { email: 'jane@example.com' },
    } as Awaited<ReturnType<typeof queries.subscribers.getSubscriptionStatus>>);
  });

  it('redirects home when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  it('renders the three sections under the page heading, in order', async () => {
    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Account' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Connected accounts', 'Newsletter', 'Privacy']);
  });

  it('omits the newsletter section when the account is not subscribed', async () => {
    vi.mocked(queries.subscribers.getSubscriptionStatus).mockResolvedValueOnce({
      outcome: 'not-subscribed',
    });

    await setup();

    expect(
      screen.queryByRole('heading', { level: 2, name: 'Newsletter' }),
    ).not.toBeInTheDocument();
  });

  it('arms account deletion with the handle derived from the session', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(
      screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      }),
      'jane',
    );

    expect(
      screen.getByRole('button', { name: 'Delete account' }),
    ).toBeEnabled();
  });
});

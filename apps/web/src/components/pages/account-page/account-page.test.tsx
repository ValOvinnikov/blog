import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { queries } from '@blog/db';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_USER } from '@web/testing/pages/account-page/session-user-fixtures';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: {
    account: { getLinkedProviders: vi.fn() },
    subscribers: { getSubscriptionStatus: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/i18n/navigation');

const authMock = vi.mocked(auth as () => Promise<unknown>);

const setup = customRenderServerAsync(
  AccountPage,
  {},
  { wrapper: ToastProvider },
);

describe(`<${AccountPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: MOCK_ACCOUNT_USER,
    });
    vi.mocked(queries.account.getLinkedProviders).mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });
    vi.mocked(queries.subscribers.getSubscriptionStatus).mockResolvedValue({
      outcome: 'active',
      subscriber: { email: MOCK_ACCOUNT_USER.email },
    } as Awaited<ReturnType<typeof queries.subscribers.getSubscriptionStatus>>);
  });

  it('redirects home when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
  });

  describe('with an active subscription', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the three sections under the page heading, in order', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Account' }),
      ).toBeVisible();
      expect(
        screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
      ).toEqual(['Connected accounts', 'Newsletter', 'Privacy']);
    });

    it('arms account deletion with the handle derived from the session', async () => {
      const user = userEvent.setup();

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

  it('omits the newsletter section when the account is not subscribed', async () => {
    vi.mocked(queries.subscribers.getSubscriptionStatus).mockResolvedValueOnce({
      outcome: 'not-subscribed',
    });

    await setup();

    expect(
      screen.queryByRole('heading', { level: 2, name: 'Newsletter' }),
    ).not.toBeInTheDocument();
  });
});

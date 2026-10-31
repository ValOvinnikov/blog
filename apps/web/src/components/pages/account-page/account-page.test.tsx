import { routes, SUBSCRIBER_OUTCOME } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { queries } from '@blog/db';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_USER } from '@web/testing/pages/account-page/session-user-fixtures';
import { mockSession } from '@web/testing/shared/session/fixtures';
import { mockedAuth } from '@web/testing/shared/session/mocked-auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    account: { getLinkedProviders: vi.fn() },
    subscribers: { getSubscriptionStatus: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/i18n/navigation');

const MOCK_HANDLE = toSessionUsername(
  MOCK_ACCOUNT_USER.name,
  MOCK_ACCOUNT_USER.email,
);
const PAGE_TITLE = 'Account';
const IDENTITY_TITLE = 'Connected accounts';
const NEWSLETTER_TITLE = 'Newsletter';
const PRIVACY_TITLE = 'Privacy';

const authMock = mockedAuth();

const setup = customRenderServerAsync(
  AccountPage,
  {},
  { wrapper: ToastProvider },
);

describe(`<${AccountPage.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    authMock.mockResolvedValue(mockSession({ user: MOCK_ACCOUNT_USER }));
    vi.mocked(queries.account.getLinkedProviders).mockResolvedValue({
      github: true,
      google: false,
      emailLink: true,
    });
    vi.mocked(queries.subscribers.getSubscriptionStatus).mockResolvedValue({
      outcome: SUBSCRIBER_STATUS.ACTIVE,
    });
  });

  it('redirects home when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(routes.home());
  });

  describe('with an active subscription', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the three sections under the page heading', () => {
      const pageHeading = screen.getByRole('heading', {
        level: 1,
        name: PAGE_TITLE,
      });
      const identityHeading = screen.getByRole('heading', {
        level: 2,
        name: IDENTITY_TITLE,
      });
      const newsletterHeading = screen.getByRole('heading', {
        level: 2,
        name: NEWSLETTER_TITLE,
      });
      const privacyHeading = screen.getByRole('heading', {
        level: 2,
        name: PRIVACY_TITLE,
      });

      expect(pageHeading).toBeVisible();
      expect(identityHeading).toBeVisible();
      expect(newsletterHeading).toBeVisible();
      expect(privacyHeading).toBeVisible();
    });

    it('arms account deletion with the handle derived from the session', async () => {
      const handleTextbox = screen.getByRole('textbox', {
        name: 'Type your handle to confirm deletion',
      });
      await user.type(handleTextbox, MOCK_HANDLE);

      const deleteAccountButton = screen.getByRole('button', {
        name: 'Delete account',
      });

      expect(deleteAccountButton).toBeEnabled();
    });
  });

  it('omits the newsletter section when the account is not subscribed', async () => {
    vi.mocked(queries.subscribers.getSubscriptionStatus).mockResolvedValueOnce({
      outcome: SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED,
    });

    await setup();

    const newsletterHeading = screen.queryByRole('heading', {
      level: 2,
      name: NEWSLETTER_TITLE,
    });

    expect(newsletterHeading).not.toBeInTheDocument();
  });
});

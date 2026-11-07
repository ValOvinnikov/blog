import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { routes, SUBSCRIBER_OUTCOME } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { queries } from '@blog/db';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ToastProvider } from '@web/context/toast-provider';
import { getHostSiteOAuthCredentials } from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_USER } from '@web/testing/pages/account-page/session-user-fixtures';
import { MOCK_SITE_OAUTH_CREDENTIALS } from '@web/testing/server/auth/site-oauth-credentials-fixtures';
import { mockRequestContextOnce } from '@web/testing/server/request-context/mock-request-context-once';
import { mockSession } from '@web/testing/shared/session/fixtures';
import { mockedAuth } from '@web/testing/shared/session/mocked-auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { redirect } from 'next/navigation';

import { AccountPage } from './account-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/auth/auth');

vi.mock('@web/server/auth/site-oauth-credentials/site-oauth-credentials');

vi.mock('@blog/db', () => ({
  queries: {
    account: { getLinkedProviders: vi.fn() },
    subscribers: { getSubscriptionStatus: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@web/i18n/navigation');

vi.mock('@blog/auth/utils/oauth-providers/oauth-providers', () => ({
  getEnabledOAuthProviderIds: vi.fn(() => []),
}));

const MOCK_HANDLE = toSessionUsername(
  MOCK_ACCOUNT_USER.name,
  MOCK_ACCOUNT_USER.email,
);
const PAGE_TITLE = 'Account';
const IDENTITY_TITLE = 'Connected accounts';
const NEWSLETTER_TITLE = 'Newsletter';
const PRIVACY_TITLE = 'Privacy';
const SEND_SIGN_IN_LINK = 'Email me a sign-in link';

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

  describe('on an operator-suspended site with no session', () => {
    beforeEach(async () => {
      authMock.mockResolvedValue(null);
      mockRequestContextOnce({ isOperatorSuspended: true });
      vi.mocked(getHostSiteOAuthCredentials).mockResolvedValueOnce(
        MOCK_SITE_OAUTH_CREDENTIALS,
      );
      await setup();
    });

    it("advertises the providers the request's host registers", () => {
      expect(vi.mocked(getEnabledOAuthProviderIds)).toHaveBeenCalledWith(
        MOCK_SITE_OAUTH_CREDENTIALS,
      );
    });

    it('offers sign-in under the page heading', () => {
      const pageHeading = screen.getByRole('heading', {
        level: 1,
        name: PAGE_TITLE,
      });
      const sendLinkButton = screen.getByRole('button', {
        name: SEND_SIGN_IN_LINK,
      });

      expect(pageHeading).toBeInTheDocument();
      expect(sendLinkButton).toBeInTheDocument();
      expect(vi.mocked(redirect)).not.toHaveBeenCalled();
    });

    it('shows none of the account sections', () => {
      const privacyHeading = screen.queryByRole('heading', {
        name: PRIVACY_TITLE,
      });

      expect(privacyHeading).not.toBeInTheDocument();
    });
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

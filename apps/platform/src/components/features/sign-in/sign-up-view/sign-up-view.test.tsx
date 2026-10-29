import { OAUTH_PROVIDER_IDS } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ACTION_OUTCOME } from '@blog/config';
import { sendSignInLinkAction } from '@platform/server/auth/send-sign-in-link-action';
import { signInWithProviderAction } from '@platform/server/auth/sign-in-with-provider-action';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SignUpView } from './sign-up-view';

vi.mock('@platform/server/auth/sign-in-with-provider-action', () => ({
  signInWithProviderAction: vi.fn(),
}));

vi.mock('@platform/server/auth/send-sign-in-link-action', () => ({
  sendSignInLinkAction: vi.fn(),
}));

const [GITHUB_PROVIDER_ID] = OAUTH_PROVIDER_IDS;
const MOCK_LEGAL_PAGE_URLS = toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN);
const GITHUB_BUTTON = { name: 'Continue with GitHub' };
const EMAIL_FIELD = { name: 'Email address' };

const setup = customRender(SignUpView, {
  providerIds: OAUTH_PROVIDER_IDS,
  legalPageUrls: MOCK_LEGAL_PAGE_URLS,
});

describe(`<${SignUpView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with every provider and the legal pages on the apex', () => {
    beforeEach(() => {
      setup();
    });

    it('titles the page and offers every way to sign up, with no terms checkbox', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Create an account',
      });
      const github = screen.getByRole('button', GITHUB_BUTTON);
      const email = screen.getByRole('textbox', EMAIL_FIELD);
      const checkbox = screen.queryByRole('checkbox');

      expect(heading).toBeVisible();
      expect(github).toBeVisible();
      expect(email).toBeVisible();
      expect(checkbox).not.toBeInTheDocument();
    });

    it('links the terms and privacy policy the visitor agrees to', () => {
      const terms = screen.getByRole('link', {
        name: 'Terms of Service (opens in new tab)',
      });
      const privacy = screen.getByRole('link', {
        name: 'Privacy Policy (opens in new tab)',
      });

      expect(terms).toHaveAttribute('href', MOCK_LEGAL_PAGE_URLS?.terms);
      expect(privacy).toHaveAttribute('href', MOCK_LEGAL_PAGE_URLS?.privacy);
    });

    it('points a returning visitor at sign-in', () => {
      const signIn = screen.getByRole('link', { name: 'Sign in' });

      expect(signIn).toHaveAttribute('href', adminRoutes.signIn());
    });

    it('starts a provider sign-up that lands home', async () => {
      const github = screen.getByRole('button', GITHUB_BUTTON);

      await user.click(github);

      expect(signInWithProviderAction).toHaveBeenCalledWith({
        providerId: GITHUB_PROVIDER_ID,
        callbackPath: adminRoutes.home(),
        isSignUp: true,
      });
    });

    it('sends a sign-up link that lands home', async () => {
      vi.mocked(sendSignInLinkAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      const email = screen.getByRole('textbox', EMAIL_FIELD);
      const send = screen.getByRole('button', {
        name: 'Email me a sign-in link',
      });

      await user.type(email, MOCK_SIGN_IN_EMAIL);
      await user.click(send);

      expect(sendSignInLinkAction).toHaveBeenCalledWith({
        email: MOCK_SIGN_IN_EMAIL,
        callbackPath: adminRoutes.home(),
        isSignUp: true,
      });
    });
  });

  it('names the policies without links when there are no pages to link to', () => {
    setup({ legalPageUrls: undefined });

    const terms = screen.queryByRole('link', { name: /Terms of Service/ });
    const agreement = screen.getByText(/By continuing, you agree to the/);

    expect(terms).not.toBeInTheDocument();
    expect(agreement).toHaveTextContent('Terms of Service');
  });
});

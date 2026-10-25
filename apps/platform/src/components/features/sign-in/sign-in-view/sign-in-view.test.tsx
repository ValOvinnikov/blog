import { OAUTH_PROVIDER_IDS } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { SIGN_IN_ERROR } from '@platform/constants/sign-in';
import { signInWithProviderAction } from '@platform/server/auth/sign-in-with-provider-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent from '@testing-library/user-event';

import { SignInView } from './sign-in-view';

vi.mock('@platform/server/auth/sign-in-with-provider-action', () => ({
  signInWithProviderAction: vi.fn(),
}));

vi.mock('@platform/server/auth/send-sign-in-link-action', () => ({
  sendSignInLinkAction: vi.fn(),
}));

const [GITHUB_PROVIDER_ID, GOOGLE_PROVIDER_ID] = OAUTH_PROVIDER_IDS;
const MOCK_GITHUB_BUTTON = { name: 'Continue with GitHub' };
const MOCK_GOOGLE_BUTTON = { name: 'Continue with Google' };

const setup = customRender(SignInView, {
  providerIds: OAUTH_PROVIDER_IDS,
  callbackPath: adminRoutes.dashboard(),
  error: undefined,
});

describe(`<${SignInView.name}/>`, () => {
  describe('with every provider and no error', () => {
    beforeEach(() => {
      setup();
    });

    it('titles the page and offers every configured way to sign in', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Sign in',
      });
      const github = screen.getByRole('button', MOCK_GITHUB_BUTTON);
      const google = screen.getByRole('button', MOCK_GOOGLE_BUTTON);
      const email = screen.getByRole('textbox', { name: 'Email address' });

      expect(heading).toBeVisible();
      expect(github).toBeVisible();
      expect(google).toBeVisible();
      expect(email).toBeVisible();
    });

    it('points a new visitor at sign-up', () => {
      const signUp = screen.getByRole('link', { name: 'Create an account' });

      expect(signUp).toHaveAttribute('href', adminRoutes.signUp());
    });

    it('shows no error when the sign-in has not failed', () => {
      const alert = screen.queryByRole('alert');

      expect(alert).not.toBeInTheDocument();
    });
  });

  it('offers only the email link when no provider is configured', () => {
    setup({ providerIds: [] });

    const github = screen.queryByRole('button', MOCK_GITHUB_BUTTON);
    const send = screen.getByRole('button', {
      name: 'Email me a sign-in link',
    });

    expect(github).not.toBeInTheDocument();
    expect(send).toBeVisible();
  });

  it('starts the chosen provider sign-in for the requested page', async () => {
    const user = userEvent.setup();
    setup({ providerIds: [GITHUB_PROVIDER_ID, GOOGLE_PROVIDER_ID] });

    const google = screen.getByRole('button', MOCK_GOOGLE_BUTTON);

    await user.click(google);

    expect(signInWithProviderAction).toHaveBeenCalledWith({
      providerId: GOOGLE_PROVIDER_ID,
      callbackPath: adminRoutes.dashboard(),
    });
  });

  it('explains an email already linked to another sign-in method', () => {
    setup({ error: SIGN_IN_ERROR.ACCOUNT_NOT_LINKED });

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(
      'This email already signs in another wayYour email address is already used with a different sign-in method. Sign in the way you did before.',
    );
  });

  it('explains a sign-in that failed for another reason', () => {
    setup({ error: SIGN_IN_ERROR.SIGN_IN_FAILED });

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent(
      "We couldn't sign you inSomething went wrong while signing you in. Try again, or choose another way to sign in.",
    );
  });
});

import { SIGN_IN_ERROR } from '@platform/constants/sign-in';
import { signInWithProviderAction } from '@platform/server/auth/sign-in-with-provider-action';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SignInView } from './sign-in-view';

vi.mock('@platform/server/auth/sign-in-with-provider-action', () => ({
  signInWithProviderAction: vi.fn(),
}));

vi.mock('@platform/server/auth/send-sign-in-link-action', () => ({
  sendSignInLinkAction: vi.fn(),
}));

const MOCK_CALLBACK_PATH = '/dashboard';
const GITHUB_BUTTON = { name: 'Continue with GitHub' };
const GOOGLE_BUTTON = { name: 'Continue with Google' };

const setup = customRender(SignInView, {
  providerIds: ['github', 'google'],
  callbackPath: MOCK_CALLBACK_PATH,
  error: undefined,
});

describe(`<${SignInView.name}/>`, () => {
  it('titles the page and offers every configured way to sign in', () => {
    setup();

    const heading = screen.getByRole('heading', { level: 1, name: 'Sign in' });
    const github = screen.getByRole('button', GITHUB_BUTTON);
    const google = screen.getByRole('button', GOOGLE_BUTTON);
    const email = screen.getByRole('textbox', { name: 'Email address' });

    expect(heading).toBeVisible();
    expect(github).toBeVisible();
    expect(google).toBeVisible();
    expect(email).toBeVisible();
  });

  it('offers only the email link when no provider is configured', () => {
    setup({ providerIds: [] });

    const github = screen.queryByRole('button', GITHUB_BUTTON);
    const send = screen.getByRole('button', {
      name: 'Email me a sign-in link',
    });

    expect(github).not.toBeInTheDocument();
    expect(send).toBeVisible();
  });

  it('starts the chosen provider sign-in for the requested page', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', GOOGLE_BUTTON));

    expect(signInWithProviderAction).toHaveBeenCalledWith({
      providerId: 'google',
      callbackPath: MOCK_CALLBACK_PATH,
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

  it('shows no error when the sign-in has not failed', () => {
    setup();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

import { HTTP_STATUS, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { SESSION_STATUS } from '@web/constants/session';
import { customRender, screen, within } from '@web/testing/custom-render';
import { SIGNED_IN_HINT_COOKIE_NAME } from '@web/utils/signed-in-hint-cookie';

import { AuthMenu } from './auth-menu';

faker.seed(6007);

const { useSessionMock, signInMock, signOutMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: signInMock,
  signOut: signOutMock,
}));

const PROVIDER = { GITHUB: 'github', GOOGLE: 'google' } as const;
const {
  signIn: SIGN_IN_LABEL,
  accountMenuAriaLabel: ACCOUNT_MENU_LABEL,
  signOut: SIGN_OUT_LABEL,
  continueWithGithub: GITHUB_ITEM,
  continueWithGoogle: GOOGLE_ITEM,
  continueWithEmail: EMAIL_ITEM,
  emailAriaLabel: EMAIL_FIELD,
  sendLink: SEND_LINK_LABEL,
  checkYourInbox: CHECK_YOUR_INBOX,
  emailError: EMAIL_ERROR,
  oauthError: OAUTH_ERROR,
} = SITE_MESSAGES.authMenu;

const MOCK_NAME = faker.person.fullName();
const MOCK_EMAIL = faker.internet.email();
const MOCK_READER_EMAIL = faker.internet.email();
const MOCK_SESSION_EXPIRES = '2099-01-01T00:00:00.000Z';
const MOCK_OAUTH_ERROR = faker.string.alpha(12);

const setup = customRender(AuthMenu, {
  oauthProviderIds: [PROVIDER.GITHUB, PROVIDER.GOOGLE],
});

const setLocationSearch = (search: string) => {
  window.history.replaceState(null, '', `/${search}`);
};

const hasSignedInHint = () =>
  document.cookie.split('; ').includes(`${SIGNED_IN_HINT_COOKIE_NAME}=1`);

const mockSession = (status: string, data: object | null = null) =>
  useSessionMock.mockReturnValue({ data, status });

const mockSignInResult = (ok: boolean, httpStatus: number) =>
  signInMock.mockResolvedValue({
    ok,
    error: ok ? undefined : 'EmailSignin',
    code: undefined,
    status: httpStatus,
    url: null,
  });

describe(`<${AuthMenu.name}/>`, () => {
  let user: UserEvent;

  const openSignInMenu = async () => {
    const trigger = screen.getByRole('button', { name: SIGN_IN_LABEL });
    await user.click(trigger);
  };

  const openEmailForm = async () => {
    await openSignInMenu();
    const emailItem = screen.getByRole('menuitem', { name: EMAIL_ITEM });
    await user.click(emailItem);
  };

  beforeEach(() => {
    user = userEvent.setup();
    useSessionMock.mockReset();
    signInMock.mockReset();
    signOutMock.mockReset();
    setLocationSearch('');
    document.cookie = `${SIGNED_IN_HINT_COOKIE_NAME}=; Max-Age=0; Path=/`;
  });

  describe('while the session is resolving', () => {
    beforeEach(() => {
      mockSession(SESSION_STATUS.LOADING);
      setup();
    });

    it('renders no accessible button', () => {
      const button = screen.queryByRole('button');

      expect(button).not.toBeInTheDocument();
    });

    it('announces the loading status without exposing the sign-in label', () => {
      const status = screen.getByRole('status', {
        name: SITE_MESSAGES.authMenu.loadingAccountStatus,
      });

      expect(status).toBeVisible();
      expect(status).not.toHaveTextContent(SIGN_IN_LABEL);
    });
  });

  describe('logged out', () => {
    beforeEach(() => {
      mockSession(SESSION_STATUS.UNAUTHENTICATED);
    });

    it.each([
      {
        title: 'every provider is enabled',
        providers: [PROVIDER.GITHUB, PROVIDER.GOOGLE],
        itemNames: [GITHUB_ITEM, GOOGLE_ITEM, EMAIL_ITEM],
      },
      {
        title: 'only GitHub is enabled',
        providers: [PROVIDER.GITHUB],
        itemNames: [GITHUB_ITEM, EMAIL_ITEM],
      },
      {
        title: 'only Google is enabled',
        providers: [PROVIDER.GOOGLE],
        itemNames: [GOOGLE_ITEM, EMAIL_ITEM],
      },
      {
        title: 'no OAuth provider is enabled',
        providers: [],
        itemNames: [EMAIL_ITEM],
      },
    ])(
      'offers exactly the enabled sign-in items when $title',
      async ({ providers, itemNames }) => {
        setup({ oauthProviderIds: providers });
        await openSignInMenu();

        const items = screen.getAllByRole('menuitem');

        expect(items.map((item) => item.textContent)).toEqual(itemNames);
      },
    );

    it('renders a plain label, not a heading, plus the provider prompt', async () => {
      setup();
      await openSignInMenu();

      const panel = screen.getByRole('menu');
      const heading = within(panel).queryByRole('heading');
      const label = within(panel).getByText(SIGN_IN_LABEL);
      const prompt = within(panel).getByText(
        SITE_MESSAGES.authMenu.chooseProviderPrompt,
      );
      const redirectHint = within(panel).getByText(
        SITE_MESSAGES.authMenu.redirectHint,
      );

      expect(heading).not.toBeInTheDocument();
      expect(label).toBeVisible();
      expect(prompt).toBeVisible();
      expect(redirectHint).toBeVisible();
    });

    it.each([
      { provider: PROVIDER.GITHUB, itemName: GITHUB_ITEM },
      { provider: PROVIDER.GOOGLE, itemName: GOOGLE_ITEM },
    ])(
      'signs in with $provider when its item is chosen',
      async ({ provider, itemName }) => {
        setup();
        await openSignInMenu();

        const providerItem = screen.getByRole('menuitem', { name: itemName });
        await user.click(providerItem);

        expect(signInMock).toHaveBeenCalledWith(provider);
      },
    );

    it('expands the email item in place into a field and submit button', async () => {
      setup();
      await openEmailForm();

      const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
      const sendButton = screen.getByRole('button', { name: SEND_LINK_LABEL });
      const collapsedEmailItem = screen.queryByRole('menuitem', {
        name: EMAIL_ITEM,
      });
      const promptIcon = screen.getByTestId('sign-in-prompt-icon');

      expect(emailField).toBeVisible();
      expect(sendButton).toBeVisible();
      expect(collapsedEmailItem).not.toBeInTheDocument();
      expect(promptIcon).toBeVisible();
    });

    describe('when the email sign-in succeeds', () => {
      beforeEach(() => {
        mockSignInResult(true, HTTP_STATUS.OK);
        setup();
      });

      it('submits the email and confirms with a check-your-inbox notice', async () => {
        await openEmailForm();
        const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
        await user.type(emailField, MOCK_READER_EMAIL);
        const sendButton = screen.getByRole('button', {
          name: SEND_LINK_LABEL,
        });
        await user.click(sendButton);

        const confirmation = await screen.findByRole('status');

        expect(signInMock).toHaveBeenCalledWith('email', {
          email: MOCK_READER_EMAIL,
          redirect: false,
        });
        expect(confirmation).toHaveTextContent(CHECK_YOUR_INBOX);
      });

      it('also submits on Enter in the email field', async () => {
        await openEmailForm();
        const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
        await user.type(emailField, `${MOCK_READER_EMAIL}{Enter}`);

        const confirmation = await screen.findByText(CHECK_YOUR_INBOX);

        expect(signInMock).toHaveBeenCalledWith('email', {
          email: MOCK_READER_EMAIL,
          redirect: false,
        });
        expect(confirmation).toBeVisible();
      });
    });

    it('shows an inline error and keeps the field open when the email sign-in fails', async () => {
      mockSignInResult(false, HTTP_STATUS.UNAUTHORIZED);
      setup();
      await openEmailForm();
      const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD });
      await user.type(emailField, MOCK_READER_EMAIL);
      const sendButton = screen.getByRole('button', { name: SEND_LINK_LABEL });
      await user.click(sendButton);

      const errorNotice = await screen.findByRole('status');

      expect(errorNotice).toHaveTextContent(EMAIL_ERROR);
      expect(emailField).toBeVisible();
    });

    it('forgets a remembered sign-in once the session resolves signed out', () => {
      document.cookie = `${SIGNED_IN_HINT_COOKIE_NAME}=1; Path=/`;
      setup();

      expect(hasSignedInHint()).toBe(false);
    });

    it('shows an inline OAuth error notice when the URL carries an error param', async () => {
      setLocationSearch(`?error=${MOCK_OAUTH_ERROR}`);
      setup();

      const notice = await screen.findByRole('alert');
      const trigger = screen.getByRole('button', { name: SIGN_IN_LABEL });

      expect(notice).toHaveTextContent(OAUTH_ERROR);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('logged in', () => {
    beforeEach(() => {
      mockSession(SESSION_STATUS.AUTHENTICATED, {
        user: { name: MOCK_NAME, email: MOCK_EMAIL, image: null },
        expires: MOCK_SESSION_EXPIRES,
      });
      setup();
    });

    it('exposes the account menu as the only button, with no Sign in control', () => {
      const buttons = screen.getAllByRole('button');
      const signInButton = screen.queryByRole('button', {
        name: SIGN_IN_LABEL,
      });

      expect(buttons).toHaveLength(1);
      expect(signInButton).not.toBeInTheDocument();
    });

    it('shows the signed-in reader in the account menu', async () => {
      const trigger = screen.getByRole('button', { name: ACCOUNT_MENU_LABEL });
      await user.click(trigger);

      const panel = screen.getByRole('menu');
      const email = within(panel).getByText(MOCK_EMAIL);
      const signOutItem = within(panel).getByRole('menuitem', {
        name: SIGN_OUT_LABEL,
      });

      expect(email).toBeVisible();
      expect(signOutItem).toBeVisible();
    });

    it('remembers the sign-in for the next page load', () => {
      expect(hasSignedInHint()).toBe(true);
    });

    describe('when Sign out is chosen', () => {
      beforeEach(async () => {
        const trigger = screen.getByRole('button', {
          name: ACCOUNT_MENU_LABEL,
        });
        await user.click(trigger);
        const signOutItem = screen.getByRole('menuitem', {
          name: SIGN_OUT_LABEL,
        });
        await user.click(signOutItem);
      });

      it('signs the reader out', () => {
        expect(signOutMock).toHaveBeenCalledTimes(1);
      });

      it('forgets the remembered sign-in', () => {
        expect(hasSignedInHint()).toBe(false);
      });
    });
  });
});

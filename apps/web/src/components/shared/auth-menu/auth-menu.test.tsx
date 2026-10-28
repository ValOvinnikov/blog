import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  HTTP_STATUS,
  MAGIC_LINK_SIGN_IN_CODE,
  SITE_MESSAGES,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { SESSION_STATUS } from '@web/constants/session';
import { act, customRender, screen, within } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_CONTROL } from '@web/testing/shared/account-control/fixtures';
import { ARIA_EXPANDED } from '@web/testing/shared/aria/constants';
import { SIGNED_IN_HINT_COOKIE_NAME } from '@web/utils/signed-in-hint-cookie';

import { AuthMenu } from './auth-menu';

faker.seed(6061);

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
  accountHeading: ACCOUNT_LABEL,
  accountMenuAriaLabel: ACCOUNT_MENU_LABEL,
  signOut: SIGN_OUT_LABEL,
  continueWithGithub: GITHUB_BUTTON,
  continueWithGoogle: GOOGLE_BUTTON,
  continuingWithGithub: GITHUB_PENDING,
  emailAriaLabel: EMAIL_FIELD,
  sendSignInLink: SEND_LINK_LABEL,
  sending: SENDING_LABEL,
  sentTitle: SENT_TITLE,
  useDifferentEmail: USE_DIFFERENT_EMAIL,
  emailError: EMAIL_ERROR,
  sendLimited: SEND_LIMITED,
  oauthError: OAUTH_ERROR,
  myBookmarksDescription: BOOKMARKS_DESCRIPTION,
} = SITE_MESSAGES.authMenu;

const MOCK_NAME = faker.person.fullName();
const MOCK_EMAIL = faker.internet.email();
const MOCK_READER_EMAIL = faker.internet.email();
const MOCK_SESSION_EXPIRES = '2099-01-01T00:00:00.000Z';
const MOCK_OAUTH_ERROR = faker.string.alpha(12);
const CIRCLE_IN_BAR = {
  ...MOCK_ACCOUNT_CONTROL,
  buttonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
};

const setup = customRender(AuthMenu, {
  oauthProviderIds: [PROVIDER.GITHUB, PROVIDER.GOOGLE],
  accountControl: CIRCLE_IN_BAR,
});

const setLocationSearch = (search: string) => {
  window.history.replaceState(null, '', `/${search}`);
};

const hasSignedInHint = () =>
  document.cookie.split('; ').includes(`${SIGNED_IN_HINT_COOKIE_NAME}=1`);

const mockSession = (status: string, data: object | null = null) =>
  useSessionMock.mockReturnValue({ data, status });

const mockSignedIn = () =>
  mockSession(SESSION_STATUS.AUTHENTICATED, {
    user: { name: MOCK_NAME, email: MOCK_EMAIL, image: null },
    expires: MOCK_SESSION_EXPIRES,
  });

const mockSignInResult = (ok: boolean, code?: string) =>
  signInMock.mockResolvedValue({
    ok,
    error: ok ? undefined : 'EmailSignin',
    code,
    status: ok ? HTTP_STATUS.OK : HTTP_STATUS.UNAUTHORIZED,
    url: null,
  });

const BUTTON_AND_PANEL_COMBINATIONS = Object.values(
  ACCOUNT_BUTTON_STYLE,
).flatMap((buttonStyle) =>
  Object.values(ACCOUNT_PANEL_STYLE).map((panelStyle) => ({
    buttonStyle,
    panelStyle,
  })),
);

describe(`<${AuthMenu.name}/>`, () => {
  let user: UserEvent;

  const openSignInPanel = async () => {
    const trigger = screen.getByRole('button', { name: SIGN_IN_LABEL });
    await user.click(trigger);
    return screen.getByRole('dialog', { name: SIGN_IN_LABEL });
  };

  const sendLink = async () => {
    const panel = await openSignInPanel();
    const emailField = within(panel).getByRole('textbox', {
      name: EMAIL_FIELD,
    });
    await user.type(emailField, MOCK_READER_EMAIL);
    const sendButton = within(panel).getByRole('button', {
      name: SEND_LINK_LABEL,
    });
    await user.click(sendButton);
    return panel;
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

  describe.each(BUTTON_AND_PANEL_COMBINATIONS)(
    'with the $buttonStyle button and the $panelStyle panel',
    ({ buttonStyle, panelStyle }) => {
      const accountControl = { ...CIRCLE_IN_BAR, buttonStyle, panelStyle };

      it('opens the account panel and returns focus to the trigger on Escape', async () => {
        mockSignedIn();
        setup({ accountControl });
        const [trigger] = screen.getAllByRole('button', {
          name: ACCOUNT_LABEL,
        });
        await user.click(trigger!);
        const panel = screen.getByRole('menu', { name: ACCOUNT_MENU_LABEL });

        expect(panel).toBeVisible();

        await user.keyboard('{Escape}');

        expect(panel).not.toBeVisible();
        expect(trigger).toHaveFocus();
      });

      it('opens the sign-in panel and returns focus to the trigger on Escape', async () => {
        mockSession(SESSION_STATUS.UNAUTHENTICATED);
        setup({ accountControl });
        const [trigger] = screen.getAllByRole('button', {
          name: SIGN_IN_LABEL,
        });
        await user.click(trigger!);
        const panel = screen.getByRole('dialog', { name: SIGN_IN_LABEL });

        expect(panel).toBeVisible();

        await user.keyboard('{Escape}');

        expect(panel).not.toBeVisible();
        expect(trigger).toHaveFocus();
      });
    },
  );

  describe('with the pill in the bar on phones', () => {
    beforeEach(() => {
      mockSession(SESSION_STATUS.UNAUTHENTICATED);
      setup({
        accountControl: {
          ...CIRCLE_IN_BAR,
          buttonStyle: ACCOUNT_BUTTON_STYLE.PILL,
        },
      });
    });

    it('opens one panel from either the pill or the phone circle', async () => {
      const [pill, phoneCircle] = screen.getAllByRole('button', {
        name: SIGN_IN_LABEL,
      });
      await user.click(phoneCircle!);
      const panel = screen.getByRole('dialog', { name: SIGN_IN_LABEL });

      expect(panel).toBeVisible();
      expect(pill).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(phoneCircle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });

  it('adds no phone circle when the account sits in the phone menu', () => {
    mockSession(SESSION_STATUS.UNAUTHENTICATED);
    setup({
      accountControl: {
        ...CIRCLE_IN_BAR,
        buttonStyle: ACCOUNT_BUTTON_STYLE.PILL,
        phonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
      },
    });

    const triggers = screen.getAllByRole('button', { name: SIGN_IN_LABEL });

    expect(triggers).toHaveLength(1);
  });

  describe('logged out', () => {
    beforeEach(() => {
      mockSession(SESSION_STATUS.UNAUTHENTICATED);
    });

    it.each([
      {
        title: 'every provider is enabled',
        providers: [PROVIDER.GITHUB, PROVIDER.GOOGLE],
        buttonNames: [GITHUB_BUTTON, GOOGLE_BUTTON, SEND_LINK_LABEL],
      },
      {
        title: 'only GitHub is enabled',
        providers: [PROVIDER.GITHUB],
        buttonNames: [GITHUB_BUTTON, SEND_LINK_LABEL],
      },
      {
        title: 'no OAuth provider is enabled',
        providers: [],
        buttonNames: [SEND_LINK_LABEL],
      },
    ])(
      'offers exactly the enabled providers and the email link when $title',
      async ({ providers, buttonNames }) => {
        setup({ oauthProviderIds: providers });
        const panel = await openSignInPanel();

        const buttons = within(panel).getAllByRole('button');
        const namedButtons = buttonNames.map((name) =>
          within(panel).getByRole('button', { name }),
        );

        expect(buttons).toEqual(namedButtons);
      },
    );

    it('shows the email field at once, with no row to open first', async () => {
      setup();
      const panel = await openSignInPanel();

      const emailField = within(panel).getByRole('textbox', {
        name: EMAIL_FIELD,
      });
      const heading = within(panel).queryByRole('heading');

      expect(emailField).toBeVisible();
      expect(heading).not.toBeInTheDocument();
    });

    it('signs in with GitHub and says where the pressed row is going', async () => {
      setup();
      const panel = await openSignInPanel();
      const githubButton = within(panel).getByRole('button', {
        name: GITHUB_BUTTON,
      });
      await user.click(githubButton);

      const pendingRow = within(panel).getByText(GITHUB_PENDING);

      expect(signInMock).toHaveBeenCalledWith(PROVIDER.GITHUB);
      expect(pendingRow).toBeVisible();
    });

    it('lets the reader pick a provider again when its redirect fails', async () => {
      signInMock.mockRejectedValue(new Error(OAUTH_ERROR));
      setup();
      const panel = await openSignInPanel();
      const githubButton = within(panel).getByRole('button', {
        name: GITHUB_BUTTON,
      });
      await user.click(githubButton);

      const restoredButton = await within(panel).findByRole('button', {
        name: GITHUB_BUTTON,
      });

      expect(restoredButton).not.toHaveAttribute('aria-busy');
    });

    it('lets the reader pick a provider again after coming back with Back', async () => {
      signInMock.mockReturnValue(new Promise(() => {}));
      setup();
      const panel = await openSignInPanel();
      const githubButton = within(panel).getByRole('button', {
        name: GITHUB_BUTTON,
      });
      await user.click(githubButton);
      act(() => {
        window.dispatchEvent(
          new PageTransitionEvent('pageshow', { persisted: true }),
        );
      });

      const pendingRow = within(panel).queryByText(GITHUB_PENDING);

      expect(pendingRow).not.toBeInTheDocument();
    });

    it('shows Sending on the button while the link is on its way', async () => {
      signInMock.mockReturnValue(new Promise(() => {}));
      setup();
      const panel = await sendLink();

      const sendingButton = within(panel).getByRole('button', {
        name: SENDING_LABEL,
      });

      expect(sendingButton).toHaveAttribute('aria-busy', 'true');
    });

    describe('when the email link is sent', () => {
      beforeEach(() => {
        mockSignInResult(true);
        setup();
      });

      it('replaces the whole form with Check your inbox', async () => {
        const panel = await sendLink();

        const status = await within(panel).findByRole('status');
        const title = within(panel).getByText(SENT_TITLE);
        const emailField = within(panel).queryByRole('textbox');

        expect(signInMock).toHaveBeenCalledWith('email', {
          email: MOCK_READER_EMAIL,
          redirect: false,
        });
        expect(title).toBeVisible();
        expect(status).toHaveTextContent(MOCK_READER_EMAIL);
        expect(emailField).not.toBeInTheDocument();
      });

      it('brings the empty form back with focus on the field for a different email', async () => {
        const panel = await sendLink();
        const resetButton = await within(panel).findByRole('button', {
          name: USE_DIFFERENT_EMAIL,
        });
        await user.click(resetButton);

        const emailField = within(panel).getByRole('textbox', {
          name: EMAIL_FIELD,
        });

        expect(emailField).toHaveValue('');
        expect(emailField).toHaveFocus();
      });
    });

    it.each([
      { title: 'fails', code: undefined, message: EMAIL_ERROR },
      {
        title: 'is over the send limit',
        code: MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED,
        message: SEND_LIMITED,
      },
    ])(
      'shows the error under the field when the send $title',
      async ({ code, message }) => {
        mockSignInResult(false, code);
        setup();
        const panel = await sendLink();

        const error = await within(panel).findByText(message);
        const emailField = within(panel).getByRole('textbox', {
          name: EMAIL_FIELD,
        });

        expect(error).toBeVisible();
        expect(emailField).toHaveAccessibleDescription(message);
      },
    );

    it('forgets a remembered sign-in once the session resolves signed out', () => {
      document.cookie = `${SIGNED_IN_HINT_COOKIE_NAME}=1; Path=/`;
      setup();

      expect(hasSignedInHint()).toBe(false);
    });

    it('shows an alert when the reader comes back from a failed sign-in', async () => {
      setLocationSearch(`?error=${MOCK_OAUTH_ERROR}`);
      setup();

      const notice = await screen.findByRole('alert');
      const trigger = screen.getByRole('button', { name: SIGN_IN_LABEL });

      expect(notice).toHaveTextContent(OAUTH_ERROR);
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    });
  });

  describe('logged in', () => {
    beforeEach(() => {
      mockSignedIn();
    });

    it('exposes the account button as the only button', () => {
      setup();

      const buttons = screen.getAllByRole('button');
      const signInButton = screen.queryByRole('button', {
        name: SIGN_IN_LABEL,
      });

      expect(buttons).toHaveLength(1);
      expect(signInButton).not.toBeInTheDocument();
    });

    it('shows the signed-in reader in the account panel', async () => {
      setup();
      const trigger = screen.getByRole('button', { name: ACCOUNT_LABEL });
      await user.click(trigger);

      const panel = screen.getByRole('menu', { name: ACCOUNT_MENU_LABEL });
      const email = within(panel).getByText(MOCK_EMAIL);

      expect(email).toBeVisible();
    });

    it('describes each tile in the Hub panel', async () => {
      setup({
        accountControl: {
          ...CIRCLE_IN_BAR,
          panelStyle: ACCOUNT_PANEL_STYLE.HUB,
        },
      });
      const trigger = screen.getByRole('button', { name: ACCOUNT_LABEL });
      await user.click(trigger);

      const panel = screen.getByRole('menu', { name: ACCOUNT_MENU_LABEL });
      const description = within(panel).getByText(BOOKMARKS_DESCRIPTION);

      expect(description).toBeVisible();
    });

    it('remembers the sign-in for the next page load', () => {
      setup();

      expect(hasSignedInHint()).toBe(true);
    });

    describe('when Sign out is chosen', () => {
      beforeEach(async () => {
        setup();
        const trigger = screen.getByRole('button', { name: ACCOUNT_LABEL });
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

import {
  ACCOUNT_PHONE_PLACEMENT,
  LOCALE_ISO_CODES,
  SITE_MESSAGES,
} from '@blog/config';
import { OAUTH_PROVIDER } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { toInitial } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { NAVIGATION_LOG } from '@web/constants/navigation';
import { SESSION_STATUS } from '@web/constants/session';
import { getSiteOAuthCredentials } from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  isReaderAccountEnabled,
  isReaderAccountFeatureEnabled,
} from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getAccountControl } from '@web/server/site-config/get-account-control/get-account-control';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { getHeaderStyle } from '@web/server/site-config/get-header-style/get-header-style';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_SITE_OAUTH_CREDENTIALS } from '@web/testing/server/auth/site-oauth-credentials-fixtures';
import { MOCK_ACCOUNT_CONTROL } from '@web/testing/shared/account-control/fixtures';
import { ARIA_EXPANDED } from '@web/testing/shared/aria/constants';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  KEY_ARROW_DOWN,
  KEY_ARROW_UP,
  KEY_END,
  KEY_ESCAPE,
} from '@web/testing/shared/keyboard/constants';
import { LANGUAGE_NAV_NAME } from '@web/testing/shared/language-switcher/constants';
import {
  MOCK_BLOG_LINK,
  MOCK_TOPICS_GROUP,
  MOCK_TOPICS_LINK,
} from '@web/testing/shared/link/fixtures';
import {
  stubHidePopover,
  unstubHidePopover,
} from '@web/testing/shared/popover/stub-hide-popover';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { SiteHeader } from './site-header';

const { getNavigationMock, getEnabledOAuthProviderIdsMock, useSessionMock } =
  vi.hoisted(() => ({
    getNavigationMock: vi.fn(),
    getEnabledOAuthProviderIdsMock: vi.fn(),
    useSessionMock: vi.fn(),
  }));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/auth/site-oauth-credentials/site-oauth-credentials');

vi.mock(
  '@web/server/site-config/get-language-switcher-style/get-language-switcher-style',
);

vi.mock('@web/server/site-config/get-account-control/get-account-control');

vi.mock(
  '@web/server/site-config/get-brand-logo-url/get-brand-logo-url',
  () => ({
    getBrandLogoUrl: vi.fn(),
  }),
);

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-header-style/get-header-style');

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
);

vi.mock('@blog/auth/utils/oauth-providers/oauth-providers', () => ({
  getEnabledOAuthProviderIds: getEnabledOAuthProviderIdsMock,
}));

vi.mock('@blog/service', () => ({
  service: {
    global: { navigation: { v1: { getNavigation: getNavigationMock } } },
  },
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const getRequestContextMock = vi.mocked(getRequestContext);
const getHeaderStyleMock = vi.mocked(getHeaderStyle);
const isReaderAccountEnabledMock = vi.mocked(isReaderAccountEnabled);
const isReaderAccountFeatureEnabledMock = vi.mocked(
  isReaderAccountFeatureEnabled,
);
const getBrandLogoUrlMock = vi.mocked(getBrandLogoUrl);
const getAccountControlMock = vi.mocked(getAccountControl);

faker.seed(5);

const MOCK_LOOK_LOGO_URL = faker.internet.url();
const MOCK_HEADER_TAGLINE = faker.lorem.words(3);
const MOCK_READER = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
};

const setup = customRenderAsync(SiteHeader, {});

const TOGGLE_NAVIGATION_MENU = 'Toggle navigation menu';
const LANGUAGE_ENGLISH = 'Language: English';
const DRAWER_ACTIONS_TEST_ID = 'primary-navigation-drawer-actions';
const MOBILE_PANEL_TEST_ID = 'primary-navigation-mobile-panel';
const PANEL_ACTIONS_TEST_ID = 'primary-navigation-panel-actions';
const SIGN_IN = 'Sign in';
const ACCOUNT = 'Account';
const CONTINUE_WITH_GITHUB = 'Continue with GitHub';
const ACCOUNT_IN_PHONE_MENU = {
  ...MOCK_ACCOUNT_CONTROL,
  phonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
};
const HOME_LINK_NAME = 'Home';
const {
  myBookmarks: MY_BOOKMARKS,
  accountSettings: ACCOUNT_SETTINGS,
  accountMenuAriaLabel: ACCOUNT_MENU,
  signOut: SIGN_OUT,
} = SITE_MESSAGES.authMenu;

describe(`<${SiteHeader.name}/>`, () => {
  let user: UserEvent;

  const queryPhoneMenuToggle = () =>
    screen.queryByRole('button', { name: TOGGLE_NAVIGATION_MENU });

  const openPhoneMenu = async () => {
    await user.click(queryPhoneMenuToggle()!);
  };

  const openAccountMenu = async () => {
    await setup();
    const banner = screen.getByRole('banner');
    const [accountButton] = within(banner).getAllByRole('button', {
      name: ACCOUNT,
    });
    await user.click(accountButton!);
    return screen.getByRole('menu', { name: ACCOUNT_MENU });
  };

  const openPhoneMenuWithAccountInIt = async () => {
    getAccountControlMock.mockResolvedValueOnce(ACCOUNT_IN_PHONE_MENU);
    await setup();
    await openPhoneMenu();
  };

  const getDrawerAccountRow = (name: string) => {
    const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
    return within(drawerActions).getByText(name, { selector: 'summary' });
  };

  const getBarSignInButtons = () => {
    const banner = screen.getByRole('banner');
    return within(banner).getAllByRole('button', { name: SIGN_IN });
  };

  beforeEach(() => {
    user = userEvent.setup();
    getNavigationMock.mockResolvedValue(okResult({ items: [] }));
    getBrandLogoUrlMock.mockResolvedValue(undefined);
    isReaderAccountEnabledMock.mockResolvedValue(true);
    isReaderAccountFeatureEnabledMock.mockResolvedValue(true);
    getEnabledOAuthProviderIdsMock.mockReturnValue([
      OAUTH_PROVIDER.GITHUB,
      OAUTH_PROVIDER.GOOGLE,
    ]);
    useSessionMock.mockReturnValue({
      data: null,
      status: SESSION_STATUS.UNAUTHENTICATED,
    });
  });

  describe('the brand logo', () => {
    it("shows the tenant's Look logo", async () => {
      getBrandLogoUrlMock.mockResolvedValue(MOCK_LOOK_LOGO_URL);

      await setup();

      const homeLink = screen.getByRole('link', { name: HOME_LINK_NAME });
      const logo = within(homeLink).getByRole('presentation');

      expect(logo).toHaveAttribute('src', MOCK_LOOK_LOGO_URL);
      expect(getBrandLogoUrlMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
      );
    });

    it("shows the site's initial tile without a Look logo", async () => {
      await setup();

      const homeLink = screen.getByRole('link', { name: HOME_LINK_NAME });
      const presentation = within(homeLink).queryByRole('presentation');
      const initial = within(homeLink).getByText(toInitial(MOCK_TENANT_NAME)!);

      expect(presentation).not.toBeInTheDocument();
      expect(initial).toBeInTheDocument();
      expect(vi.mocked(getBrandName)).toHaveBeenCalledWith({
        tenantId: MOCK_REQUEST_CONTEXT.tenantId,
        tenantName: MOCK_REQUEST_CONTEXT.tenantName,
      });
    });
  });

  describe('the header tagline', () => {
    it('shows the tagline from the header settings under the logo', async () => {
      getNavigationMock.mockResolvedValue(
        okResult({ items: [], tagline: MOCK_HEADER_TAGLINE }),
      );

      await setup();

      const homeLink = screen.getByRole('link', { name: HOME_LINK_NAME });
      const tagline = within(homeLink).getByText(MOCK_HEADER_TAGLINE);

      expect(tagline).toBeVisible();
    });

    it('shows no tagline when the navigation fails to load', async () => {
      getNavigationMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const tagline = screen.queryByText(MOCK_HEADER_TAGLINE);

      expect(tagline).not.toBeInTheDocument();
    });
  });

  describe('with several live languages and the switcher on', () => {
    beforeEach(async () => {
      getRequestContextMock.mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });
      getNavigationMock.mockResolvedValue(
        okResult({ items: [], showLanguageSwitcher: true }),
      );
      await setup();
    });

    it('shows the language switcher in the header', () => {
      const banner = screen.getByRole('banner');
      const languageNav = within(banner).getByRole('navigation', {
        name: LANGUAGE_NAV_NAME,
      });

      expect(languageNav).toBeVisible();
    });

    it('puts the language pill and theme toggle in the phone menu', async () => {
      await openPhoneMenu();

      const panelRow = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      const englishButton = within(panelRow).getByRole('button', {
        name: LANGUAGE_ENGLISH,
      });
      const switchToButton = within(panelRow).getByRole('button', {
        name: /Switch to/,
      });
      const panelSignInButton = within(panelRow).queryByRole('button', {
        name: SIGN_IN,
      });

      expect(englishButton).toBeVisible();
      expect(switchToButton).toBeVisible();
      expect(panelSignInButton).not.toBeInTheDocument();
    });

    it('closes the open language menu when the sign-in panel opens', async () => {
      const [languageButton] = screen.getAllByRole('button', {
        name: LANGUAGE_ENGLISH,
      });
      await user.click(languageButton!);
      const languageMenu = screen.getByRole('menu', {
        name: LANGUAGE_NAV_NAME,
      });

      expect(languageMenu).toBeVisible();

      const [signInButton] = getBarSignInButtons();
      await user.click(signInButton!);

      const menus = screen.queryAllByRole('menu');
      const signInDialog = screen.getByRole('dialog', { name: SIGN_IN });

      expect(menus).toHaveLength(0);
      expect(signInDialog).toBeVisible();
    });
  });

  describe('with the account in the bar on phones', () => {
    beforeEach(async () => {
      getNavigationMock.mockResolvedValue(
        okResult({ items: [MOCK_BLOG_LINK] }),
      );
      await setup();
    });

    it('adds a circle beside the wide pill', () => {
      const signInButtons = getBarSignInButtons();

      expect(signInButtons).toHaveLength(2);
    });

    describe('with the phone menu open', () => {
      beforeEach(async () => {
        await openPhoneMenu();
      });

      it('closes the phone menu when the phone circle opens its panel', async () => {
        const [, phoneCircle] = getBarSignInButtons();
        await user.click(phoneCircle!);

        const toggleButton = queryPhoneMenuToggle();

        expect(toggleButton).toHaveAttribute(ARIA_EXPANDED, 'false');
      });

      it('adds no account row to the phone menu', () => {
        const drawerActions = screen.queryByTestId(DRAWER_ACTIONS_TEST_ID);

        expect(drawerActions).not.toBeInTheDocument();
      });
    });

    it('returns focus to the phone circle when Escape closes its panel', async () => {
      const [, phoneCircle] = getBarSignInButtons();
      await user.click(phoneCircle!);
      await user.keyboard(KEY_ESCAPE);

      const signInDialog = screen.queryByRole('dialog', { name: SIGN_IN });

      expect(signInDialog).not.toBeInTheDocument();
      expect(phoneCircle).toHaveFocus();
    });
  });

  describe('with no navigation items', () => {
    it('shows no phone menu button with the account in the bar', async () => {
      await setup();

      const toggleButton = queryPhoneMenuToggle();

      expect(toggleButton).not.toBeInTheDocument();
    });

    it('lists the account row in the phone menu with the account in the menu', async () => {
      await openPhoneMenuWithAccountInIt();

      const accountRow = getDrawerAccountRow(SIGN_IN);

      expect(accountRow).toBeVisible();
    });
  });

  describe('with the account in the phone menu', () => {
    const getPanelRows = () => {
      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
      return {
        subMenuRow: within(mobilePanel).getByText(MOCK_TOPICS_GROUP.label, {
          selector: 'summary',
        }),
        blogLink: within(mobilePanel).getByRole('link', {
          name: MOCK_BLOG_LINK.label,
        }),
        accountRow: getDrawerAccountRow(SIGN_IN),
      };
    };

    let panelRows: ReturnType<typeof getPanelRows>;

    beforeEach(async () => {
      stubHidePopover();
      getNavigationMock.mockResolvedValue(
        okResult({ items: [MOCK_TOPICS_GROUP, MOCK_BLOG_LINK] }),
      );
      await openPhoneMenuWithAccountInIt();
      panelRows = getPanelRows();
    });

    afterEach(() => {
      unstubHidePopover();
    });

    it('focuses the leading sub-menu row when the menu opens', () => {
      expect(panelRows.subMenuRow).toHaveFocus();
    });

    it('reaches the account row with ArrowDown, past the closed sub-menu', async () => {
      const { blogLink, accountRow } = panelRows;

      await user.keyboard(KEY_ARROW_DOWN);
      expect(blogLink).toHaveFocus();

      await user.keyboard(KEY_ARROW_DOWN);
      expect(accountRow).toHaveFocus();
    });

    it('reaches the sub-menu row with ArrowUp from the account row', async () => {
      await user.keyboard(KEY_END);

      await user.keyboard(`${KEY_ARROW_UP}${KEY_ARROW_UP}`);

      const { subMenuRow } = panelRows;

      expect(subMenuRow).toHaveFocus();
    });

    it('wraps Tab from the account row to the first row, and Shift+Tab back', async () => {
      const { subMenuRow, accountRow } = panelRows;
      await user.keyboard(KEY_END);
      expect(accountRow).toHaveFocus();

      await user.tab();
      expect(subMenuRow).toHaveFocus();

      await user.tab({ shift: true });
      expect(accountRow).toHaveFocus();
    });

    it('puts the rows of an opened sub-menu into the arrow-key order', async () => {
      await user.click(panelRows.subMenuRow);
      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
      const [leadSubLink] = within(mobilePanel).getAllByRole('link', {
        name: MOCK_TOPICS_LINK.label,
      });

      await user.keyboard(KEY_ARROW_DOWN);

      expect(leadSubLink).toHaveFocus();
    });

    it('puts only the wide button in the bar, with no phone circle', () => {
      const barTriggers = getBarSignInButtons();

      expect(barTriggers).toHaveLength(1);
    });

    describe('with the account row pressed', () => {
      let githubButton: HTMLElement;

      beforeEach(async () => {
        await user.click(panelRows.accountRow);
        const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
        githubButton = await within(drawerActions).findByRole('button', {
          name: CONTINUE_WITH_GITHUB,
        });
      });

      it('opens the sign-in panel in place and keeps the menu open', () => {
        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

        expect(mobilePanel).toBeVisible();
        expect(githubButton).toBeVisible();
      });

      it('folds the account group when its row is pressed again', async () => {
        await user.click(panelRows.accountRow);

        expect(githubButton).not.toBeVisible();
      });
    });
  });

  describe('with the language switcher and the account in the phone menu', () => {
    const getPanelLanguageButton = () => {
      const panelRow = screen.getByTestId(PANEL_ACTIONS_TEST_ID);
      return within(panelRow).getByRole('button', { name: LANGUAGE_ENGLISH });
    };

    const openAccountRow = async () => {
      const accountRow = getDrawerAccountRow(SIGN_IN);
      await user.click(accountRow);
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      return within(drawerActions).findByRole('button', {
        name: CONTINUE_WITH_GITHUB,
      });
    };

    beforeEach(async () => {
      stubHidePopover();
      getRequestContextMock.mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });
      getNavigationMock.mockResolvedValue(
        okResult({ items: [], showLanguageSwitcher: true }),
      );
      await openPhoneMenuWithAccountInIt();
    });

    afterEach(() => {
      unstubHidePopover();
    });

    it('folds the open account row when the language menu opens', async () => {
      const githubButton = await openAccountRow();

      const languageButton = getPanelLanguageButton();
      await user.click(languageButton);

      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

      expect(githubButton).not.toBeVisible();
      expect(mobilePanel).toBeVisible();
    });

    describe('with the language menu open', () => {
      let languageButton: HTMLElement;

      beforeEach(async () => {
        languageButton = getPanelLanguageButton();
        await user.click(languageButton);
      });

      it('keeps the phone menu open', () => {
        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
        const languageMenu = within(mobilePanel).getByRole('menu', {
          name: LANGUAGE_NAV_NAME,
        });

        expect(mobilePanel).toBeVisible();
        expect(languageMenu).toBeVisible();
      });

      it('closes the language menu when the account row opens', async () => {
        const githubButton = await openAccountRow();
        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

        expect(languageButton).toHaveAttribute(ARIA_EXPANDED, 'false');
        expect(githubButton).toBeVisible();
        expect(mobilePanel).toBeVisible();
      });

      it('closes only the language menu on Escape', async () => {
        await user.keyboard(KEY_ESCAPE);

        const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);

        expect(languageButton).toHaveAttribute(ARIA_EXPANDED, 'false');
        expect(mobilePanel).toBeVisible();
      });
    });
  });

  it('labels the phone menu account row "Account" for a signed-in reader', async () => {
    getAccountControlMock.mockResolvedValueOnce(ACCOUNT_IN_PHONE_MENU);
    useSessionMock.mockReturnValue({
      data: { user: MOCK_READER },
      status: SESSION_STATUS.AUTHENTICATED,
    });
    await setup();
    await openPhoneMenu();

    const accountRow = getDrawerAccountRow(ACCOUNT);

    expect(accountRow).toBeVisible();
  });

  describe('for a signed-in reader with Bookmarks off', () => {
    beforeEach(() => {
      isReaderAccountFeatureEnabledMock.mockResolvedValue(false);
      useSessionMock.mockReturnValue({
        data: { user: MOCK_READER },
        status: SESSION_STATUS.AUTHENTICATED,
      });
    });

    it('leaves My bookmarks out of the account menu', async () => {
      const accountMenu = await openAccountMenu();

      const settingsText = within(accountMenu).getByText(ACCOUNT_SETTINGS);
      const bookmarksText = within(accountMenu).queryByText(MY_BOOKMARKS);

      expect(settingsText).toBeVisible();
      expect(bookmarksText).not.toBeInTheDocument();
    });

    it('leaves My bookmarks out of the phone menu account panel', async () => {
      await openPhoneMenuWithAccountInIt();
      const accountRow = getDrawerAccountRow(ACCOUNT);
      await user.click(accountRow);

      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const settingsText = within(drawerActions).getByText(ACCOUNT_SETTINGS);
      const bookmarksText = within(drawerActions).queryByText(MY_BOOKMARKS);

      expect(settingsText).toBeVisible();
      expect(bookmarksText).not.toBeInTheDocument();
    });
  });

  it('hides the language switcher when its toggle is off', async () => {
    getRequestContextMock.mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });

    await setup();

    const languageNav = screen.queryByRole('navigation', {
      name: LANGUAGE_NAV_NAME,
    });

    expect(languageNav).not.toBeInTheDocument();
  });

  it('shows no language switcher with one live language, toggle on', async () => {
    getNavigationMock.mockResolvedValue(
      okResult({ items: [], showLanguageSwitcher: true }),
    );

    await setup();

    const languageNav = screen.queryByRole('navigation', {
      name: LANGUAGE_NAV_NAME,
    });

    expect(languageNav).not.toBeInTheDocument();
  });

  it('offers only the enabled OAuth providers in the sign-in menu', async () => {
    getEnabledOAuthProviderIdsMock.mockReturnValue([OAUTH_PROVIDER.GITHUB]);
    await setup();

    const [signInButton] = getBarSignInButtons();
    await user.click(signInButton!);

    const panel = screen.getByRole('dialog', { name: SIGN_IN });
    const githubButton = within(panel).getByRole('button', {
      name: CONTINUE_WITH_GITHUB,
    });
    const googleButton = within(panel).queryByRole('button', {
      name: 'Continue with Google',
    });

    expect(githubButton).toBeVisible();
    expect(googleButton).not.toBeInTheDocument();
  });

  it("advertises the providers the site's own credentials register", async () => {
    vi.mocked(getSiteOAuthCredentials).mockResolvedValueOnce(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );

    await setup();

    expect(vi.mocked(getSiteOAuthCredentials)).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
    );
    expect(getEnabledOAuthProviderIdsMock).toHaveBeenCalledWith(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
  });

  describe('with Reader accounts off', () => {
    beforeEach(() => {
      isReaderAccountEnabledMock.mockResolvedValue(false);
    });

    it('hides the sign-in menu from a signed-out visitor', async () => {
      await setup();

      const signInButton = screen.queryByRole('button', { name: SIGN_IN });

      expect(signInButton).not.toBeInTheDocument();
    });

    it('shows no phone menu button for an account in the menu with nothing else in it', async () => {
      getAccountControlMock.mockResolvedValueOnce(ACCOUNT_IN_PHONE_MENU);

      await setup();

      const toggleButton = queryPhoneMenuToggle();

      expect(toggleButton).not.toBeInTheDocument();
    });

    describe('for a signed-in reader', () => {
      beforeEach(() => {
        useSessionMock.mockReturnValue({
          data: { user: MOCK_READER },
          status: SESSION_STATUS.AUTHENTICATED,
        });
      });

      it('keeps the account menu in the header', async () => {
        const accountMenu = await openAccountMenu();

        const settingsText = within(accountMenu).getByText(ACCOUNT_SETTINGS);
        const signOutItem = within(accountMenu).getByRole('menuitem', {
          name: SIGN_OUT,
        });

        expect(settingsText).toBeVisible();
        expect(signOutItem).toBeVisible();
      });

      it('keeps the account row in the phone menu', async () => {
        await openPhoneMenuWithAccountInIt();
        const accountRow = getDrawerAccountRow(ACCOUNT);
        await user.click(accountRow);

        const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
        const settingsText = within(drawerActions).getByText(ACCOUNT_SETTINGS);
        const signOutItem = within(drawerActions).getByRole('menuitem', {
          name: SIGN_OUT,
        });

        expect(settingsText).toBeVisible();
        expect(signOutItem).toBeVisible();
      });
    });
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('forwards the tenant Sanity context to the navigation loader', () => {
      expect(getNavigationMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.sanityContext,
      );
    });

    it("reads the tenant's header layout, sub-menu style and bar", () => {
      expect(getHeaderStyleMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
      );
    });

    it('shows the sign-in menu with Reader accounts on', () => {
      const [signInButton] = getBarSignInButtons();

      expect(signInButton).toBeVisible();
    });
  });

  describe('when navigation fails to load', () => {
    it('logs the fetch failure and still renders the header', async () => {
      getNavigationMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const banner = screen.getByRole('banner');

      expect(banner).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        NAVIGATION_LOG.LAYOUT_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});

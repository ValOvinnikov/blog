import { ACCOUNT_PHONE_PLACEMENT, LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { NAVIGATION_LOG } from '@web/constants/navigation';
import { SESSION_STATUS } from '@web/constants/session';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getAccountControl } from '@web/server/site-config/get-account-control/get-account-control';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getHeaderStyle } from '@web/server/site-config/get-header-style/get-header-style';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_CONTROL } from '@web/testing/shared/account-control/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  KEY_ARROW_DOWN,
  KEY_ARROW_UP,
  KEY_END,
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
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { SiteHeader } from './site-header';

const { getNavigationMock, getEnabledOAuthProviderIdsMock, useSessionMock } =
  vi.hoisted(() => ({
    getNavigationMock: vi.fn(),
    getEnabledOAuthProviderIdsMock: vi.fn(),
    useSessionMock: vi.fn(),
  }));

vi.mock('@web/server/request-context/request-context');

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

vi.mock('@web/server/site-config/get-header-style/get-header-style');

vi.mock(
  '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled',
  () => ({
    isReaderAccountEnabled: vi.fn(),
  }),
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
const SIGN_IN = 'Sign in';
const ACCOUNT = 'Account';
const CONTINUE_WITH_GITHUB = 'Continue with GitHub';
const ACCOUNT_IN_PHONE_MENU = {
  ...MOCK_ACCOUNT_CONTROL,
  phonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
};
const HOME_LINK_NAME = 'Home';

describe(`<${SiteHeader.name}/>`, () => {
  let user: UserEvent;

  const openPhoneMenu = async () => {
    const toggleButton = screen.getByRole('button', {
      name: TOGGLE_NAVIGATION_MENU,
    });
    await user.click(toggleButton);
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
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github', 'google']);
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

    it('shows the default mark without a Look logo', async () => {
      await setup();

      const homeLink = screen.getByRole('link', { name: HOME_LINK_NAME });
      const presentation = within(homeLink).queryByRole('presentation');

      expect(presentation).not.toBeInTheDocument();
      expect(homeLink).not.toBeEmptyDOMElement();
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

      const panelRow = screen.getByTestId('primary-navigation-panel-actions');
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
      await setup();
    });

    it('adds a circle beside the wide pill', () => {
      const signInButtons = getBarSignInButtons();

      expect(signInButtons).toHaveLength(2);
    });

    it('adds no account row to the phone menu', async () => {
      await openPhoneMenu();

      const drawerActions = screen.queryByTestId(DRAWER_ACTIONS_TEST_ID);

      expect(drawerActions).not.toBeInTheDocument();
    });

    it('returns focus to the phone circle when Escape closes its panel', async () => {
      const [, phoneCircle] = getBarSignInButtons();
      await user.click(phoneCircle!);
      await user.keyboard('{Escape}');

      const signInDialog = screen.queryByRole('dialog', { name: SIGN_IN });

      expect(signInDialog).not.toBeInTheDocument();
      expect(phoneCircle).toHaveFocus();
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

    beforeEach(async () => {
      stubHidePopover();
      getNavigationMock.mockResolvedValue(
        okResult({ items: [MOCK_TOPICS_GROUP, MOCK_BLOG_LINK] }),
      );
      getAccountControlMock.mockResolvedValueOnce(ACCOUNT_IN_PHONE_MENU);
      await setup();
      await openPhoneMenu();
    });

    afterEach(() => {
      unstubHidePopover();
    });

    it('focuses the leading sub-menu row when the menu opens', () => {
      const { subMenuRow } = getPanelRows();

      expect(subMenuRow).toHaveFocus();
    });

    it('reaches the account row with ArrowDown, past the closed sub-menu', async () => {
      const { blogLink, accountRow } = getPanelRows();

      await user.keyboard(KEY_ARROW_DOWN);
      expect(blogLink).toHaveFocus();

      await user.keyboard(KEY_ARROW_DOWN);
      expect(accountRow).toHaveFocus();
    });

    it('reaches the sub-menu row with ArrowUp from the account row', async () => {
      const { subMenuRow } = getPanelRows();
      await user.keyboard(KEY_END);

      await user.keyboard(`${KEY_ARROW_UP}${KEY_ARROW_UP}`);

      expect(subMenuRow).toHaveFocus();
    });

    it('wraps Tab from the account row to the first row, and Shift+Tab back', async () => {
      const { subMenuRow, accountRow } = getPanelRows();
      await user.keyboard(KEY_END);
      expect(accountRow).toHaveFocus();

      await user.tab();
      expect(subMenuRow).toHaveFocus();

      await user.tab({ shift: true });
      expect(accountRow).toHaveFocus();
    });

    it('puts the rows of an opened sub-menu into the arrow-key order', async () => {
      const { subMenuRow } = getPanelRows();
      await user.click(subMenuRow);
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

    it('opens the sign-in panel in place and keeps the menu open', async () => {
      const accountRow = getDrawerAccountRow(SIGN_IN);
      await user.click(accountRow);

      const mobilePanel = screen.getByTestId(MOBILE_PANEL_TEST_ID);
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const githubButton = await within(drawerActions).findByRole('button', {
        name: CONTINUE_WITH_GITHUB,
      });

      expect(mobilePanel).toBeVisible();
      expect(githubButton).toBeVisible();
    });

    it('folds the account group when its row is pressed again', async () => {
      const accountRow = getDrawerAccountRow(SIGN_IN);
      await user.click(accountRow);
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const githubButton = await within(drawerActions).findByRole('button', {
        name: CONTINUE_WITH_GITHUB,
      });
      await user.click(accountRow);

      expect(githubButton).not.toBeVisible();
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
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github']);
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

  it('hides the sign-in menu without a reader-account capability', async () => {
    isReaderAccountEnabledMock.mockResolvedValue(false);

    await setup();

    const signInButton = screen.queryByRole('button', { name: SIGN_IN });

    expect(signInButton).not.toBeInTheDocument();
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

    it('shows the sign-in menu with a reader-account capability enabled', () => {
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

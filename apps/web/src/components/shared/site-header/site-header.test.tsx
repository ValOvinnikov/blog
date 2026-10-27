import { LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { SESSION_STATUS } from '@web/constants/session';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
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

vi.mock(
  '@web/server/site-config/get-brand-logo-url/get-brand-logo-url',
  () => ({
    getBrandLogoUrl: vi.fn(),
  }),
);

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

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
const getSiteSettingsMock = vi.mocked(getSiteSettings);
const isReaderAccountEnabledMock = vi.mocked(isReaderAccountEnabled);
const getBrandLogoUrlMock = vi.mocked(getBrandLogoUrl);

faker.seed(5);

const MOCK_LOOK_LOGO_URL = faker.internet.url();
const MOCK_STUDIO_LOGO = mockSanityImage({ alt: faker.lorem.word() });
const MOCK_READER = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
};

const setup = customRenderAsync(SiteHeader, {});

const TOGGLE_NAVIGATION_MENU = 'Toggle navigation menu';
const LANGUAGE_ENGLISH = 'Language: English';
const LANGUAGE_NAV_NAME = 'Language';
const DRAWER_ACTIONS_TEST_ID = 'primary-navigation-drawer-actions';
const SIGN_IN = 'Sign in';
const SIGN_IN_OPTIONS = 'Sign in options';
const CONTINUE_WITH_GITHUB = 'Continue with GitHub';
const HOME_LINK_NAME = 'Home';

describe(`<${SiteHeader.name}/>`, () => {
  let user: UserEvent;

  const openPhoneMenu = async () => {
    const toggleButton = screen.getByRole('button', {
      name: TOGGLE_NAVIGATION_MENU,
    });
    await user.click(toggleButton);
  };

  const getDrawerSignInButton = () => {
    const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
    return within(drawerActions).getByRole('button', { name: SIGN_IN });
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
    it("shows the tenant's Look logo, not the Studio brand logo", async () => {
      getBrandLogoUrlMock.mockResolvedValue(MOCK_LOOK_LOGO_URL);
      getSiteSettingsMock.mockResolvedValueOnce(
        okResult({
          ...MOCK_SITE_SETTINGS,
          brand: { ...MOCK_SITE_SETTINGS.brand, logo: MOCK_STUDIO_LOGO },
        }),
      );

      await setup();

      const homeLink = screen.getByRole('link', { name: HOME_LINK_NAME });
      const logo = within(homeLink).getByRole('presentation');

      expect(logo).toHaveAttribute('src', MOCK_LOOK_LOGO_URL);
      expect(getBrandLogoUrlMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
      );
    });

    it('shows the default mark without a Look logo', async () => {
      getSiteSettingsMock.mockResolvedValueOnce(
        okResult({
          ...MOCK_SITE_SETTINGS,
          brand: { ...MOCK_SITE_SETTINGS.brand, logo: MOCK_STUDIO_LOGO },
        }),
      );

      await setup();

      const homeLink = screen.getByRole('link', { name: HOME_LINK_NAME });
      const presentation = within(homeLink).queryByRole('presentation');

      expect(presentation).not.toBeInTheDocument();
      expect(homeLink).not.toBeEmptyDOMElement();
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

    it('puts the language pill and theme toggle before the account row', async () => {
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
      const drawerSignInButton = getDrawerSignInButton();

      expect(englishButton).toBeVisible();
      expect(switchToButton).toBeVisible();
      expect(panelSignInButton).not.toBeInTheDocument();
      expect(drawerSignInButton).toBeVisible();
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

      const signInButton = screen.getByRole('button', { name: SIGN_IN });
      await user.click(signInButton);

      const menus = screen.getAllByRole('menu');
      const signInOptionsMenu = screen.getByRole('menu', {
        name: SIGN_IN_OPTIONS,
      });

      expect(menus).toHaveLength(1);
      expect(signInOptionsMenu).toBeVisible();
    });
  });

  describe('the phone menu account row', () => {
    beforeEach(async () => {
      await setup();
      await openPhoneMenu();
    });

    it('closes the menu and opens the sign-in panel with focus on its first item', async () => {
      const drawerSignInButton = getDrawerSignInButton();
      await user.click(drawerSignInButton);

      const mobilePanel = screen.getByTestId('primary-navigation-mobile-panel');
      const githubMenuItem = screen.getByRole('menuitem', {
        name: CONTINUE_WITH_GITHUB,
      });

      expect(mobilePanel).not.toBeVisible();
      expect(githubMenuItem).toHaveFocus();
    });

    it('returns focus to the bar control when Escape closes the panel', async () => {
      const drawerSignInButton = getDrawerSignInButton();
      await user.click(drawerSignInButton);
      await user.keyboard('{Escape}');

      const signInOptionsMenu = screen.queryByRole('menu', {
        name: SIGN_IN_OPTIONS,
      });
      const signInButton = screen.getByRole('button', { name: SIGN_IN });

      expect(signInOptionsMenu).not.toBeInTheDocument();
      expect(signInButton).toHaveFocus();
    });
  });

  it('labels the phone menu account row "Account" for a signed-in reader', async () => {
    useSessionMock.mockReturnValue({
      data: { user: MOCK_READER },
      status: SESSION_STATUS.AUTHENTICATED,
    });
    await setup();
    await openPhoneMenu();

    const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
    const accountButton = within(drawerActions).getByRole('button', {
      name: 'Account',
    });

    expect(accountButton).toBeVisible();
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

    const signInButton = screen.getByRole('button', { name: SIGN_IN });
    await user.click(signInButton);

    const panel = screen.getByRole('menu');
    const githubMenuItem = within(panel).getByRole('menuitem', {
      name: CONTINUE_WITH_GITHUB,
    });
    const googleMenuItem = within(panel).queryByRole('menuitem', {
      name: 'Continue with Google',
    });

    expect(githubMenuItem).toBeVisible();
    expect(googleMenuItem).not.toBeInTheDocument();
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

    it('shows the sign-in menu with a reader-account capability enabled', () => {
      const signInButton = screen.getByRole('button', { name: SIGN_IN });

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
        'navigation.layout_fetch_failed',
        { error: MOCK_ERROR },
      );
    });
  });
});

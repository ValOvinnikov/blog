import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
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
  () => ({
    getLanguageSwitcherStyle: vi.fn(),
  }),
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

vi.mocked(getLanguageSwitcherStyle).mockResolvedValue(
  LANGUAGE_SWITCHER_STYLE.MENU_CODE,
);

const LOOK_LOGO_URL = 'https://blob.example.com/tenants/tenant-a/logo.png';
const STUDIO_LOGO = mockSanityImage({ alt: 'Logo' });

const setup = customRenderAsync(SiteHeader, {});

const TOGGLE_NAVIGATION_MENU = 'Toggle navigation menu';
const LANGUAGE_ENGLISH = 'Language: English';
const LANGUAGE_NAV = 'Language';
const HOME = 'Home';
const SIGN_IN = 'Sign in';
const DRAWER_ACTIONS_TEST_ID = 'primary-navigation-drawer-actions';
const SIGN_IN_OPTIONS = 'Sign in options';
const CONTINUE_WITH_GITHUB = 'Continue with GitHub';
const SEVERAL_LIVE_LOCALES = [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL];

const resolveSiteSettingsWithStudioLogo = () =>
  getSiteSettingsMock.mockResolvedValueOnce(
    okResult({
      ...MOCK_SITE_SETTINGS,
      brand: { ...MOCK_SITE_SETTINGS.brand, logo: STUDIO_LOGO },
    }),
  );

describe(`<${SiteHeader.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    getNavigationMock.mockResolvedValue(okResult({ items: [] }));
    getBrandLogoUrlMock.mockResolvedValue(undefined);
    getRequestContextMock.mockResolvedValue(MOCK_REQUEST_CONTEXT);
    isReaderAccountEnabledMock.mockResolvedValue(true);
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github', 'google']);
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  describe('the brand logo', () => {
    beforeEach(() => {
      resolveSiteSettingsWithStudioLogo();
    });

    it("shows the tenant's Look logo, not the Studio brand logo", async () => {
      getBrandLogoUrlMock.mockResolvedValue(LOOK_LOGO_URL);

      await setup();

      const homeLink = screen.getByRole('link', { name: HOME });
      const logo = within(homeLink).getByRole('presentation');
      expect(logo).toHaveAttribute('src', LOOK_LOGO_URL);
      expect(getBrandLogoUrlMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
      );
    });

    it('shows the default mark without a Look logo, even with a Studio logo', async () => {
      await setup();

      const homeLink = screen.getByRole('link', { name: HOME });
      const logo = within(homeLink).queryByRole('presentation');
      expect(logo).not.toBeInTheDocument();
      expect(homeLink).not.toBeEmptyDOMElement();
    });
  });

  describe('with several live languages and the switcher on', () => {
    beforeEach(async () => {
      getRequestContextMock.mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        liveLocales: SEVERAL_LIVE_LOCALES,
      });
      getNavigationMock.mockResolvedValue(
        okResult({ items: [], showLanguageSwitcher: true }),
      );
      await setup();
    });

    it('shows the language switcher in the banner', () => {
      const banner = screen.getByRole('banner');
      const switcher = within(banner).getByRole('navigation', {
        name: LANGUAGE_NAV,
      });
      expect(switcher).toBeVisible();
    });

    it('puts the language pill and theme toggle in the phone menu, the account row after', async () => {
      const menuToggle = screen.getByRole('button', {
        name: TOGGLE_NAVIGATION_MENU,
      });
      await user.click(menuToggle);

      const panelRow = screen.getByTestId('primary-navigation-panel-actions');
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const languagePill = within(panelRow).getByRole('button', {
        name: LANGUAGE_ENGLISH,
      });
      const themeToggle = within(panelRow).getByRole('button', {
        name: /Switch to/,
      });
      const panelSignIn = within(panelRow).queryByRole('button', {
        name: SIGN_IN,
      });
      const drawerSignIn = within(drawerActions).getByRole('button', {
        name: SIGN_IN,
      });
      expect(languagePill).toBeVisible();
      expect(themeToggle).toBeVisible();
      expect(panelSignIn).not.toBeInTheDocument();
      expect(drawerSignIn).toBeVisible();
    });

    it('closes the open language menu when the sign-in panel opens', async () => {
      const [languagePill] = screen.getAllByRole('button', {
        name: LANGUAGE_ENGLISH,
      });
      await user.click(languagePill!);
      const languageMenu = screen.getByRole('menu', { name: LANGUAGE_NAV });
      expect(languageMenu).toBeVisible();

      const signInButton = screen.getByRole('button', { name: SIGN_IN });
      await user.click(signInButton);

      const menus = screen.getAllByRole('menu');
      const signInMenu = screen.getByRole('menu', { name: SIGN_IN_OPTIONS });
      expect(menus).toHaveLength(1);
      expect(signInMenu).toBeVisible();
    });
  });

  describe('the phone menu account row', () => {
    beforeEach(async () => {
      await setup();
      const menuToggle = screen.getByRole('button', {
        name: TOGGLE_NAVIGATION_MENU,
      });
      await user.click(menuToggle);
      const drawerSignIn = within(
        screen.getByTestId(DRAWER_ACTIONS_TEST_ID),
      ).getByRole('button', { name: SIGN_IN });
      await user.click(drawerSignIn);
    });

    it('closes the menu and opens the sign-in panel with focus on its first item', () => {
      const mobilePanel = screen.getByTestId('primary-navigation-mobile-panel');
      const firstItem = screen.getByRole('menuitem', {
        name: CONTINUE_WITH_GITHUB,
      });
      expect(mobilePanel).not.toBeVisible();
      expect(firstItem).toHaveFocus();
    });

    it('returns focus to the bar control when Escape closes the panel', async () => {
      await user.keyboard('{Escape}');

      const signInMenu = screen.queryByRole('menu', { name: SIGN_IN_OPTIONS });
      const signInButton = screen.getByRole('button', { name: SIGN_IN });
      expect(signInMenu).not.toBeInTheDocument();
      expect(signInButton).toHaveFocus();
    });
  });

  it('labels the phone menu account row "Account" for a signed-in reader', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Ada Lovelace', email: 'ada@example.com' } },
      status: 'authenticated',
    });
    await setup();
    const menuToggle = screen.getByRole('button', {
      name: TOGGLE_NAVIGATION_MENU,
    });

    await user.click(menuToggle);

    const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
    const accountButton = within(drawerActions).getByRole('button', {
      name: 'Account',
    });
    expect(accountButton).toBeVisible();
  });

  it.each([
    [
      'hides the language switcher when its toggle is off',
      { liveLocales: SEVERAL_LIVE_LOCALES },
      {},
    ],
    [
      'shows no language switcher with one live language, whatever the toggle says',
      {},
      { showLanguageSwitcher: true },
    ],
  ])('%s', async (_title, contextOverrides, navigationOverrides) => {
    getRequestContextMock.mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      ...contextOverrides,
    });
    getNavigationMock.mockResolvedValue(
      okResult({ items: [], ...navigationOverrides }),
    );

    await setup();

    const switcher = screen.queryByRole('navigation', { name: LANGUAGE_NAV });
    expect(switcher).not.toBeInTheDocument();
  });

  it('offers only the enabled OAuth providers in the sign-in panel', async () => {
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github']);
    await setup();
    const signInButton = screen.getByRole('button', { name: SIGN_IN });

    await user.click(signInButton);

    const panel = screen.getByRole('menu');
    const github = within(panel).getByRole('menuitem', {
      name: CONTINUE_WITH_GITHUB,
    });
    const google = within(panel).queryByRole('menuitem', {
      name: 'Continue with Google',
    });
    expect(github).toBeVisible();
    expect(google).not.toBeInTheDocument();
  });

  it('hides the sign-in menu without the reader-account capability', async () => {
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

    it('shows the sign-in menu with the reader-account capability', () => {
      const signInButton = screen.getByRole('button', { name: SIGN_IN });
      expect(signInButton).toBeVisible();
    });
  });

  describe('when navigation fails to load', () => {
    it('logs navigation.layout_fetch_failed and still renders the header', async () => {
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

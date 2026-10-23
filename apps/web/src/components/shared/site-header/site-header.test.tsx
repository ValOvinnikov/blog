import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import userEvent from '@testing-library/user-event';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
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

vi.mock(
  '@web/server/site-settings/get-site-settings/get-site-settings',
  () => ({
    getSiteSettings: vi.fn(),
  }),
);

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
const STUDIO_LOGO = { assetId: 'image-abc123def-800x600-svg', alt: 'Logo' };

const setup = customRenderAsync(SiteHeader, {});

const TOGGLE_NAVIGATION_MENU = 'Toggle navigation menu';
const LANGUAGE_ENGLISH = 'Language: English';
const DRAWER_ACTIONS_TEST_ID = 'primary-navigation-drawer-actions';
const SIGN_IN_OPTIONS = 'Sign in options';
const CONTINUE_WITH_GITHUB = 'Continue with GitHub';

describe(SiteHeader, () => {
  beforeEach(() => {
    getSiteSettingsMock.mockResolvedValue(
      okResult({ brand: { name: 'Blog', logo: undefined } }) as never,
    );
    getNavigationMock.mockResolvedValue(okResult({ items: [] }));
    getBrandLogoUrlMock.mockResolvedValue(undefined);
    getRequestContextMock.mockResolvedValue(MOCK_REQUEST_CONTEXT);
    isReaderAccountEnabledMock.mockResolvedValue(true);
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github', 'google']);
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  describe('the brand logo', () => {
    it("shows the tenant's Look logo, not the Studio brand logo", async () => {
      getBrandLogoUrlMock.mockResolvedValue(LOOK_LOGO_URL);
      getSiteSettingsMock.mockResolvedValue(
        okResult({ brand: { name: 'Blog', logo: STUDIO_LOGO } }) as never,
      );

      await setup();

      const homeLink = screen.getByRole('link', { name: 'Home' });
      const logo = within(homeLink).getByRole('presentation');

      expect(logo).toHaveAttribute('src', LOOK_LOGO_URL);
      expect(getBrandLogoUrlMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.tenantId,
      );
    });

    it('shows the default mark without a Look logo, despite a Studio logo', async () => {
      getSiteSettingsMock.mockResolvedValue(
        okResult({ brand: { name: 'Blog', logo: STUDIO_LOGO } }) as never,
      );

      await setup();

      const homeLink = screen.getByRole('link', { name: 'Home' });
      const presentation = within(homeLink).queryByRole('presentation');

      expect(presentation).not.toBeInTheDocument();
      expect(homeLink).not.toBeEmptyDOMElement();
    });
  });

  describe('with several live languages and the switcher on', () => {
    beforeEach(async () => {
      getRequestContextMock.mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });
      getNavigationMock.mockResolvedValue(
        okResult({ items: [], showLanguageSwitcher: true }),
      );
      await setup();
    });

    it('shows the language switcher when its toggle is on and several languages are live', async () => {
      const banner = screen.getByRole('banner');
      const languageNav = within(banner).getByRole('navigation', {
        name: 'Language',
      });

      expect(languageNav).toBeVisible();
    });

    it('puts the language pill and theme toggle before the account row in the phone menu', async () => {
      const toggleButton = screen.getByRole('button', {
        name: TOGGLE_NAVIGATION_MENU,
      });
      await userEvent.click(toggleButton);
      const panelRow = screen.getByTestId('primary-navigation-panel-actions');

      const englishButton = within(panelRow).getByRole('button', {
        name: LANGUAGE_ENGLISH,
      });
      const switchToButton = within(panelRow).getByRole('button', {
        name: /Switch to/,
      });
      const signInButton = within(panelRow).queryByRole('button', {
        name: 'Sign in',
      });

      expect(englishButton).toBeVisible();
      expect(switchToButton).toBeVisible();
      expect(signInButton).not.toBeInTheDocument();
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const drawerSignInButton = within(drawerActions).getByRole('button', {
        name: 'Sign in',
      });

      expect(drawerSignInButton).toBeVisible();
    });

    it('closes the open language menu when the sign-in panel opens', async () => {
      const user = userEvent.setup();

      const languageButton = screen.getAllByRole('button', {
        name: LANGUAGE_ENGLISH,
      })[0]!;
      await user.click(languageButton);
      const languageMenu = screen.getByRole('menu', { name: 'Language' });

      expect(languageMenu).toBeVisible();

      const signInButton = screen.getByRole('button', { name: 'Sign in' });
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
      const toggleButton = screen.getByRole('button', {
        name: TOGGLE_NAVIGATION_MENU,
      });
      await userEvent.click(toggleButton);
    });

    it('closes the menu and opens the sign-in panel with focus on its first item', async () => {
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const drawerSignInButton = within(drawerActions).getByRole('button', {
        name: 'Sign in',
      });
      await userEvent.click(drawerSignInButton);

      const mobilePanel = screen.getByTestId('primary-navigation-mobile-panel');
      const githubMenuItem = screen.getByRole('menuitem', {
        name: CONTINUE_WITH_GITHUB,
      });

      expect(mobilePanel).not.toBeVisible();
      expect(githubMenuItem).toHaveFocus();
    });

    it('returns focus to the bar control when Escape closes the panel', async () => {
      const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
      const drawerSignInButton = within(drawerActions).getByRole('button', {
        name: 'Sign in',
      });
      await userEvent.click(drawerSignInButton);
      await userEvent.keyboard('{Escape}');

      const signInOptionsMenu = screen.queryByRole('menu', {
        name: SIGN_IN_OPTIONS,
      });
      const signInButton = screen.getByRole('button', { name: 'Sign in' });

      expect(signInOptionsMenu).not.toBeInTheDocument();
      expect(signInButton).toHaveFocus();
    });
  });

  it('labels the phone menu account row "Account" for a signed-in reader', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Ada Lovelace', email: 'ada@example.com' } },
      status: 'authenticated',
    });
    await setup();

    const toggleButton = screen.getByRole('button', {
      name: TOGGLE_NAVIGATION_MENU,
    });
    await userEvent.click(toggleButton);

    const drawerActions = screen.getByTestId(DRAWER_ACTIONS_TEST_ID);
    const accountButton = within(drawerActions).getByRole('button', {
      name: 'Account',
    });

    expect(accountButton).toBeVisible();
  });

  it('hides the language switcher when its toggle is off', async () => {
    getRequestContextMock.mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });

    await setup();

    const languageNav = screen.queryByRole('navigation', { name: 'Language' });

    expect(languageNav).not.toBeInTheDocument();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getNavigationMock.mockResolvedValue(
      okResult({ items: [], showLanguageSwitcher: true }),
    );

    await setup();

    const languageNav = screen.queryByRole('navigation', { name: 'Language' });

    expect(languageNav).not.toBeInTheDocument();
  });

  it('passes the enabled OAuth provider ids into AuthMenu', async () => {
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github']);
    await setup();
    const user = userEvent.setup();

    const signInButton = screen.getByRole('button', { name: 'Sign in' });
    await user.click(signInButton);
    const panel = screen.getByRole('menu');

    const githubMenuItem = within(panel).getByRole('menuitem', {
      name: CONTINUE_WITH_GITHUB,
    });
    const continueWithGoogleMenuItem = within(panel).queryByRole('menuitem', {
      name: 'Continue with Google',
    });

    expect(githubMenuItem).toBeVisible();
    expect(continueWithGoogleMenuItem).not.toBeInTheDocument();
  });

  it('hides the sign-in menu when the tenant has no reader-account capability enabled', async () => {
    isReaderAccountEnabledMock.mockResolvedValue(false);

    await setup();

    const signInButton = screen.queryByRole('button', { name: 'Sign in' });

    expect(signInButton).not.toBeInTheDocument();
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('forwards the tenant Sanity context to the navigation loader', async () => {
      expect(getNavigationMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.sanityContext,
      );
    });

    it('shows the sign-in menu when the tenant has a reader-account capability enabled', async () => {
      const signInButton = screen.getByRole('button', { name: 'Sign in' });

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

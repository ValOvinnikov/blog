import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
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
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'Blog', logo: undefined } },
    } as never);
    getNavigationMock.mockResolvedValue({ ok: true, data: { items: [] } });
    getBrandLogoUrlMock.mockResolvedValue(undefined);
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    isReaderAccountEnabledMock.mockResolvedValue(true);
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github', 'google']);
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  describe('the brand logo', () => {
    it("shows the tenant's Look logo, not the Studio brand logo", async () => {
      getBrandLogoUrlMock.mockResolvedValue(LOOK_LOGO_URL);
      getSiteSettingsMock.mockResolvedValue({
        ok: true,
        data: { brand: { name: 'Blog', logo: STUDIO_LOGO } },
      } as never);

      await setup();

      expect(
        within(screen.getByRole('link', { name: 'Home' })).getByRole(
          'presentation',
        ),
      ).toHaveAttribute('src', LOOK_LOGO_URL);
      expect(getBrandLogoUrlMock).toHaveBeenCalledWith(
        DEFAULT_REQUEST_CONTEXT.tenantId,
      );
    });

    it('shows the default mark when no Look logo is uploaded, even with a Studio brand logo', async () => {
      getSiteSettingsMock.mockResolvedValue({
        ok: true,
        data: { brand: { name: 'Blog', logo: STUDIO_LOGO } },
      } as never);

      await setup();

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(
        within(homeLink).queryByRole('presentation'),
      ).not.toBeInTheDocument();
      expect(homeLink).not.toBeEmptyDOMElement();
    });
  });

  describe('with several live languages and the switcher on', () => {
    beforeEach(async () => {
      getRequestContextMock.mockResolvedValue({
        ...DEFAULT_REQUEST_CONTEXT,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });
      getNavigationMock.mockResolvedValue({
        ok: true,
        data: { items: [], showLanguageSwitcher: true },
      });
      await setup();
    });

    it('shows the language switcher when its toggle is on and several languages are live', async () => {
      expect(
        within(screen.getByRole('banner')).getByRole('navigation', {
          name: 'Language',
        }),
      ).toBeVisible();
    });

    it('puts the language pill and theme toggle in the open phone menu panel, and the account entry in its own row after them', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: TOGGLE_NAVIGATION_MENU }),
      );
      const panelRow = screen.getByTestId('primary-navigation-panel-actions');

      expect(
        within(panelRow).getByRole('button', { name: LANGUAGE_ENGLISH }),
      ).toBeVisible();
      expect(
        within(panelRow).getByRole('button', { name: /Switch to/ }),
      ).toBeVisible();
      expect(
        within(panelRow).queryByRole('button', { name: 'Sign in' }),
      ).not.toBeInTheDocument();
      expect(
        within(screen.getByTestId(DRAWER_ACTIONS_TEST_ID)).getByRole('button', {
          name: 'Sign in',
        }),
      ).toBeVisible();
    });

    it('closes the open language menu when the sign-in panel opens', async () => {
      const user = userEvent.setup();

      await user.click(
        screen.getAllByRole('button', { name: LANGUAGE_ENGLISH })[0]!,
      );
      expect(screen.getByRole('menu', { name: 'Language' })).toBeVisible();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(screen.getAllByRole('menu')).toHaveLength(1);
      expect(screen.getByRole('menu', { name: SIGN_IN_OPTIONS })).toBeVisible();
    });
  });

  describe('the phone menu account row', () => {
    beforeEach(async () => {
      await setup();
      await userEvent.click(
        screen.getByRole('button', { name: TOGGLE_NAVIGATION_MENU }),
      );
    });

    it('closes the menu and opens the sign-in panel with focus on its first item', async () => {
      await userEvent.click(
        within(screen.getByTestId(DRAWER_ACTIONS_TEST_ID)).getByRole('button', {
          name: 'Sign in',
        }),
      );

      expect(
        screen.getByTestId('primary-navigation-mobile-panel'),
      ).not.toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: CONTINUE_WITH_GITHUB }),
      ).toHaveFocus();
    });

    it('returns focus to the bar control when Escape closes the panel', async () => {
      await userEvent.click(
        within(screen.getByTestId(DRAWER_ACTIONS_TEST_ID)).getByRole('button', {
          name: 'Sign in',
        }),
      );
      await userEvent.keyboard('{Escape}');

      expect(
        screen.queryByRole('menu', { name: SIGN_IN_OPTIONS }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveFocus();
    });
  });

  it('labels the phone menu account row "Account" for a signed-in reader', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Ada Lovelace', email: 'ada@example.com' } },
      status: 'authenticated',
    });
    await setup();

    await userEvent.click(
      screen.getByRole('button', { name: TOGGLE_NAVIGATION_MENU }),
    );

    expect(
      within(screen.getByTestId(DRAWER_ACTIONS_TEST_ID)).getByRole('button', {
        name: 'Account',
      }),
    ).toBeVisible();
  });

  it('hides the language switcher when its toggle is off', async () => {
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getNavigationMock.mockResolvedValue({
      ok: true,
      data: { items: [], showLanguageSwitcher: true },
    });

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
  });

  it('passes the enabled OAuth provider ids into AuthMenu', async () => {
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github']);
    await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const panel = screen.getByRole('menu');

    expect(
      within(panel).getByRole('menuitem', { name: CONTINUE_WITH_GITHUB }),
    ).toBeVisible();
    expect(
      within(panel).queryByRole('menuitem', { name: 'Continue with Google' }),
    ).not.toBeInTheDocument();
  });

  it('hides the sign-in menu when the tenant has no reader-account capability enabled', async () => {
    isReaderAccountEnabledMock.mockResolvedValue(false);

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('forwards the tenant Sanity context to the navigation loader', async () => {
      expect(getNavigationMock).toHaveBeenCalledWith(
        DEFAULT_REQUEST_CONTEXT.sanityContext,
      );
    });

    it('shows the sign-in menu when the tenant has a reader-account capability enabled', async () => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });
  });

  describe('when navigation fails to load', () => {
    it('logs navigation.layout_fetch_failed and still renders the header', async () => {
      getNavigationMock.mockResolvedValue({ ok: false, error: 'boom' });

      await setup();

      expect(screen.getByRole('banner')).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'navigation.layout_fetch_failed',
        expect.anything(),
      );
    });
  });
});

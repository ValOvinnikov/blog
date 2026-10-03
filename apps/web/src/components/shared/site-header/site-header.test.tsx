import { LOCALE_ISO_CODES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { SiteHeader } from './site-header';

const {
  getNavigationMock,
  getEnabledOAuthProviderIdsMock,
  urlForSanityImageMock,
  useSessionMock,
} = vi.hoisted(() => ({
  getNavigationMock: vi.fn(),
  getEnabledOAuthProviderIdsMock: vi.fn(),
  urlForSanityImageMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-language-switcher-style/get-language-switcher-style', () => ({
  getLanguageSwitcherStyle: vi.fn().mockResolvedValue('MENU_CODE'),
}));

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings', () => ({
  getSiteSettings: vi.fn(),
}));

vi.mock('@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled', () => ({
  isReaderAccountEnabled: vi.fn(),
}));

vi.mock('@blog/auth/utils/oauth-providers/oauth-providers', () => ({
  getEnabledOAuthProviderIds: getEnabledOAuthProviderIdsMock,
}));

vi.mock('@blog/service', () => ({
  service: {
    global: { navigation: { v1: { getNavigation: getNavigationMock } } },
  },
  urlForSanityImage: urlForSanityImageMock,
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const getRequestContextMock = vi.mocked(getRequestContext);
const getSiteSettingsMock = vi.mocked(getSiteSettings);
const isReaderAccountEnabledMock = vi.mocked(isReaderAccountEnabled);

const setup = customRenderAsync(SiteHeader, {});

describe(SiteHeader, () => {
  beforeEach(() => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'Blog', logo: undefined } },
    } as never);
    getNavigationMock.mockResolvedValue({ ok: true, data: { items: [] } });
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    isReaderAccountEnabledMock.mockResolvedValue(true);
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github', 'google']);
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  it('forwards the tenant Sanity context to the navigation loader', async () => {
    await setup();

    expect(getNavigationMock).toHaveBeenCalledWith(
      DEFAULT_REQUEST_CONTEXT.sanityContext,
    );
  });

  it('shows the language switcher when its toggle is on and several languages are live', async () => {
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getNavigationMock.mockResolvedValue({
      ok: true,
      data: { items: [], showLanguageSwitcher: true },
    });

    await setup();

    expect(
      within(screen.getByRole('banner')).getByRole('navigation', {
        name: 'Language',
      }),
    ).toBeVisible();
  });

  it('puts the language pill and theme toggle in the open phone menu panel, leaving account in the bar', async () => {
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getNavigationMock.mockResolvedValue({
      ok: true,
      data: { items: [], showLanguageSwitcher: true },
    });

    await setup();
    await userEvent.click(
      screen.getByRole('button', { name: 'Toggle navigation menu' }),
    );
    const panelRow = screen.getByTestId('primary-navigation-panel-actions');

    expect(
      within(panelRow).getByRole('button', { name: 'Language: English' }),
    ).toBeVisible();
    expect(
      within(panelRow).getByRole('button', { name: /Switch to/ }),
    ).toBeVisible();
    expect(
      within(panelRow).queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
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
      within(panel).getByRole('menuitem', { name: 'Continue with GitHub' }),
    ).toBeVisible();
    expect(
      within(panel).queryByRole('menuitem', { name: 'Continue with Google' }),
    ).not.toBeInTheDocument();
  });

  it('shows the sign-in menu when the tenant has a reader-account capability enabled', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  it('hides the sign-in menu when the tenant has no reader-account capability enabled', async () => {
    isReaderAccountEnabledMock.mockResolvedValue(false);

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });

  describe('when navigation fails to load', () => {
    it('logs navigation.layout_fetch_failed and still renders the header', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getNavigationMock.mockResolvedValue({ ok: false, error: 'boom' });

      await setup();

      expect(screen.getByRole('banner')).toBeVisible();
      expect(
        errorSpy.mock.calls.some((call) =>
          call.some(
            (arg) =>
              typeof arg === 'string' &&
              arg.includes('navigation.layout_fetch_failed'),
          ),
        ),
      ).toBe(true);
      errorSpy.mockRestore();
    });
  });
});

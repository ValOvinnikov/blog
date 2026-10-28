import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { CSSProperties } from 'react';

import { LookSample } from './look-sample';

faker.seed(5994);

const SUBSCRIBE = 'Subscribe';
const SIGN_IN = 'Sign in';
const MENU = 'Menu';
const POSTS = 'Posts';
const ENGLISH = 'English';
const FRANCAIS = 'Français';
const LANGUAGE_ENGLISH = 'Language: English';
const CHARTING_THE_NEXT_SEASON = 'Charting the next season';
const ENGLISH_CODE = LOCALE_ISO_CODES.EN.toUpperCase();
const FRENCH_CODE = LOCALE_ISO_CODES.FR.toUpperCase();
const MOCK_DARK_ACCENT = 'oklch(0.7 0.16 28)';
const MOCK_LOGO_URL = faker.image.url();
const SAMPLE_TOKENS_TEST_ID = 'look-sample-tokens';
const CURRENT_LANGUAGE_TEST_ID = 'sample-language-code-current';
const SAMPLE_HEADER_TEST_ID = 'sample-site-header';
const SUBMENU_TEST_ID = 'sample-header-submenu';
const TOPICS = 'Topics';
const ALL_TOPICS = 'All topics';

const MOCK_HEADER: TSampleHeaderStyle = {
  layout: HEADER_LAYOUT.CLASSIC,
  submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  barStyle: HEADER_BAR_STYLE.FULL_WIDTH,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
};

const setup = customRender(LookSample, {
  tenantName: MOCK_TENANT_NAME,
  logoSrc: undefined,
  theme: MOCK_SITE_PREVIEW_THEME,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  header: MOCK_HEADER,
  hasReaderAccounts: true,
});

describe(`<${LookSample.name}/>`, () => {
  let staticDarkRamp: HTMLStyleElement;

  beforeEach(() => {
    staticDarkRamp = document.createElement('style');
    staticDarkRamp.textContent =
      '.dark { --brand-primary: oklch(0.7 0.16 250); }';
    document.head.append(staticDarkRamp);
  });

  afterEach(() => {
    staticDarkRamp.remove();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setup();
    });

    it('shows the tenant name and a Subscribe button', () => {
      const tenantNames = screen.getAllByText(MOCK_TENANT_NAME);
      const subscribeButton = screen.getByRole('button', { name: SUBSCRIBE });

      expect(tenantNames.length).toBeGreaterThan(0);
      expect(subscribeButton).toBeVisible();
    });

    it('keeps the sample out of the tab order and the page outline', () => {
      const tokens = screen.getByTestId(SAMPLE_TOKENS_TEST_ID);

      expect(tokens).toHaveAttribute('inert');
    });

    it('renders one linked and one static item card beside an outlined card', () => {
      const linkedCard = screen.getByRole('link', {
        name: 'Notes from the harbour',
      });
      const staticCardHeading = screen.getByRole('heading', {
        level: 4,
        name: CHARTING_THE_NEXT_SEASON,
      });
      const staticCardLink = screen.queryByRole('link', {
        name: CHARTING_THE_NEXT_SEASON,
      });
      const outlinedCardHeading = screen.getByRole('heading', {
        level: 4,
        name: 'Newsletter',
      });

      expect(linkedCard).toBeVisible();
      expect(staticCardHeading).toBeVisible();
      expect(staticCardLink).not.toBeInTheDocument();
      expect(outlinedCardHeading).toBeVisible();
    });

    it('opens with a header carrying the brand and two nav links', () => {
      const header = screen.getByRole('banner');
      const postsLink = screen.getByRole('link', { name: POSTS });
      const aboutLink = screen.getByRole('link', { name: 'About' });

      expect(header).toHaveTextContent(MOCK_TENANT_NAME);
      expect(postsLink).toBeVisible();
      expect(aboutLink).toBeVisible();
    });

    it('shows the theme toggle and a Sign in pill when the site has reader accounts', () => {
      const themeToggle = screen.getByRole('button', {
        name: 'Switch to dark theme',
      });
      const signInButton = screen.getByRole('button', { name: SIGN_IN });

      expect(themeToggle).toBeVisible();
      expect(signInButton).toHaveTextContent(SIGN_IN);
    });

    it('shows every live language as a code with compact codes', () => {
      const current = screen.getByTestId(CURRENT_LANGUAGE_TEST_ID);
      const englishLink = screen.queryByRole('link', { name: ENGLISH });
      const frenchLink = screen.getByRole('link', { name: FRANCAIS });
      const languageMenu = screen.queryByRole('button', {
        name: LANGUAGE_ENGLISH,
      });

      expect(current).toHaveAttribute('aria-current', 'page');
      expect(current).toHaveTextContent(ENGLISH);
      expect(englishLink).not.toBeInTheDocument();
      expect(frenchLink).toHaveTextContent(FRENCH_CODE);
      expect(languageMenu).not.toBeInTheDocument();
    });
  });

  it('resolves the tenant accent in dark mode', () => {
    setup({
      theme: {
        ...MOCK_SITE_PREVIEW_THEME,
        isDark: true,
        tokenStyle: { '--brand-primary': MOCK_DARK_ACCENT } as CSSProperties,
      },
    });

    const button = screen.getByRole('button', { name: SUBSCRIBE });

    const brandPrimary =
      getComputedStyle(button).getPropertyValue('--brand-primary');

    expect(brandPrimary).toBe(MOCK_DARK_ACCENT);
  });

  it('renders the uploaded logo in place of the generated mark', () => {
    setup({ logoSrc: MOCK_LOGO_URL });

    const logo = screen.getByRole('img', { name: MOCK_TENANT_NAME });

    expect(logo).toHaveAttribute('src', MOCK_LOGO_URL);
  });

  it('offers the light theme from a dark preview', () => {
    setup({ theme: { ...MOCK_SITE_PREVIEW_THEME, isDark: true } });

    const themeToggle = screen.getByRole('button', {
      name: 'Switch to light theme',
    });

    expect(themeToggle).toBeVisible();
  });

  it('shows no Sign in when the site has no reader accounts', () => {
    setup({ hasReaderAccounts: false });

    const signInButton = screen.queryByRole('button', { name: SIGN_IN });

    expect(signInButton).not.toBeInTheDocument();
  });

  it('shows the brand, the person circle and the menu button on a narrow preview', () => {
    setup({ isNarrow: true });

    const header = screen.getByRole('banner');
    const signInButton = screen.getByRole('button', { name: SIGN_IN });
    const menuButton = screen.getByRole('button', { name: MENU });
    const postsLink = screen.queryByRole('link', { name: POSTS });
    const currentLanguage = screen.queryByTestId(CURRENT_LANGUAGE_TEST_ID);

    expect(header).toHaveTextContent(MOCK_TENANT_NAME);
    expect(signInButton).toHaveTextContent('');
    expect(menuButton).toBeVisible();
    expect(postsLink).not.toBeInTheDocument();
    expect(currentLanguage).not.toBeInTheDocument();
  });

  it('keeps the narrow bar to the brand and the menu button without reader accounts', () => {
    setup({ isNarrow: true, hasReaderAccounts: false });

    const menuButton = screen.getByRole('button', { name: MENU });
    const signInButton = screen.queryByRole('button', { name: SIGN_IN });

    expect(menuButton).toBeVisible();
    expect(signInButton).not.toBeInTheDocument();
  });

  it('shows a menu pill with the current code for menu with code', () => {
    setup({
      header: {
        ...MOCK_HEADER,
        languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      },
    });

    const languageMenu = screen.getByRole('button', { name: LANGUAGE_ENGLISH });
    const frenchLink = screen.queryByRole('link', { name: FRANCAIS });

    expect(languageMenu).toHaveTextContent(ENGLISH_CODE);
    expect(frenchLink).not.toBeInTheDocument();
  });

  it('shows a globe menu without a code for menu with globe', () => {
    setup({
      header: {
        ...MOCK_HEADER,
        languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
      },
    });

    const languageMenu = screen.getByRole('button', { name: LANGUAGE_ENGLISH });

    expect(languageMenu).not.toHaveTextContent(ENGLISH_CODE);
  });

  it('falls back to the code menu when more than four languages are live', () => {
    setup({
      liveLocales: [
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.FR,
        LOCALE_ISO_CODES.DE,
        LOCALE_ISO_CODES.ES,
        LOCALE_ISO_CODES.NL,
      ],
    });

    const languageMenu = screen.getByRole('button', { name: LANGUAGE_ENGLISH });

    expect(languageMenu).toHaveTextContent(ENGLISH_CODE);
  });

  it('shows no switcher with one live language', () => {
    setup({
      liveLocales: [LOCALE_ISO_CODES.EN],
      header: {
        ...MOCK_HEADER,
        languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
      },
    });

    const languageMenu = screen.queryByRole('button', { name: /^Language/ });
    const englishLink = screen.queryByRole('link', { name: ENGLISH });

    expect(languageMenu).not.toBeInTheDocument();
    expect(englishLink).not.toBeInTheDocument();
  });
  describe('header arrangement', () => {
    const WIDE_LAYOUTS = Object.values(HEADER_LAYOUT).filter(
      (layout) => layout !== HEADER_LAYOUT.MENU_BUTTON,
    );

    it.each(WIDE_LAYOUTS)(
      'keeps the page links and no menu button at wide width with the %s layout',
      (layout) => {
        setup({ header: { ...MOCK_HEADER, layout } });

        const header = screen.getByTestId(SAMPLE_HEADER_TEST_ID);
        const postsLink = screen.getByRole('link', { name: POSTS });
        const menuButton = screen.queryByRole('button', { name: MENU });

        expect(header).toHaveAttribute('data-header-layout', layout);
        expect(postsLink).toBeVisible();
        expect(menuButton).not.toBeInTheDocument();
      },
    );

    it('swaps the page links for a menu button with the menu button layout', () => {
      setup({
        header: { ...MOCK_HEADER, layout: HEADER_LAYOUT.MENU_BUTTON },
      });

      const menuButton = screen.getByRole('button', { name: MENU });
      const postsLink = screen.queryByRole('link', { name: POSTS });

      expect(menuButton).toBeVisible();
      expect(postsLink).not.toBeInTheDocument();
    });

    it.each(Object.values(HEADER_LAYOUT))(
      'shows the same narrow bar with the %s layout',
      (layout) => {
        setup({ isNarrow: true, header: { ...MOCK_HEADER, layout } });

        const menuButton = screen.getByRole('button', { name: MENU });
        const postsLink = screen.queryByRole('link', { name: POSTS });
        const submenu = screen.queryByTestId(SUBMENU_TEST_ID);

        expect(menuButton).toBeVisible();
        expect(postsLink).not.toBeInTheDocument();
        expect(submenu).not.toBeInTheDocument();
      },
    );

    it.each(Object.values(HEADER_BAR_STYLE))(
      'follows the %s bar',
      (barStyle) => {
        setup({ header: { ...MOCK_HEADER, barStyle } });

        expect(screen.getByTestId(SAMPLE_HEADER_TEST_ID)).toHaveAttribute(
          'data-header-bar-style',
          barStyle,
        );
      },
    );

    it.each(Object.values(HEADER_SUBMENU_STYLE))(
      'draws the %s sub-menu open under the Topics link',
      (submenuStyle) => {
        setup({ header: { ...MOCK_HEADER, submenuStyle } });

        const submenu = screen.getByTestId(SUBMENU_TEST_ID);

        expect(screen.getByText(TOPICS)).toBeVisible();
        expect(submenu).toHaveAttribute('data-submenu-style', submenuStyle);
        expect(submenu).toHaveTextContent(ALL_TOPICS);
      },
    );
  });
});

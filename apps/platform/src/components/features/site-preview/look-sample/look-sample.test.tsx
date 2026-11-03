import {
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  SPINNER_STYLE,
  type IBusyStyle,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  SAMPLE_BUSY_BUTTON_TEST_ID,
  SAMPLE_BUSY_STYLE_ATTRIBUTE,
  SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
} from '@platform/constants/sample-busy';
import {
  SAMPLE_FOOTER_PART_TEST_ID,
  SAMPLE_FOOTER_TEST_ID,
} from '@platform/constants/sample-footer';
import {
  SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
  SAMPLE_HEADER_BAR_TEST_ID,
  SAMPLE_HEADER_FULL_TEST_ID,
  SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
  SAMPLE_HEADER_TEST_ID,
  SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
  SAMPLE_SUBMENU_TEST_ID,
} from '@platform/constants/sample-header';
import {
  SAMPLE_PART,
  SAMPLE_PART_ATTRIBUTE,
} from '@platform/constants/sample-part';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { MOCK_SAMPLE_HEADER_STYLE } from '@platform/testing/sample-header-style';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import type { TSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
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
const TOPICS = 'Topics';
const ALL_TOPICS = 'All topics';

const {
  accountHeading: ACCOUNT,
  accountMenuAriaLabel: ACCOUNT_MENU,
  myBookmarksDescription: BOOKMARKS_DESCRIPTION,
  signOut: SIGN_OUT,
  footerArchive: ARCHIVE,
  footerCookieSettings: COOKIE_SETTINGS,
  sampleHeading: SAMPLE_HEADING,
  latestPostsHeading: LATEST_POSTS,
  readTimeChip: READ_TIME,
  firstCardDate: FIRST_CARD_DATE,
  secondCardDate: SECOND_CARD_DATE,
} = messages.lookPreview;

const MOCK_BUSY: IBusyStyle = {
  busyStyle: BUSY_BUTTON_STYLE.LABEL,
  spinnerVariant: SPINNER_STYLE.BRAILLE,
};

const MOCK_FOOTER: TSampleFooterStyle = {
  layout: FOOTER_LAYOUT.COLUMNS,
  tone: BRAND_VARIANT.BRAND_PRIMARY,
  surface: FOOTER_SURFACE.FULL_WIDTH,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
};

const setup = customRender(LookSample, {
  brand: { name: MOCK_TENANT_NAME, logoSrc: undefined },
  theme: MOCK_SITE_PREVIEW_THEME,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  header: MOCK_SAMPLE_HEADER_STYLE,
  footer: MOCK_FOOTER,
  busy: MOCK_BUSY,
  hasReaderAccounts: true,
});

const withinFullHeader = () => {
  const fullHeader = screen.getByTestId(SAMPLE_HEADER_FULL_TEST_ID);
  return within(fullHeader);
};

const withinBar = () => {
  const bar = screen.getByTestId(SAMPLE_HEADER_BAR_TEST_ID);
  return within(bar);
};

const setupWithHeader = (
  header: Partial<TSampleHeaderStyle>,
  props: NonNullable<Parameters<typeof setup>[0]> = {},
) => setup({ ...props, header: { ...MOCK_SAMPLE_HEADER_STYLE, ...header } });

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

    it('opens the page with the sample heading as its h1', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: SAMPLE_HEADING,
      });

      expect(heading).toBeVisible();
    });

    it('lists one linked and one static post under Latest posts and no Newsletter panel', () => {
      const latestPosts = within(
        screen.getByRole('region', { name: LATEST_POSTS }),
      );
      const linkedCard = latestPosts.getByRole('link', {
        name: 'Notes from the harbour',
      });
      const staticCardHeading = latestPosts.getByRole('heading', {
        level: 3,
        name: CHARTING_THE_NEXT_SEASON,
      });
      const staticCardLink = latestPosts.queryByRole('link', {
        name: CHARTING_THE_NEXT_SEASON,
      });
      const newsletterHeading = screen.queryByRole('heading', {
        name: 'Newsletter',
      });

      expect(linkedCard).toBeVisible();
      expect(staticCardHeading).toBeVisible();
      expect(staticCardLink).not.toBeInTheDocument();
      expect(newsletterHeading).not.toBeInTheDocument();
    });

    it('dates each post and gives its reading time, with no reading time elsewhere', () => {
      const latestPosts = screen.getByRole('region', { name: LATEST_POSTS });
      const posts = within(latestPosts).getAllByRole('article');
      const readTimes = screen.getAllByText(READ_TIME);

      expect(posts).toHaveLength(2);
      expect(posts[0]).toHaveTextContent(FIRST_CARD_DATE);
      expect(posts[1]).toHaveTextContent(SECOND_CARD_DATE);
      expect(readTimes).toHaveLength(2);
      readTimes.forEach((readTime) => {
        expect(latestPosts).toContainElement(readTime);
      });
    });

    it('marks the header and the footer as sample parts', () => {
      const header = screen.getByTestId(SAMPLE_HEADER_TEST_ID);
      const footerPart = screen.getByTestId(SAMPLE_FOOTER_PART_TEST_ID);
      const footer = screen.getByTestId(SAMPLE_FOOTER_TEST_ID);

      expect(header).toHaveAttribute(SAMPLE_PART_ATTRIBUTE, SAMPLE_PART.HEADER);
      expect(footerPart).toHaveAttribute(
        SAMPLE_PART_ATTRIBUTE,
        SAMPLE_PART.FOOTER,
      );
      expect(footerPart).toContainElement(footer);
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
      const signInButton = withinFullHeader().getByRole('button', {
        name: SIGN_IN,
      });

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

    it('pairs the brand, person circle and menu button bar with the full header', () => {
      const signInButton = withinBar().getByRole('button', { name: SIGN_IN });
      const menuButton = withinBar().getByRole('button', { name: MENU });
      const postsLink = withinBar().queryByRole('link', { name: POSTS });
      const currentLanguage = withinBar().queryByTestId(
        CURRENT_LANGUAGE_TEST_ID,
      );

      const barHeader = screen.getByTestId(SAMPLE_HEADER_BAR_TEST_ID);

      expect(barHeader).toHaveTextContent(MOCK_TENANT_NAME);
      expect(signInButton).toHaveTextContent('');
      expect(menuButton).toBeVisible();
      expect(postsLink).not.toBeInTheDocument();
      expect(currentLanguage).not.toBeInTheDocument();
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

  it('renders the uploaded logo in both headers and the footer', () => {
    setup({ brand: { name: MOCK_TENANT_NAME, logoSrc: MOCK_LOGO_URL } });

    const logos = screen.getAllByRole('img', { name: MOCK_TENANT_NAME });

    expect(logos).toHaveLength(3);
    logos.forEach((logo) => {
      expect(logo).toHaveAttribute('src', MOCK_LOGO_URL);
    });
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

  describe('account', () => {
    const setupWithAccount = (
      account: Partial<TSampleHeaderStyle['account']>,
      props: NonNullable<Parameters<typeof setup>[0]> = {},
    ) =>
      setupWithHeader(
        { account: { ...MOCK_SAMPLE_HEADER_STYLE.account, ...account } },
        props,
      );

    describe('while signed out', () => {
      beforeEach(() => {
        setup();
      });

      it('shows no account menu', () => {
        const accountMenu = screen.queryByRole('menu', { name: ACCOUNT_MENU });

        expect(accountMenu).not.toBeInTheDocument();
      });
    });

    it('opens the account menu from the Account button while signed in', () => {
      setup({ isSignedIn: true });
      const accountButton = withinFullHeader().getByRole('button', {
        name: ACCOUNT,
      });
      const accountMenu = withinFullHeader().getByRole('menu', {
        name: ACCOUNT_MENU,
      });

      expect(accountButton).toHaveAttribute('aria-expanded', 'true');
      expect(accountMenu).toBeVisible();
      expect(accountMenu).toHaveTextContent(SIGN_OUT);
    });

    it.each([
      { panelStyle: ACCOUNT_PANEL_STYLE.HUB, hasDescriptions: true },
      { panelStyle: ACCOUNT_PANEL_STYLE.CARD, hasDescriptions: false },
    ])(
      'describes the account links only in the hub panel ($panelStyle)',
      ({ panelStyle, hasDescriptions }) => {
        setupWithAccount({ panelStyle }, { isSignedIn: true });

        const description = withinFullHeader().queryByText(
          BOOKMARKS_DESCRIPTION,
        );

        expect(Boolean(description)).toBe(hasDescriptions);
      },
    );

    it('moves the account out of the bar when it sits in the menu', () => {
      setupWithAccount({ phonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU });
      const barSignIn = withinBar().queryByRole('button', { name: SIGN_IN });
      const barMenu = withinBar().getByRole('button', { name: MENU });
      const fullSignIn = withinFullHeader().getByRole('button', {
        name: SIGN_IN,
      });

      expect(barSignIn).not.toBeInTheDocument();
      expect(barMenu).toBeVisible();
      expect(fullSignIn).toBeVisible();
    });
  });

  it('keeps the bar to the brand and the menu button without reader accounts', () => {
    setup({ hasReaderAccounts: false });
    const menuButton = withinBar().getByRole('button', { name: MENU });
    const signInButton = withinBar().queryByRole('button', { name: SIGN_IN });

    expect(menuButton).toBeVisible();
    expect(signInButton).not.toBeInTheDocument();
  });

  it('shows a menu pill with the current code for menu with code', () => {
    setupWithHeader({
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    });

    const languageMenu = screen.getByRole('button', { name: LANGUAGE_ENGLISH });
    const frenchLink = screen.queryByRole('link', { name: FRANCAIS });

    expect(languageMenu).toHaveTextContent(ENGLISH_CODE);
    expect(frenchLink).not.toBeInTheDocument();
  });

  it('shows a globe menu without a code for menu with globe', () => {
    setupWithHeader({
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
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

  it('keeps the switcher with one live language when told to', () => {
    setup({
      liveLocales: [LOCALE_ISO_CODES.EN],
      shouldAlwaysShowLanguageSwitcher: true,
    });

    const current = screen.getByTestId(CURRENT_LANGUAGE_TEST_ID);

    expect(current).toHaveTextContent(ENGLISH);
  });

  it('shows no switcher with one live language', () => {
    setupWithHeader(
      { languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE },
      { liveLocales: [LOCALE_ISO_CODES.EN] },
    );

    const languageMenu = screen.queryByRole('button', { name: /^Language/ });
    const englishLink = screen.queryByRole('link', { name: ENGLISH });

    expect(languageMenu).not.toBeInTheDocument();
    expect(englishLink).not.toBeInTheDocument();
  });
  describe('busy button', () => {
    describe('with the default busy style', () => {
      beforeEach(() => {
        setup();
      });

      it('shows a busy button', () => {
        const busyButton = screen.getByRole('button', { busy: true });

        expect(busyButton).toBeVisible();
      });
    });

    it.each(Object.values(BUSY_BUTTON_STYLE))(
      'follows the %s busy style',
      (busyStyle) => {
        setup({ busy: { ...MOCK_BUSY, busyStyle } });

        const sample = screen.getByTestId(SAMPLE_BUSY_BUTTON_TEST_ID);

        expect(sample).toHaveAttribute(SAMPLE_BUSY_STYLE_ATTRIBUTE, busyStyle);
      },
    );

    it.each(
      Object.values(SPINNER_STYLE).filter((s) => s !== SPINNER_STYLE.PRESET),
    )('follows the %s spinner', (spinnerVariant) => {
      setup({ busy: { ...MOCK_BUSY, spinnerVariant } });

      const sample = screen.getByTestId(SAMPLE_BUSY_BUTTON_TEST_ID);

      expect(sample).toHaveAttribute(
        SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
        spinnerVariant,
      );
    });
  });

  describe('the footer', () => {
    describe('with the default layout', () => {
      beforeEach(() => {
        setup();
      });

      it('ends the sample with the link groups and a Cookie settings link', () => {
        const archiveLink = screen.getByRole('link', { name: ARCHIVE });
        const cookieSettingsLink = screen.getByRole('link', {
          name: COOKIE_SETTINGS,
        });

        expect(archiveLink).toBeVisible();
        expect(cookieSettingsLink).toBeVisible();
      });
    });

    it('arranges the footer by the chosen layout, dropping the link groups when compact', () => {
      setup({ footer: { ...MOCK_FOOTER, layout: FOOTER_LAYOUT.COMPACT } });

      const footer = screen.getByTestId(SAMPLE_FOOTER_TEST_ID);
      const archiveLink = screen.queryByRole('link', { name: ARCHIVE });

      expect(footer).toHaveAttribute('data-layout', FOOTER_LAYOUT.COMPACT);
      expect(archiveLink).not.toBeInTheDocument();
    });
  });

  describe('header arrangement', () => {
    const WIDE_LAYOUTS = Object.values(HEADER_LAYOUT).filter(
      (layout) => layout !== HEADER_LAYOUT.MENU_BUTTON,
    );

    it.each(WIDE_LAYOUTS)(
      'keeps the page links and no menu button at wide width with the %s layout',
      (layout) => {
        setupWithHeader({ layout });

        const header = screen.getByTestId(SAMPLE_HEADER_TEST_ID);
        const postsLink = screen.getByRole('link', { name: POSTS });
        const menuButton = withinFullHeader().queryByRole('button', {
          name: MENU,
        });

        expect(header).toHaveAttribute(SAMPLE_HEADER_LAYOUT_ATTRIBUTE, layout);
        expect(postsLink).toBeVisible();
        expect(menuButton).not.toBeInTheDocument();
      },
    );

    it('swaps the page links for a menu button with the menu button layout', () => {
      setupWithHeader({ layout: HEADER_LAYOUT.MENU_BUTTON });
      const menuButton = withinFullHeader().getByRole('button', { name: MENU });
      const postsLink = withinFullHeader().queryByRole('link', { name: POSTS });

      expect(menuButton).toBeVisible();
      expect(postsLink).not.toBeInTheDocument();
    });

    it.each(Object.values(HEADER_LAYOUT))(
      'shows the same bar with the %s layout',
      (layout) => {
        setupWithHeader({ layout }, { isSubmenuOpen: true });
        const menuButton = withinBar().getByRole('button', { name: MENU });
        const postsLink = withinBar().queryByRole('link', { name: POSTS });
        const submenu = withinBar().queryByTestId(SAMPLE_SUBMENU_TEST_ID);

        expect(menuButton).toBeVisible();
        expect(postsLink).not.toBeInTheDocument();
        expect(submenu).not.toBeInTheDocument();
      },
    );

    it.each(Object.values(HEADER_BAR_STYLE))(
      'follows the %s bar',
      (barStyle) => {
        setupWithHeader({ barStyle });

        const header = screen.getByTestId(SAMPLE_HEADER_TEST_ID);

        expect(header).toHaveAttribute(
          SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
          barStyle,
        );
      },
    );

    describe('with the default header', () => {
      beforeEach(() => {
        setup();
      });

      it('keeps the Topics sub-menu closed by default', () => {
        const topicsTrigger = screen.getByText(TOPICS);
        const submenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);

        expect(topicsTrigger).toBeVisible();
        expect(submenu).not.toBeInTheDocument();
      });
    });

    it.each(Object.values(HEADER_SUBMENU_STYLE))(
      'draws the %s sub-menu open under the Topics link when asked',
      (submenuStyle) => {
        setupWithHeader({ submenuStyle }, { isSubmenuOpen: true });

        const submenu = screen.getByTestId(SAMPLE_SUBMENU_TEST_ID);
        const topicsTrigger = screen.getByText(TOPICS);

        expect(topicsTrigger).toBeVisible();
        expect(submenu).toHaveAttribute(
          SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
          submenuStyle,
        );
        expect(submenu).toHaveTextContent(ALL_TOPICS);
      },
    );
  });
});

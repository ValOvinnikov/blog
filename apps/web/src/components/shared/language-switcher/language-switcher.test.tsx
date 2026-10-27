import {
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  routes,
  type TLocaleIsoCode,
} from '@blog/config';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import { customRender, screen, within } from '@web/testing/custom-render';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { LanguageSwitcher } from './language-switcher';

vi.mock('@web/i18n/navigation');

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

const LANGUAGE_NAV_NAME = 'Language';
const DESKTOP_TEST_ID = 'language-switcher-desktop';
const MOBILE_TEST_ID = 'language-switcher-mobile';
const CURRENT_CODE_TEST_ID = 'language-code-current';
const BLOG_PATH = '/blog';
const ARIA_EXPANDED = 'aria-expanded';

const nativeLabel = (locale: TLocaleIsoCode) => LOCALE_NATIVE_LABEL[locale];
const triggerName = (locale: TLocaleIsoCode) =>
  `${LANGUAGE_NAV_NAME}: ${nativeLabel(locale)}`;
const languageCode = (locale: TLocaleIsoCode) =>
  LOCALE_BCP47_TAGS[locale].toUpperCase();

const setup = customRender(LanguageSwitcher, {
  liveLocales: [EN, NL, FR],
  currentLocale: NL,
  defaultLocale: EN,
  switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
});

describe(`<${LanguageSwitcher.name}/>`, () => {
  let user: UserEvent;

  const openMenu = async (locale: TLocaleIsoCode = NL) => {
    const trigger = screen.getByRole('button', { name: triggerName(locale) });
    await user.click(trigger);
    return trigger;
  };

  const getMenuItem = (locale: TLocaleIsoCode) => {
    const menu = screen.getByRole('menu', { name: LANGUAGE_NAV_NAME });
    return within(menu).getByRole('menuitem', { name: nativeLabel(locale) });
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(usePathname).mockReturnValue(BLOG_PATH);
  });

  it('renders nothing with one live language', () => {
    setup({ liveLocales: [EN], currentLocale: EN });

    const languageNav = screen.queryByRole('navigation', {
      name: LANGUAGE_NAV_NAME,
    });

    expect(languageNav).not.toBeInTheDocument();
  });

  it('links to the public path on a prerendered tenant-scoped page', async () => {
    vi.mocked(usePathname).mockReturnValue(
      `/${MOCK_TENANT_ID}/${NL}/modules/latest-posts`,
    );
    setup();
    await openMenu();

    const frenchItem = getMenuItem(FR);

    expect(frenchItem).toHaveAttribute(
      'href',
      routes.switchLanguage(
        FR,
        `/${LOCALE_BCP47_TAGS[NL]}/modules/latest-posts`,
      ),
    );
  });

  it('links from the unprefixed path on the default locale', async () => {
    setup({ currentLocale: EN });
    await openMenu(EN);

    const dutchItem = getMenuItem(NL);

    expect(dutchItem).toHaveAttribute(
      'href',
      routes.switchLanguage(NL, BLOG_PATH),
    );
  });

  describe('menu with code', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a closed menu trigger naming the current language', () => {
      const trigger = screen.getByRole('button', { name: triggerName(NL) });

      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(trigger).toHaveTextContent(languageCode(NL));
    });

    it('opens a menu of native names with the current language marked', async () => {
      await openMenu();

      const menu = screen.getByRole('menu', { name: LANGUAGE_NAV_NAME });
      const items = within(menu).getAllByRole('menuitem');
      const dutchItem = getMenuItem(NL);

      expect(items.map((item) => item.textContent)).toEqual([
        nativeLabel(EN),
        nativeLabel(NL),
        nativeLabel(FR),
      ]);
      expect(dutchItem).toHaveAttribute(ARIA_CURRENT, 'page');
    });

    it('links each entry to the language switch for the current page', async () => {
      await openMenu();

      const dutchItem = getMenuItem(NL);
      const frenchItem = getMenuItem(FR);
      const nlBlogPath = `/${LOCALE_BCP47_TAGS[NL]}${BLOG_PATH}`;

      expect(dutchItem).toHaveAttribute(
        'href',
        routes.switchLanguage(NL, nlBlogPath),
      );
      expect(frenchItem).toHaveAttribute(
        'href',
        routes.switchLanguage(FR, nlBlogPath),
      );
      expect(frenchItem).toHaveAttribute('lang', LOCALE_BCP47_TAGS[FR]);
      expect(frenchItem).toHaveAttribute('hreflang', LOCALE_BCP47_TAGS[FR]);
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const trigger = await openMenu();

      await user.keyboard('{Escape}');

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(trigger).toHaveFocus();
    });
  });

  describe('menu with globe', () => {
    it('shows the globe trigger on desktop and the language pill on phones', () => {
      setup({ switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE });

      const desktop = screen.getByTestId(DESKTOP_TEST_ID);
      const mobile = screen.getByTestId(MOBILE_TEST_ID);
      const desktopTrigger = within(desktop).getByRole('button', {
        name: triggerName(NL),
      });
      const mobileTrigger = within(mobile).getByRole('button', {
        name: triggerName(NL),
      });

      expect(desktopTrigger).not.toHaveTextContent(languageCode(NL));
      expect(mobileTrigger).toHaveTextContent(languageCode(NL));
    });
  });

  describe('compact codes', () => {
    it('links the other codes directly, named for screen readers', () => {
      setup({ switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES });

      const frenchLink = screen.getByRole('link', { name: nativeLabel(FR) });

      expect(frenchLink).toHaveTextContent(languageCode(FR));
      expect(frenchLink).toHaveAttribute('lang', LOCALE_BCP47_TAGS[FR]);
    });

    it('shows the codes at every width, with no phone menu', () => {
      setup({
        switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
        liveLocales: [EN, NL],
      });

      const englishLink = screen.getByRole('link', { name: nativeLabel(EN) });
      const menuButton = screen.queryByRole('button');
      const mobileWrapper = screen.queryByTestId(MOBILE_TEST_ID);

      expect(englishLink).toBeVisible();
      expect(menuButton).not.toBeInTheDocument();
      expect(mobileWrapper).not.toBeInTheDocument();
    });

    it('shows the current code as text marked current, in its own language', () => {
      setup({ switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES });

      const currentCode = screen.getByTestId(CURRENT_CODE_TEST_ID);
      const dutchLink = screen.queryByRole('link', { name: nativeLabel(NL) });

      expect(dutchLink).not.toBeInTheDocument();
      expect(currentCode).toHaveTextContent(languageCode(NL));
      expect(currentCode).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(currentCode).toHaveAttribute('lang', LOCALE_BCP47_TAGS[NL]);
      expect(currentCode).not.toHaveAttribute('href');
    });

    it('renders as the menu with more than four live languages', () => {
      setup({
        switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
        liveLocales: [EN, NL, FR, DE, ES],
      });

      const currentCode = screen.queryByTestId(CURRENT_CODE_TEST_ID);
      const menuButton = screen.getByRole('button', { name: triggerName(NL) });

      expect(currentCode).not.toBeInTheDocument();
      expect(menuButton).toHaveTextContent(languageCode(NL));
    });
  });

  describe('in the footer', () => {
    it('names the current language on the menu trigger', () => {
      setup({ isInFooter: true });

      const menuButton = screen.getByRole('button', { name: triggerName(NL) });

      expect(menuButton).toHaveTextContent(nativeLabel(NL));
    });

    it('lists compact codes inline, linking all but the current one', () => {
      setup({ isInFooter: true, switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES });

      const items = screen.getAllByRole('listitem');
      const links = screen.getAllByRole('link');
      const entryText = (locale: TLocaleIsoCode) =>
        `${languageCode(locale)}${nativeLabel(locale)}`;

      expect(items.map((item) => item.textContent)).toEqual([
        entryText(EN),
        entryText(NL),
        entryText(FR),
      ]);
      expect(links.map((link) => link.textContent)).toEqual([
        entryText(EN),
        entryText(FR),
      ]);
    });
  });
});

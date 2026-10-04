import { LANGUAGE_SWITCHER_STYLE, LOCALE_ISO_CODES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import { customRender, screen, within } from '@web/testing/custom-render';

import { LanguageSwitcher } from './language-switcher';

vi.mock('@web/i18n/navigation');

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

const setup = customRender(LanguageSwitcher, {
  liveLocales: [EN, NL, FR],
  currentLocale: NL,
  defaultLocale: EN,
  switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
});

const openMenu = async (name = 'Language: Nederlands') => {
  const trigger = screen.getAllByRole('button', { name })[0]!;
  await userEvent.click(trigger);
  return trigger;
};

describe(`<${LanguageSwitcher.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/blog');
  });

  it('renders nothing with one live language', () => {
    setup({ liveLocales: [EN], currentLocale: EN });

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
  });

  describe('menu with code', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a closed menu trigger naming the current language', () => {
      const trigger = screen.getByRole('button', {
        name: 'Language: Nederlands',
      });

      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveTextContent('NL');
    });

    it('opens a menu of native names with the current language marked', async () => {
      await openMenu();
      const menu = screen.getByRole('menu', { name: 'Language' });

      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((item) => item.textContent),
      ).toEqual(['English', 'Nederlands', 'Français']);
      expect(
        within(menu).getByRole('menuitem', { name: 'Nederlands' }),
      ).toHaveAttribute('aria-current', 'page');
    });

    it('links each entry to the language switch for the current page', async () => {
      await openMenu();
      const menu = screen.getByRole('menu', { name: 'Language' });
      const current = within(menu).getByRole('menuitem', {
        name: 'Nederlands',
      });
      const french = within(menu).getByRole('menuitem', { name: 'Français' });

      expect(current).toHaveAttribute(
        'href',
        '/api/switch-language?to=NL&from=%2Fnl%2Fblog',
      );
      expect(french).toHaveAttribute(
        'href',
        '/api/switch-language?to=FR&from=%2Fnl%2Fblog',
      );
      expect(french).toHaveAttribute('lang', 'fr');
      expect(french).toHaveAttribute('hreflang', 'fr');
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const trigger = await openMenu();
      await userEvent.keyboard('{Escape}');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveFocus();
    });
  });

  describe('menu with globe', () => {
    it('shows the globe trigger on desktop and the language pill on phones', () => {
      setup({ switcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE });

      const desktop = screen.getByTestId('language-switcher-desktop');
      const mobile = screen.getByTestId('language-switcher-mobile');

      expect(
        within(desktop).getByRole('button', { name: 'Language: Nederlands' }),
      ).not.toHaveTextContent('NL');
      expect(
        within(mobile).getByRole('button', { name: 'Language: Nederlands' }),
      ).toHaveTextContent('NL');
    });
  });

  describe('compact codes', () => {
    it('links the codes directly on desktop, named for screen readers', () => {
      setup({ switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES });

      const desktop = screen.getByTestId('language-switcher-desktop');
      const dutch = within(desktop).getByRole('link', { name: 'Nederlands' });

      expect(dutch).toHaveTextContent('NL');
      expect(dutch).toHaveAttribute('aria-current', 'page');
      expect(within(desktop).queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders as the menu with more than four live languages', () => {
      setup({
        switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
        liveLocales: [EN, NL, FR, DE, ES],
      });

      expect(
        screen.queryByTestId('language-switcher-desktop'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Language: Nederlands' }),
      ).toHaveTextContent('NL');
    });
  });

  describe('in the footer', () => {
    it('names the current language on the menu trigger', () => {
      setup({ isInFooter: true });

      expect(
        screen.getByRole('button', { name: 'Language: Nederlands' }),
      ).toHaveTextContent('Nederlands');
    });

    it('lists compact codes inline', () => {
      setup({ isInFooter: true, switcherStyle: LANGUAGE_SWITCHER_STYLE.CODES });

      expect(
        screen.getAllByRole('link').map((link) => link.textContent),
      ).toEqual(['EN', 'NL', 'FR']);
    });
  });
});

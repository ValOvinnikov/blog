import { LOCALE_ISO_CODES } from '@blog/config';
import userEvent from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import { customRender, screen } from '@web/testing/custom-render';

import { LanguageSwitcher } from './language-switcher';

vi.mock('@web/i18n/navigation');

const { EN, NL, FR } = LOCALE_ISO_CODES;

const setup = customRender(LanguageSwitcher, {
  liveLocales: [EN, NL, FR],
  currentLocale: NL,
  defaultLocale: EN,
});

describe(`<${LanguageSwitcher.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/blog');
    document.cookie = 'NEXT_LOCALE=; max-age=0; path=/';
  });

  it('renders nothing with one live language', () => {
    setup({ liveLocales: [EN], currentLocale: EN });

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
  });

  it('lists each live language by its own name', () => {
    setup();

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(
      ['English', 'Nederlands', 'Français'],
    );
  });

  it('marks the current language and links it to the current page', () => {
    setup();

    const current = screen.getByRole('link', { name: 'Nederlands' });

    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('href', '/nl/blog');
    expect(current).toHaveAttribute('lang', 'nl');
    expect(current).toHaveAttribute('hreflang', 'nl');
  });

  it('links another language to the default-language page', () => {
    setup();

    const french = screen.getByRole('link', { name: 'Français' });

    expect(french).not.toHaveAttribute('aria-current');
    expect(french).toHaveAttribute('href', '/blog');
    expect(french).toHaveAttribute('lang', 'fr');
    expect(french).toHaveAttribute('hreflang', 'en');
  });

  it('remembers the chosen language', async () => {
    setup();

    const french = screen.getByRole('link', { name: 'Français' });
    french.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(french);

    expect(document.cookie).toContain('NEXT_LOCALE=FR');
  });
});

import { LOCALE_ISO_CODES } from '@blog/config';

import { toLanguageSwitcherLink } from './to-language-switcher-link';

const { EN, NL, FR } = LOCALE_ISO_CODES;

describe(toLanguageSwitcherLink, () => {
  it('links the current default language to the current page', () => {
    expect(
      toLanguageSwitcherLink({
        locale: EN,
        currentLocale: EN,
        defaultLocale: EN,
        pathname: '/blog',
      }),
    ).toEqual({ href: '/blog', hrefLocale: EN });
  });

  it('links the current non-default language to its prefixed page', () => {
    expect(
      toLanguageSwitcherLink({
        locale: NL,
        currentLocale: NL,
        defaultLocale: EN,
        pathname: '/blog',
      }),
    ).toEqual({ href: '/nl/blog', hrefLocale: NL });
  });

  it('prefixes the home page without a trailing slash', () => {
    expect(
      toLanguageSwitcherLink({
        locale: NL,
        currentLocale: NL,
        defaultLocale: EN,
        pathname: '/',
      }),
    ).toEqual({ href: '/nl', hrefLocale: NL });
  });

  it('falls back to the default-language page for another language', () => {
    expect(
      toLanguageSwitcherLink({
        locale: FR,
        currentLocale: NL,
        defaultLocale: EN,
        pathname: '/blog',
      }),
    ).toEqual({ href: '/blog', hrefLocale: EN });
  });
});

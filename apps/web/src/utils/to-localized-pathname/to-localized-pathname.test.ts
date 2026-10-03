import { LOCALE_ISO_CODES } from '@blog/config';

import { toLocalizedPathname } from './to-localized-pathname';

const { EN, NL } = LOCALE_ISO_CODES;

describe(toLocalizedPathname, () => {
  it('leaves the default language unprefixed', () => {
    expect(
      toLocalizedPathname({ href: '/about', locale: EN, defaultLocale: EN }),
    ).toBe('/about');
  });

  it('prefixes a non-default language with its tag', () => {
    expect(
      toLocalizedPathname({ href: '/about', locale: NL, defaultLocale: EN }),
    ).toBe('/nl/about');
  });

  it("follows the tenant's default language rather than the platform's", () => {
    expect(
      toLocalizedPathname({ href: '/about', locale: NL, defaultLocale: NL }),
    ).toBe('/about');
    expect(
      toLocalizedPathname({ href: '/about', locale: EN, defaultLocale: NL }),
    ).toBe('/en/about');
  });
});

import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { readRecipientLocale } from './read-recipient-locale';

const LIVE_LOCALES = [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR];

const magicLinkTo = (callbackUrl: string) =>
  `https://acme.example.com/api/auth/callback/email?${new URLSearchParams({
    callbackUrl,
    token: 'abc',
    email: 'jane@example.com',
  })}`;

describe(readRecipientLocale, () => {
  it('reads the language from the return-to path prefix', () => {
    const locale = readRecipientLocale(
      magicLinkTo('https://acme.example.com/fr/blog/bonjour'),
      LIVE_LOCALES,
      LOCALE_ISO_CODES.EN,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });

  it('matches the prefix regardless of case', () => {
    const locale = readRecipientLocale(
      magicLinkTo('https://acme.example.com/FR'),
      LIVE_LOCALES,
      LOCALE_ISO_CODES.EN,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });

  it.each([
    ['an unprefixed path', 'https://acme.example.com/blog/hello'],
    ['the site root', 'https://acme.example.com/'],
    [
      'a language the tenant does not offer',
      'https://acme.example.com/de/blog',
    ],
    ['an unknown prefix', 'https://acme.example.com/xx/blog'],
  ])("falls back to the tenant's default language for %s", (_, callbackUrl) => {
    const locale = readRecipientLocale(
      magicLinkTo(callbackUrl),
      LIVE_LOCALES,
      LOCALE_ISO_CODES.EN,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.EN);
  });

  it('reads a relative return-to path', () => {
    const locale = readRecipientLocale(
      magicLinkTo('/fr/blog'),
      LIVE_LOCALES,
      LOCALE_ISO_CODES.EN,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });

  it("falls back to the tenant's default language when the link has no return-to path", () => {
    const locale = readRecipientLocale(
      'https://acme.example.com/api/auth/callback/email?token=abc',
      LIVE_LOCALES,
      LOCALE_ISO_CODES.FR,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });

  it("falls back to the tenant's default language when the link is not a url", () => {
    const locale = readRecipientLocale(
      'not a url',
      LIVE_LOCALES,
      LOCALE_ISO_CODES.FR,
    );

    expect(locale).toBe(LOCALE_ISO_CODES.FR);
  });
});

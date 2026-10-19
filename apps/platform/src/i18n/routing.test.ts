import { LOCALE_ISO_CODES } from '@blog/config';
import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './routing';

const resolveLocale = async (headers: Record<string, string>) => {
  const response = await createMiddleware(routing)(
    new NextRequest('https://admin.example.com/tenants', { headers }),
  );
  const rewrite = response.headers.get('x-middleware-rewrite') ?? '';
  return new URL(rewrite).pathname.split('/')[1];
};

describe('admin language detection', () => {
  it('serves a supported browser language', async () => {
    expect(
      await resolveLocale({ 'accept-language': 'nl-NL,nl;q=0.9,en;q=0.8' }),
    ).toBe(LOCALE_ISO_CODES.NL);
  });

  it('matches a regional variant to its language', async () => {
    expect(await resolveLocale({ 'accept-language': 'de-AT' })).toBe(
      LOCALE_ISO_CODES.DE,
    );
  });

  it('falls back to English for an unsupported browser language', async () => {
    expect(await resolveLocale({ 'accept-language': 'pt-BR' })).toBe(
      LOCALE_ISO_CODES.EN,
    );
  });

  it("ignores the public site's language cookie", async () => {
    expect(
      await resolveLocale({
        'accept-language': 'en',
        cookie: `NEXT_LOCALE=${LOCALE_ISO_CODES.NL}`,
      }),
    ).toBe(LOCALE_ISO_CODES.EN);
  });

  it.each([
    ['a prefixed path', 'https://admin.example.com/nl/tenants', {}],
    ['a missing browser language', 'https://admin.example.com/tenants', {}],
    [
      'an unsupported cookie value',
      'https://admin.example.com/tenants',
      { 'accept-language': 'de', cookie: 'NEXT_LOCALE=pt' },
    ],
  ])('sets no language cookie on %s', async (_, url, headers) => {
    const response = await createMiddleware(routing)(
      new NextRequest(url, { headers }),
    );

    expect(response.cookies.get('NEXT_LOCALE')).toBeUndefined();
  });

  it('keeps the URL unprefixed', async () => {
    const response = await createMiddleware(routing)(
      new NextRequest('https://admin.example.com/tenants', {
        headers: { 'accept-language': 'es' },
      }),
    );

    expect(response.headers.get('location')).toBeNull();
  });
});

import { LOCALE_ISO_CODES } from '@blog/config';
import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { buildTenantRouting } from './routing';

const handleRequest = (url: string, headers: Record<string, string> = {}) =>
  createMiddleware(
    buildTenantRouting(LOCALE_ISO_CODES.EN, [
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]),
  )(new NextRequest(url, { headers }));

describe('tenant language routing', () => {
  it.each([
    [
      'a first visit with a Dutch browser to an English page',
      'https://site.example.com/about',
      { 'accept-language': 'nl-NL,nl;q=0.9' },
    ],
    [
      'an English page after the reader picked Dutch',
      'https://site.example.com/about',
      { cookie: `NEXT_LOCALE=${LOCALE_ISO_CODES.NL}` },
    ],
    [
      'a link to a Dutch page with no remembered language',
      'https://site.example.com/nl/over',
      {},
    ],
    [
      'a link to a Dutch page after the reader picked English',
      'https://site.example.com/nl/over',
      { cookie: `NEXT_LOCALE=${LOCALE_ISO_CODES.EN}` },
    ],
  ])('sets no language cookie on %s', async (_, url, headers) => {
    const response = await handleRequest(url, headers);

    expect(response.cookies.get('NEXT_LOCALE')).toBeUndefined();
  });
});

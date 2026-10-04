import { LOCALE_ISO_CODES } from '@blog/config';
import { NextRequest, NextResponse } from 'next/server';

import { readRememberedLanguage, rememberLanguage } from './language-cookie';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const requestWithCookie = (cookie: string) =>
  new NextRequest('https://example.com/', { headers: { cookie } });

describe(readRememberedLanguage, () => {
  it('reads a remembered live language', () => {
    expect(
      readRememberedLanguage(requestWithCookie('NEXT_LOCALE=NL').cookies, [
        EN,
        NL,
      ]),
    ).toBe(NL);
  });

  it('ignores a remembered language the tenant no longer serves', () => {
    expect(
      readRememberedLanguage(requestWithCookie('NEXT_LOCALE=FR').cookies, [
        EN,
        NL,
      ]),
    ).toBeUndefined();
  });

  it('is undefined without the cookie', () => {
    expect(
      readRememberedLanguage(requestWithCookie('theme=dark').cookies, [EN, NL]),
    ).toBeUndefined();
  });
});

describe(rememberLanguage, () => {
  it('remembers the language for a year across the whole site', () => {
    const response = NextResponse.next();

    rememberLanguage(response.cookies, FR);

    expect(response.cookies.get('NEXT_LOCALE')).toMatchObject({
      value: FR,
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  });
});

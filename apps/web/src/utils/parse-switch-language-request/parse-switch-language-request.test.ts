import { LOCALE_ISO_CODES } from '@blog/config';

import { parseSwitchLanguageRequest } from './parse-switch-language-request';

const { EN, NL } = LOCALE_ISO_CODES;

const parse = (query: Record<string, string>) =>
  parseSwitchLanguageRequest(new URLSearchParams(query), [EN, NL]);

describe(parseSwitchLanguageRequest, () => {
  it('accepts a live language and a path on this site', () => {
    expect(parse({ to: NL, from: '/nl/over-ons' })).toEqual({
      to: NL,
      from: '/nl/over-ons',
    });
  });

  it('drops the query string and fragment of the current page', () => {
    expect(parse({ to: NL, from: '/blog?page=2#top' })).toEqual({
      to: NL,
      from: '/blog',
    });
  });

  it.each(['FR', 'nl', ''])('rejects the language %j', (to) => {
    expect(parse({ to, from: '/' })).toBeUndefined();
  });

  it.each([
    'https://evil.example/',
    '//evil.example/',
    '/\\evil.example/',
    '/\t/evil.example/',
    'javascript:alert(1)',
    'over-ons',
    '',
  ])('rejects %j as the current page', (from) => {
    expect(parse({ to: NL, from })).toBeUndefined();
  });

  it('rejects a request missing either parameter', () => {
    expect(parse({ to: NL })).toBeUndefined();
    expect(parse({ from: '/' })).toBeUndefined();
  });
});

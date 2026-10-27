import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import { faker } from '@faker-js/faker';

import { parseSwitchLanguageRequest } from './parse-switch-language-request';

faker.seed(124);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_SLUG = faker.lorem.slug();
const MOCK_FOREIGN_HOST = faker.internet.domainName();
const MOCK_IN_SITE_PATH = `/${LOCALE_BCP47_TAGS.NL}/${MOCK_SLUG}`;
const QUERY_AND_FRAGMENT = '?page=2#top';

const parse = (query: Record<string, string>) =>
  parseSwitchLanguageRequest(new URLSearchParams(query), [EN, NL]);

describe(parseSwitchLanguageRequest, () => {
  it('accepts a live language and a path on this site', () => {
    const request = parse({ to: NL, from: MOCK_IN_SITE_PATH });

    expect(request).toEqual({ to: NL, from: MOCK_IN_SITE_PATH });
  });

  it('drops the query string and fragment of the current page', () => {
    const request = parse({
      to: NL,
      from: `${routes.blogIndex()}${QUERY_AND_FRAGMENT}`,
    });

    expect(request).toEqual({ to: NL, from: routes.blogIndex() });
  });

  it.each([FR, NL.toLowerCase(), ''])('rejects the language %j', (to) => {
    expect(parse({ to, from: routes.home() })).toBeUndefined();
  });

  it.each([
    `https://${MOCK_FOREIGN_HOST}/`,
    `//${MOCK_FOREIGN_HOST}/`,
    `/\\${MOCK_FOREIGN_HOST}/`,
    `/\t/${MOCK_FOREIGN_HOST}/`,
    'javascript:alert(1)',
    MOCK_SLUG,
    '',
  ])('rejects %j as the current page', (from) => {
    expect(parse({ to: NL, from })).toBeUndefined();
  });

  it.each<{ case: string; query: Record<string, string> }>([
    { case: 'the current page', query: { to: NL } },
    { case: 'the language', query: { from: routes.home() } },
  ])('rejects a request missing $case', ({ query }) => {
    expect(parse(query)).toBeUndefined();
  });
});

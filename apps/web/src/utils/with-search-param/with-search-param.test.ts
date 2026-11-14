import { faker } from '@faker-js/faker';

import { withSearchParam } from './with-search-param';

faker.seed(6882);

const MOCK_NAME = faker.lorem.word();
const MOCK_VALUE = faker.string.alphanumeric(8);
const MOCK_PATH = `/${faker.lorem.word()}`;
const MOCK_ORIGIN = faker.internet.url({ appendSlash: false });

describe(withSearchParam, () => {
  it.each([
    {
      case: 'a relative path',
      href: MOCK_PATH,
      expected: `${MOCK_PATH}?${MOCK_NAME}=${MOCK_VALUE}`,
    },
    {
      case: 'a relative path with a query and a hash',
      href: `${MOCK_PATH}?a=b#top`,
      expected: `${MOCK_PATH}?a=b&${MOCK_NAME}=${MOCK_VALUE}#top`,
    },
    {
      case: 'an absolute URL',
      href: `${MOCK_ORIGIN}${MOCK_PATH}`,
      expected: `${MOCK_ORIGIN}${MOCK_PATH}?${MOCK_NAME}=${MOCK_VALUE}`,
    },
  ])('adds the parameter to $case', ({ href, expected }) => {
    expect(withSearchParam(href, MOCK_NAME, MOCK_VALUE)).toBe(expected);
  });

  it('replaces a parameter the href already carries', () => {
    expect(
      withSearchParam(`${MOCK_PATH}?${MOCK_NAME}=old`, MOCK_NAME, MOCK_VALUE),
    ).toBe(`${MOCK_PATH}?${MOCK_NAME}=${MOCK_VALUE}`);
  });
});

import { faker } from '@faker-js/faker';

import { readCookie } from './read-cookie';

faker.seed(6012);

const MOCK_COOKIE_NAME = faker.lorem.word();
const MOCK_COOKIE_VALUE = faker.string.alphanumeric(8);
const MOCK_OTHER_COOKIE = `${faker.lorem.word()}=${faker.string.alphanumeric(4)}`;

describe(readCookie, () => {
  it('returns the value of the named cookie among others', () => {
    const cookieString = `${MOCK_OTHER_COOKIE}; ${MOCK_COOKIE_NAME}=${MOCK_COOKIE_VALUE}; ${MOCK_OTHER_COOKIE}`;

    expect(readCookie(cookieString, MOCK_COOKIE_NAME)).toBe(MOCK_COOKIE_VALUE);
  });

  it('returns an empty value for a cookie set without one', () => {
    expect(readCookie(`${MOCK_COOKIE_NAME}=`, MOCK_COOKIE_NAME)).toBe('');
  });

  it.each([
    { case: 'the cookie is absent', cookieString: MOCK_OTHER_COOKIE },
    { case: 'the cookie string is empty', cookieString: '' },
    {
      case: 'another cookie name only shares the prefix',
      cookieString: `${MOCK_COOKIE_NAME}_other=${MOCK_COOKIE_VALUE}`,
    },
  ])('returns nothing when $case', ({ cookieString }) => {
    expect(readCookie(cookieString, MOCK_COOKIE_NAME)).toBeUndefined();
  });
});

import { faker } from '@faker-js/faker';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';

import { hasNewsletterSubscribedCookie } from './has-newsletter-subscribed-cookie';

faker.seed(118);

const MOCK_COOKIE_VALUE = faker.string.alphanumeric(6);
const MOCK_OTHER_COOKIE = `${faker.lorem.word()}=${faker.string.alphanumeric(6)}`;
const SUBSCRIBED_COOKIE = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=${MOCK_COOKIE_VALUE}`;
const PREFIX_SHARING_COOKIE = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}_${faker.lorem.word()}=${MOCK_COOKIE_VALUE}`;

describe(hasNewsletterSubscribedCookie, () => {
  it.each([
    { case: 'present alone', cookies: SUBSCRIBED_COOKIE, expected: true },
    {
      case: 'present among others',
      cookies: `${MOCK_OTHER_COOKIE}; ${SUBSCRIBED_COOKIE}`,
      expected: true,
    },
    { case: 'absent', cookies: MOCK_OTHER_COOKIE, expected: false },
    { case: 'an empty cookie string', cookies: '', expected: false },
    {
      case: 'only a cookie sharing its name as a prefix',
      cookies: PREFIX_SHARING_COOKIE,
      expected: false,
    },
  ])('is $expected when the cookie is $case', ({ cookies, expected }) => {
    expect(hasNewsletterSubscribedCookie(cookies)).toBe(expected);
  });
});

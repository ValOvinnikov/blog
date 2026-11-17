import { faker } from '@faker-js/faker';
import { headers } from 'next/headers';

import { readHelpOrigin } from './read-help-origin';

faker.seed(7184);

const MOCK_HOST = faker.internet.domainName();
const MOCK_OTHER_HOST = faker.internet.domainName();
const MOCK_HELP_PATH = `/${faker.lorem.word()}/help`;
const MOCK_PAGE_PATH = `/${faker.lorem.word()}/${faker.lorem.word()}`;
const MOCK_QUERY = `?${faker.lorem.word()}=${faker.lorem.word()}`;

const requestFrom = (referer?: string) => {
  const requestHeaders = new Headers({ host: MOCK_HOST });
  if (referer) requestHeaders.set('referer', referer);
  vi.mocked(headers).mockResolvedValueOnce(requestHeaders);
};

describe(readHelpOrigin, () => {
  it('returns the path and query of the same-site page Help was opened from', async () => {
    requestFrom(`https://${MOCK_HOST}${MOCK_PAGE_PATH}${MOCK_QUERY}`);

    expect(await readHelpOrigin(MOCK_HELP_PATH)).toBe(
      `${MOCK_PAGE_PATH}${MOCK_QUERY}`,
    );
  });

  it.each([
    ['no referer', undefined],
    [
      'a referer on another site',
      `https://${MOCK_OTHER_HOST}${MOCK_PAGE_PATH}`,
    ],
    ['the Help page itself', `https://${MOCK_HOST}${MOCK_HELP_PATH}`],
    ['a referer that is not a URL', faker.lorem.word()],
  ])('returns nothing for %s', async (_name, referer) => {
    requestFrom(referer);

    expect(await readHelpOrigin(MOCK_HELP_PATH)).toBeUndefined();
  });
});

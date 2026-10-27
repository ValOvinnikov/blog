import { HTTP_METHOD } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { MOCK_BEARER_SECRET } from '@platform/testing/internal-api/fixtures';

import { hasBearerSecret } from './has-bearer-secret';

faker.seed(5998);

const MOCK_REQUEST_URL = faker.internet.url();

const bearer = (secret: string) => `Bearer ${secret}`;

const requestWith = (authorization?: string): Request =>
  new Request(MOCK_REQUEST_URL, {
    method: HTTP_METHOD.POST,
    headers: authorization ? { authorization } : {},
  });

describe(hasBearerSecret, () => {
  it('accepts the matching Bearer secret', () => {
    const request = requestWith(bearer(MOCK_BEARER_SECRET));

    expect(hasBearerSecret(request, MOCK_BEARER_SECRET)).toBe(true);
  });

  it.each([
    ['no Authorization header', undefined],
    [
      'a different secret of the same length',
      bearer(`${MOCK_BEARER_SECRET.slice(0, -1)}X`),
    ],
    ['a secret of a different length', bearer(MOCK_BEARER_SECRET.slice(0, -1))],
    ['the right secret under another scheme', `Basic ${MOCK_BEARER_SECRET}`],
  ])('rejects %s', (_case, authorization) => {
    const request = requestWith(authorization);

    expect(hasBearerSecret(request, MOCK_BEARER_SECRET)).toBe(false);
  });
});

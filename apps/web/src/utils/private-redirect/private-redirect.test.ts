import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';

import { privateRedirect } from './private-redirect';

faker.seed(125);

const MOCK_TARGET = new URL(faker.internet.url());
const PRIVATE_NO_STORE = 'private, no-store';

describe(privateRedirect, () => {
  it('redirects to the target and forbids any cache from storing it', () => {
    const response = privateRedirect(MOCK_TARGET);

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(response.headers.get('location')).toBe(MOCK_TARGET.href);
    expect(response.headers.get('cache-control')).toBe(PRIVATE_NO_STORE);
  });

  it('redirects with the given status', () => {
    const response = privateRedirect(MOCK_TARGET, HTTP_STATUS.SEE_OTHER);

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
  });
});

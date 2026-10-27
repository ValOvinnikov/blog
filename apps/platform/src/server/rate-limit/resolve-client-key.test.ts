import { faker } from '@faker-js/faker';

import { resolveClientKey, UNKNOWN_CLIENT_KEY } from './resolve-client-key';

faker.seed(5998);

const MOCK_CLIENT_IP = faker.internet.ipv4();
const MOCK_PROXY_IP = faker.internet.ipv4();

describe(resolveClientKey, () => {
  it('uses the first x-forwarded-for address', () => {
    const headers = new Headers({
      'x-forwarded-for': `${MOCK_CLIENT_IP}, ${MOCK_PROXY_IP}`,
    });

    expect(resolveClientKey(headers)).toBe(MOCK_CLIENT_IP);
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': MOCK_CLIENT_IP });

    expect(resolveClientKey(headers)).toBe(MOCK_CLIENT_IP);
  });

  it('returns unknown when neither header is present', () => {
    expect(resolveClientKey(new Headers())).toBe(UNKNOWN_CLIENT_KEY);
  });
});

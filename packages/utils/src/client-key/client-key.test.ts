import { faker } from '@faker-js/faker';

import {
  FORWARDED_FOR_HEADER,
  resolveClientKey,
  UNKNOWN_CLIENT_KEY,
} from './client-key';

faker.seed(6029);

const MOCK_CLIENT_IP = faker.internet.ipv4();
const MOCK_PROXY_IP = faker.internet.ipv4();

describe(resolveClientKey, () => {
  it('uses the first address in x-forwarded-for', () => {
    const headers = new Headers({
      [FORWARDED_FOR_HEADER]: ` ${MOCK_CLIENT_IP} , ${MOCK_PROXY_IP}`,
    });

    expect(resolveClientKey(headers)).toBe(MOCK_CLIENT_IP);
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': MOCK_CLIENT_IP });

    expect(resolveClientKey(headers)).toBe(MOCK_CLIENT_IP);
  });

  it('answers "unknown" when neither header is present', () => {
    expect(resolveClientKey(new Headers())).toBe(UNKNOWN_CLIENT_KEY);
  });
});

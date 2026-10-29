import { CRON_BEARER_PREFIX } from '@worker/constants/cron';
import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7001);

export const MOCK_CRON_SECRET = mockFaker.string.alphanumeric(32);

export function cronRequest(
  url: string,
  secret: string = MOCK_CRON_SECRET,
): Request {
  return new Request(url, {
    headers: { Authorization: `${CRON_BEARER_PREFIX}${secret}` },
  });
}

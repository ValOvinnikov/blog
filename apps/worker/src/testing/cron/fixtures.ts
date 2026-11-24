import { bearerRequest } from '@worker/testing/bearer/fixtures';
import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7001);

export const MOCK_CRON_SECRET = mockFaker.string.alphanumeric(32);

export function cronRequest(
  url: string,
  secret: string = MOCK_CRON_SECRET,
): Request {
  return bearerRequest(url, secret);
}

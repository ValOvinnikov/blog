import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7400);

export const MOCK_LOKI_ENV = {
  LOKI_PUSH_URL: mockFaker.internet.url({ protocol: 'https' }),
  LOKI_USER: mockFaker.string.numeric(6),
  LOKI_TOKEN: mockFaker.string.alphanumeric(24),
};

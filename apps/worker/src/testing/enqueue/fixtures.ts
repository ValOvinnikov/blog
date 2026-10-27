import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(6026);

export const MOCK_ENQUEUE_SECRET = mockFaker.string.alphanumeric(32);
export const MOCK_FORGED_SECRET = mockFaker.string.alphanumeric(32);
export const MOCK_WORKER_ORIGIN = mockFaker.internet.url({
  appendSlash: false,
});

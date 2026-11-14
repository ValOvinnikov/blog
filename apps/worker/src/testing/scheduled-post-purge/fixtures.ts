import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7383);

const publishedAt = mockFaker.date.future();

export const MOCK_PUBLISHED_AT = publishedAt.toISOString();
export const MOCK_LATER_PUBLISHED_AT = mockFaker.date
  .soon({ refDate: publishedAt })
  .toISOString();

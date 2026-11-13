import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7383);

export const MOCK_SCHEDULED_POST_ID = mockFaker.string.uuid();
export const MOCK_PUBLISHED_AT = '2031-05-16T09:00:00.000Z';
export const MOCK_LATER_PUBLISHED_AT = '2031-05-20T09:00:00.000Z';

import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7162);

export const MOCK_POST_ID = mockFaker.string.uuid();

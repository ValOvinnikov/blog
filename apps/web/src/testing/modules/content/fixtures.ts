import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61046);

export const MOCK_CONTENT_MODULE_ID = mockFaker.string.uuid();

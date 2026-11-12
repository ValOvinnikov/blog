import { createMockFaker } from '@blog/db/testing/mock-faker';

const newsletterPostSendsFaker = createMockFaker(7158);

export const MOCK_POST_ID = newsletterPostSendsFaker.string.uuid();
export const MOCK_OTHER_POST_ID = newsletterPostSendsFaker.string.uuid();

export const MOCK_NEXT_MONTH = new Date('2026-11-01T00:00:00.000Z');

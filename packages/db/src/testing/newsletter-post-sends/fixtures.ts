import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const newsletterPostSendsFaker = createMockFaker(7158);

export const MOCK_POST_ID = newsletterPostSendsFaker.string.uuid();
export const MOCK_OTHER_POST_ID = newsletterPostSendsFaker.string.uuid();

export const MOCK_NEXT_MONTH = new Date(
  Date.UTC(MOCK_NOW.getUTCFullYear(), MOCK_NOW.getUTCMonth() + 1),
);

import { createMockFaker } from '@blog/db/testing/mock-faker';

const bookmarksFaker = createMockFaker(61001);

export const MOCK_POST_ID = bookmarksFaker.string.uuid();
export const MOCK_OTHER_POST_ID = bookmarksFaker.string.uuid();

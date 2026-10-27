import { faker } from '@faker-js/faker';

import { toPagePostId } from './id';

faker.seed(13);

const MOCK_POST_ID = faker.string.uuid();

describe(toPagePostId, () => {
  it('derives the page_post id from a blog_post id', () => {
    expect(toPagePostId(MOCK_POST_ID)).toBe(`page_post-${MOCK_POST_ID}`);
  });
});

import { faker } from '@faker-js/faker';

import { toPageTagId, toTagPostListId } from './id';

faker.seed(31);

const MOCK_TAG_ID = faker.string.uuid();

describe(toPageTagId, () => {
  it('derives the page_tag id from a blog_tag id', () => {
    expect(toPageTagId(MOCK_TAG_ID)).toBe(`page_tag-${MOCK_TAG_ID}`);
  });
});

describe(toTagPostListId, () => {
  it('derives the module_postList id from a blog_tag id', () => {
    expect(toTagPostListId(MOCK_TAG_ID)).toBe(`postList-tag-${MOCK_TAG_ID}`);
  });
});

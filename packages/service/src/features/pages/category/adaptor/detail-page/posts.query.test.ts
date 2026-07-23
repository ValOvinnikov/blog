import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { makeRawArchivePostCard } from '@blog/service/testing/pages/fixtures';

import { buildCategoryPostsPageQuery } from './posts.query';

function makeSparseRawPostCard() {
  return makeRawArchivePostCard({
    categories: [makeRawCategory({ description: null })],
  });
}

describe('buildCategoryPostsPageQuery', () => {
  it('parses posts whose optional card fields are all absent', () => {
    const raw = { posts: [makeSparseRawPostCard()], total: 1 };

    expect(() => buildCategoryPostsPageQuery(0, 9).parse(raw)).not.toThrow();
  });
});

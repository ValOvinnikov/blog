import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { buildAuthorPostsPageQuery } from './query';

function makeSparseRawPostCard() {
  return makeRawPostCard({
    heroImage: null,
    heroImageAsset: null,
    featured: null,
    categories: [makeRawCategory({ description: null })],
  });
}

describe('buildAuthorPostsPageQuery', () => {
  it('parses posts whose optional card fields are all absent', () => {
    const raw = { posts: [makeSparseRawPostCard()], total: 1 };

    expect(() => buildAuthorPostsPageQuery(0, 9).parse(raw)).not.toThrow();
  });
});

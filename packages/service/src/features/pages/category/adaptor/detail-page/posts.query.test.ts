import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import {
  buildCategoryPostsPageQuery,
  categoryPagePostsQuery,
} from './posts.query';

function makeSparseRawPostCard() {
  return makeRawPostCard({
    heroImage: null,
    heroImageAsset: null,
    featured: null,
    categories: [makeRawCategory({ description: null })],
  });
}

describe('categoryPagePostsQuery', () => {
  it('parses posts whose optional card fields are all absent', () => {
    const raw = [makeSparseRawPostCard()];

    expect(() => categoryPagePostsQuery.parse(raw)).not.toThrow();
  });
});

describe('buildCategoryPostsPageQuery', () => {
  it('parses posts whose optional card fields are all absent', () => {
    const raw = { posts: [makeSparseRawPostCard()], total: 1 };

    expect(() => buildCategoryPostsPageQuery(0, 9).parse(raw)).not.toThrow();
  });
});

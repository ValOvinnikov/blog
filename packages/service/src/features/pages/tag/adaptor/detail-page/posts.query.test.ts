import { makeRawTopic } from '@blog/service/testing/entities/fixtures';
import { makeRawArchivePostCard } from '@blog/service/testing/pages/fixtures';

import { buildTagPostsPageQuery } from './posts.query';

function makeSparseRawPostCard() {
  return makeRawArchivePostCard({
    topic: makeRawTopic({ description: null }),
  });
}

describe('buildTagPostsPageQuery', () => {
  it('parses posts whose optional card fields are all absent', () => {
    const raw = { posts: [makeSparseRawPostCard()], total: 1 };

    expect(() => buildTagPostsPageQuery(0, 9).parse(raw)).not.toThrow();
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(buildTagPostsPageQuery(0, 9).query).toContain(
      'publishedAt <= now()',
    );
  });
});

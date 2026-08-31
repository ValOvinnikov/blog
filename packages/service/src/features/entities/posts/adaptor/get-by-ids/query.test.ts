import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { postsByIdsQuery } from './query';

describe('postsByIdsQuery', () => {
  it('parses a post card', () => {
    const raw = [makeRawPostCard()];

    expect(() => postsByIdsQuery.parse(raw)).not.toThrow();
  });

  it('filters by the given id list', () => {
    expect(postsByIdsQuery.query).toContain('_id in $ids');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(postsByIdsQuery.query).toContain('publishedAt <= now()');
  });
});

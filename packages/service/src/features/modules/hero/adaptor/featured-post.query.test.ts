import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';

describe('heroFallbackFeaturedPostQuery', () => {
  it('parses null without throwing when no post is featured', () => {
    expect(heroFallbackFeaturedPostQuery.parse(null)).toBeNull();
  });

  it('parses a matching post', () => {
    const rawPost = mockRawPostCard();

    const post = heroFallbackFeaturedPostQuery.parse(rawPost);

    expect(post?._id).toBe(rawPost._id);
    expect(post?.headingBlock).toEqual(rawPost.headingBlock);
  });
});

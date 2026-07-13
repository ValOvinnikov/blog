import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it } from 'vitest';

import { heroFallbackFeaturedPostQuery } from './featured-post.query';

describe('heroFallbackFeaturedPostQuery', () => {
  it('parses null without throwing when no post is featured', () => {
    expect(() => heroFallbackFeaturedPostQuery.parse(null)).not.toThrow();
    expect(heroFallbackFeaturedPostQuery.parse(null)).toBeNull();
  });

  it('parses a matching post', () => {
    const rawPost = makeRawPostCard();

    expect(heroFallbackFeaturedPostQuery.parse(rawPost)).toMatchObject({
      _id: rawPost._id,
      title: rawPost.title,
    });
  });
});

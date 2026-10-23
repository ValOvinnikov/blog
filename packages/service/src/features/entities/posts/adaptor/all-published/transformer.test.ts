import {
  mockFeedPostViews,
  mockRawFeedPost,
  mockRawFeedPosts,
} from '@blog/service/testing/entities/fixtures';
import {
  MOCK_POST_TITLE,
  mockRawHeadingBlock,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_HERO_IMAGE_FIELD } from '@blog/service/testing/shared/translated-posts-dataset';

import { toAllPublishedPosts } from './transformer';

describe(toAllPublishedPosts, () => {
  it('maps every raw feed post into a domain feed post', () => {
    const raw = mockRawFeedPosts();

    const result = toAllPublishedPosts(raw);

    expect(result).toEqual(mockFeedPostViews());
  });

  it('returns an empty array when there are no matches', () => {
    expect(toAllPublishedPosts([])).toEqual([]);
  });

  it('does not include author, image, topic, or word-count fields', () => {
    const [result] = toAllPublishedPosts([mockRawFeedPost()]);

    expect(result).not.toHaveProperty('author');
    expect(result).not.toHaveProperty(MOCK_HERO_IMAGE_FIELD);
    expect(result).not.toHaveProperty('topic');
    expect(result).not.toHaveProperty('readingTimeMinutes');
  });

  it('maps a sparse feed post with no excerpt to undefined', () => {
    const [result] = toAllPublishedPosts([
      mockRawFeedPost({
        headingBlock: mockRawHeadingBlock(MOCK_POST_TITLE),
      }),
    ]);

    expect(result?.excerpt).toBeUndefined();
  });
});

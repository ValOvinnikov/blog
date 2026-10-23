import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { MOCK_TOPIC_ID } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { MOCK_POST_ID } from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { relatedPostAnchorQuery } from './anchor.query';
import { getRelatedPosts } from './loader';

vi.mock('@blog/service/sanity/query/query');

const TAG_MATCH_ID = 'tag-match';
const TOPIC_MATCH_ID = 'topic-match';
const sharedTagIds = [{ _id: 'tag-a' }];
const topicId = { _id: MOCK_TOPIC_ID };
const tagMatch = {
  ...mockRawPostCard({ _id: TAG_MATCH_ID }),
  tagIds: sharedTagIds,
};

const tenant = mockTenant();

describe(getRelatedPosts, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(null);
  });

  it('ranks tag matches ahead of the topic backfill', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: sharedTagIds, topicId })
      .mockResolvedValueOnce([tagMatch])
      .mockResolvedValueOnce([mockRawPostCard({ _id: TOPIC_MATCH_ID })]);

    const posts = await getRelatedPosts(MOCK_POST_ID, 3, tenant);

    expect(posts.map((post) => post.id)).toEqual([
      TAG_MATCH_ID,
      TOPIC_MATCH_ID,
    ]);
  });

  it('skips the shared-tags query when the anchor post has no tags', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: [], topicId })
      .mockResolvedValueOnce([mockRawPostCard({ _id: TOPIC_MATCH_ID })]);

    const posts = await getRelatedPosts(MOCK_POST_ID, 3, tenant);

    expect(posts.map((post) => post.id)).toEqual([TOPIC_MATCH_ID]);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('skips the topic-backfill query when the anchor post has no primary topic', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: sharedTagIds, topicId: null })
      .mockResolvedValueOnce([tagMatch]);

    const posts = await getRelatedPosts(MOCK_POST_ID, 3, tenant);

    expect(posts.map((post) => post.id)).toEqual([TAG_MATCH_ID]);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('returns an empty list when the anchor post resolves to no candidates', async () => {
    const posts = await getRelatedPosts(MOCK_POST_ID, 3, tenant);

    expect(posts).toEqual([]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context into the anchor-post lookup, scoped by the post id', async () => {
    await getRelatedPosts(MOCK_POST_ID, 3, tenant);

    expect(mockRun).toHaveBeenCalledWith(relatedPostAnchorQuery, {
      parameters: { postId: MOCK_POST_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_POSTS_CACHE_TAG, MOCK_TOPIC_CACHE_TAG, MOCK_TAG_CACHE_TAG],
      },
    });
  });
});

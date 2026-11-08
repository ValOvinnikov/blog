import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { MOCK_TOPIC_ID } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_LINK_TARGET_CACHE_TAGS,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { MOCK_POST_ID } from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { relatedPostAnchorQuery } from './anchor.query';
import { relatedByTagsQuery } from './by-tags.query';
import { getRelatedPosts } from './loader';

vi.mock('@blog/service/sanity/query/query');

faker.seed(11);

const MOCK_RELATED_LIMIT = 3;
const MOCK_TAG_MATCH_ID = faker.string.uuid();
const MOCK_TOPIC_MATCH_ID = faker.string.uuid();
const MOCK_SHARED_TAG_IDS = [{ _id: faker.string.uuid() }];
const MOCK_TOPIC_REF = { _id: MOCK_TOPIC_ID };
const MOCK_TAG_MATCH = {
  ...mockRawPostCard({ _id: MOCK_TAG_MATCH_ID }),
  tagIds: MOCK_SHARED_TAG_IDS,
};

describe(getRelatedPosts, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(null);
  });

  it('ranks tag matches ahead of the topic backfill', async () => {
    mockRun
      .mockResolvedValueOnce({
        tagIds: MOCK_SHARED_TAG_IDS,
        topicId: MOCK_TOPIC_REF,
      })
      .mockResolvedValueOnce([MOCK_TAG_MATCH])
      .mockResolvedValueOnce([mockRawPostCard({ _id: MOCK_TOPIC_MATCH_ID })]);

    const posts = await getRelatedPosts(
      MOCK_POST_ID,
      MOCK_RELATED_LIMIT,
      MOCK_TENANT,
    );

    expect(posts.map((post) => post.id)).toEqual([
      MOCK_TAG_MATCH_ID,
      MOCK_TOPIC_MATCH_ID,
    ]);
  });

  it('skips the shared-tags query when the anchor post has no tags', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: [], topicId: MOCK_TOPIC_REF })
      .mockResolvedValueOnce([mockRawPostCard({ _id: MOCK_TOPIC_MATCH_ID })]);

    const posts = await getRelatedPosts(
      MOCK_POST_ID,
      MOCK_RELATED_LIMIT,
      MOCK_TENANT,
    );

    expect(posts.map((post) => post.id)).toEqual([MOCK_TOPIC_MATCH_ID]);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('skips the topic-backfill query when the anchor has no primary topic', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: MOCK_SHARED_TAG_IDS, topicId: null })
      .mockResolvedValueOnce([MOCK_TAG_MATCH]);

    const posts = await getRelatedPosts(
      MOCK_POST_ID,
      MOCK_RELATED_LIMIT,
      MOCK_TENANT,
    );

    expect(posts.map((post) => post.id)).toEqual([MOCK_TAG_MATCH_ID]);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('returns an empty list when the anchor post resolves to no candidates', async () => {
    const posts = await getRelatedPosts(
      MOCK_POST_ID,
      MOCK_RELATED_LIMIT,
      MOCK_TENANT,
    );

    expect(posts).toEqual([]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('looks up the anchor post by id for the tenant with its content tags', async () => {
    await getRelatedPosts(MOCK_POST_ID, MOCK_RELATED_LIMIT, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(relatedPostAnchorQuery, {
      parameters: { postId: MOCK_POST_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_POSTS_CACHE_TAG, MOCK_TOPIC_CACHE_TAG, MOCK_TAG_CACHE_TAG],
      },
    });
  });

  it('tags both candidate queries with the post-card content and its link targets', async () => {
    mockRun
      .mockResolvedValueOnce({
        tagIds: MOCK_SHARED_TAG_IDS,
        topicId: MOCK_TOPIC_REF,
      })
      .mockResolvedValue([]);

    await getRelatedPosts(MOCK_POST_ID, MOCK_RELATED_LIMIT, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(relatedByTagsQuery, {
      parameters: {
        currentId: MOCK_POST_ID,
        tagIds: MOCK_SHARED_TAG_IDS.map((tag) => tag._id),
      },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_POSTS_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
          MOCK_TAG_CACHE_TAG,
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
    expect(mockRun).toHaveBeenCalledWith(expect.anything(), {
      parameters: { currentId: MOCK_POST_ID, topicId: MOCK_TOPIC_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_POSTS_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});

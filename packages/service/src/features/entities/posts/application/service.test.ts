import { faker } from '@faker-js/faker';
import { getAllPublishedPosts } from '@shinefold/service/features/entities/posts/adaptor/all-published/loader';
import { getPostsByIds } from '@shinefold/service/features/entities/posts/adaptor/get-by-ids/loader';
import { getPostPublishedAt } from '@shinefold/service/features/entities/posts/adaptor/get-published-at/loader';
import { getPublishedPostsByTag } from '@shinefold/service/features/entities/posts/adaptor/tag-scoped-published/loader';
import { MOCK_TAG_ID } from '@shinefold/service/testing/entities/fixtures';
import { MOCK_POST_ID } from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { createPostsService } from './service';

vi.mock(
  '@shinefold/service/features/entities/posts/adaptor/get-by-ids/loader',
  () => ({
    getPostsByIds: vi.fn(),
  }),
);

vi.mock(
  '@shinefold/service/features/entities/posts/adaptor/get-published-at/loader',
  () => ({
    getPostPublishedAt: vi.fn(),
  }),
);

vi.mock(
  '@shinefold/service/features/entities/posts/adaptor/all-published/loader',
  () => ({
    getAllPublishedPosts: vi.fn(),
  }),
);

vi.mock(
  '@shinefold/service/features/entities/posts/adaptor/tag-scoped-published/loader',
  () => ({
    getPublishedPostsByTag: vi.fn(),
  }),
);

faker.seed(6104);

const MOCK_POST_IDS = [faker.string.uuid(), faker.string.uuid()];

describe(createPostsService, () => {
  beforeEach(() => {
    vi.mocked(getPostsByIds).mockResolvedValue([]);
    vi.mocked(getPublishedPostsByTag).mockResolvedValue([]);
    vi.mocked(getAllPublishedPosts).mockResolvedValue([]);
  });

  it('threads tenant context through to the id-list loader', async () => {
    await createPostsService().v1.getPostsByIds(MOCK_POST_IDS, MOCK_TENANT);

    expect(getPostsByIds).toHaveBeenCalledWith(MOCK_POST_IDS, MOCK_TENANT);
  });

  it('threads tenant context through to the publish-date loader', async () => {
    await createPostsService().v1.getPostPublishedAt(MOCK_POST_ID, MOCK_TENANT);

    expect(getPostPublishedAt).toHaveBeenCalledWith(MOCK_POST_ID, MOCK_TENANT);
  });

  it('threads tenant context through to the tag-scoped loader', async () => {
    await createPostsService().v1.getPublishedPostsByTag(
      MOCK_TAG_ID,
      MOCK_TENANT,
    );

    expect(getPublishedPostsByTag).toHaveBeenCalledWith(
      MOCK_TAG_ID,
      MOCK_TENANT,
    );
  });

  it('threads tenant context through to the all-published loader', async () => {
    await createPostsService().v1.getAllPublishedPosts(MOCK_TENANT);

    expect(getAllPublishedPosts).toHaveBeenCalledWith(MOCK_TENANT);
  });
});

import { getAllPublishedPosts } from '@blog/service/features/entities/posts/adaptor/all-published/loader';
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/get-by-ids/loader';
import { getPublishedPostsByTag } from '@blog/service/features/entities/posts/adaptor/tag-scoped-published/loader';
import { MOCK_TAG_ID } from '@blog/service/testing/entities/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createPostsService } from './service';

vi.mock(
  '@blog/service/features/entities/posts/adaptor/get-by-ids/loader',
  () => ({
    getPostsByIds: vi.fn(),
  }),
);

vi.mock(
  '@blog/service/features/entities/posts/adaptor/all-published/loader',
  () => ({
    getAllPublishedPosts: vi.fn(),
  }),
);

vi.mock(
  '@blog/service/features/entities/posts/adaptor/tag-scoped-published/loader',
  () => ({
    getPublishedPostsByTag: vi.fn(),
  }),
);

faker.seed(6104);

const MOCK_POST_IDS = [faker.string.uuid(), faker.string.uuid()];

const tenant = mockTenant();

describe(createPostsService, () => {
  beforeEach(() => {
    vi.mocked(getPostsByIds).mockResolvedValue([]);
    vi.mocked(getPublishedPostsByTag).mockResolvedValue([]);
    vi.mocked(getAllPublishedPosts).mockResolvedValue([]);
  });

  it('threads tenant context through to the id-list loader', async () => {
    await createPostsService().v1.getPostsByIds(MOCK_POST_IDS, tenant);

    expect(getPostsByIds).toHaveBeenCalledWith(MOCK_POST_IDS, tenant);
  });

  it('threads tenant context through to the tag-scoped loader', async () => {
    await createPostsService().v1.getPublishedPostsByTag(MOCK_TAG_ID, tenant);

    expect(getPublishedPostsByTag).toHaveBeenCalledWith(MOCK_TAG_ID, tenant);
  });

  it('threads tenant context through to the all-published loader', async () => {
    await createPostsService().v1.getAllPublishedPosts(tenant);

    expect(getAllPublishedPosts).toHaveBeenCalledWith(tenant);
  });
});

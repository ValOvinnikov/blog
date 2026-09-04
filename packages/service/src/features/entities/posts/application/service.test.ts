import { getAllPublishedPosts } from '@blog/service/features/entities/posts/adaptor/all-published/loader';
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/get-by-ids/loader';
import { getPublishedPostsByTag } from '@blog/service/features/entities/posts/adaptor/tag-scoped-published/loader';
import { getPostTaxonomySlugs } from '@blog/service/features/entities/posts/adaptor/taxonomy-by-id/loader';
import { makeTenant } from '@blog/service/testing/tenant';

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

vi.mock(
  '@blog/service/features/entities/posts/adaptor/taxonomy-by-id/loader',
  () => ({
    getPostTaxonomySlugs: vi.fn(),
  }),
);

const tenant = makeTenant();

describe(createPostsService, () => {
  it('exposes v1.getPostsByIds as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getPostsByIds).toBe('function');
  });

  it('exposes v1.getAllPublishedPosts as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getAllPublishedPosts).toBe('function');
  });

  it('exposes v1.getPublishedPostsByTag as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getPublishedPostsByTag).toBe('function');
  });

  it('exposes v1.getPostTaxonomySlugs as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getPostTaxonomySlugs).toBe('function');
  });

  it('threads tenant context through to the id-list loader', async () => {
    vi.mocked(getPostsByIds).mockResolvedValue([]);

    await createPostsService().v1.getPostsByIds(['a'], tenant);

    expect(getPostsByIds).toHaveBeenCalledWith(['a'], tenant);
  });

  it('threads tenant context through to the tag-scoped loader', async () => {
    vi.mocked(getPublishedPostsByTag).mockResolvedValue([]);

    await createPostsService().v1.getPublishedPostsByTag('tag-1', tenant);

    expect(getPublishedPostsByTag).toHaveBeenCalledWith('tag-1', tenant);
  });

  it('threads tenant context through to getAllPublishedPosts', async () => {
    vi.mocked(getAllPublishedPosts).mockResolvedValue([]);

    await createPostsService().v1.getAllPublishedPosts(tenant);

    expect(getAllPublishedPosts).toHaveBeenCalledWith(tenant);
  });

  it('threads tenant context through to getPostTaxonomySlugs', async () => {
    vi.mocked(getPostTaxonomySlugs).mockResolvedValue({
      tagSlugs: [],
      topicSlug: undefined,
    });

    await createPostsService().v1.getPostTaxonomySlugs('post-1', tenant);

    expect(getPostTaxonomySlugs).toHaveBeenCalledWith('post-1', tenant);
  });
});

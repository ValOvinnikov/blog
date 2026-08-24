import { getAllPublishedPosts } from '@blog/service/features/entities/posts/adaptor/all-published.loader';
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/loader';

import { createPostsService } from './service';

vi.mock('@blog/service/features/entities/posts/adaptor/loader', () => ({
  getPostsByIds: vi.fn(),
}));

vi.mock(
  '@blog/service/features/entities/posts/adaptor/all-published.loader',
  () => ({
    getAllPublishedPosts: vi.fn(),
  }),
);

describe(createPostsService, () => {
  it('exposes v1.getPostsByIds as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getPostsByIds).toBe('function');
  });

  it('exposes v1.getAllPublishedPosts as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getAllPublishedPosts).toBe('function');
  });

  it('calls the loader with no arguments', async () => {
    vi.mocked(getAllPublishedPosts).mockResolvedValue([]);

    await createPostsService().v1.getAllPublishedPosts();

    expect(getAllPublishedPosts).toHaveBeenCalledWith();
  });

  it('threads an optional tenant context through to the loader', async () => {
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };
    vi.mocked(getPostsByIds).mockResolvedValue([]);

    await createPostsService().v1.getPostsByIds(['a'], tenant);

    expect(getPostsByIds).toHaveBeenCalledWith(['a'], tenant);
  });
});

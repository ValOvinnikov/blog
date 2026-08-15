import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/loader';

import { createPostsService } from './service';

vi.mock('@blog/service/features/entities/posts/adaptor/loader', () => ({
  getPostsByIds: vi.fn(),
}));

describe(createPostsService, () => {
  it('exposes v1.getPostsByIds as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getPostsByIds).toBe('function');
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

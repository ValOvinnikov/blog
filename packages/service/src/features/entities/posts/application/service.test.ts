import { createPostsService } from './service';

describe('createPostsService', () => {
  it('exposes v1.getPostsByIds as a function', () => {
    const svc = createPostsService();
    expect(typeof svc.v1.getPostsByIds).toBe('function');
  });
});

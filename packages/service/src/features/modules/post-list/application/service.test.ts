import { createPostListModuleService } from './service';

describe('createPostListModuleService', () => {
  it('exposes v1.getPostList as a function', () => {
    const svc = createPostListModuleService();
    expect(typeof svc.v1.getPostList).toBe('function');
  });
});

import { createPostFeaturedModuleService } from './service';

describe('createPostFeaturedModuleService', () => {
  it('exposes v1.getPostFeatured as a function', () => {
    const svc = createPostFeaturedModuleService();
    expect(typeof svc.v1.getPostFeatured).toBe('function');
  });
});

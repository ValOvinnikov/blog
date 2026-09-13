import { createBlogService } from './service';

describe('createBlogService', () => {
  it('exposes v1.getIndexPage as a function', () => {
    const svc = createBlogService();
    expect(typeof svc.v1.getIndexPage).toBe('function');
  });

  it('exposes v1.getIndexPageParams as a function', () => {
    const svc = createBlogService();
    expect(typeof svc.v1.getIndexPageParams).toBe('function');
  });
});

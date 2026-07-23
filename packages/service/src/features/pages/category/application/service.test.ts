import { createCategoryService } from './service';

describe('createCategoryService', () => {
  it('exposes v1.getCategoryPage as a function', () => {
    const svc = createCategoryService();
    expect(typeof svc.v1.getCategoryPage).toBe('function');
  });

  it('exposes v1.getCategoryParams as a function', () => {
    const svc = createCategoryService();
    expect(typeof svc.v1.getCategoryParams).toBe('function');
  });

  it('exposes v1.getCategoryPaginationParams as a function', () => {
    const svc = createCategoryService();
    expect(typeof svc.v1.getCategoryPaginationParams).toBe('function');
  });
});

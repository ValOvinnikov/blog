import { createTagService } from './service';

describe('createTagService', () => {
  it('exposes v1.getTagPage as a function', () => {
    const svc = createTagService();
    expect(typeof svc.v1.getTagPage).toBe('function');
  });

  it('exposes v1.getTagParams as a function', () => {
    const svc = createTagService();
    expect(typeof svc.v1.getTagParams).toBe('function');
  });

  it('exposes v1.getTagPaginationParams as a function', () => {
    const svc = createTagService();
    expect(typeof svc.v1.getTagPaginationParams).toBe('function');
  });
});

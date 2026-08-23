import { createTagIndexService } from './service';

describe('createTagIndexService', () => {
  it('exposes v1.getIndexPage as a function', () => {
    const svc = createTagIndexService();
    expect(typeof svc.v1.getIndexPage).toBe('function');
  });
});

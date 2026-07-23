import { createGenericPageService } from './service';

describe('createGenericPageService', () => {
  it('exposes v1.getPage as a function', () => {
    const svc = createGenericPageService();
    expect(typeof svc.v1.getPage).toBe('function');
  });

  it('exposes v1.getPageSlugs as a function', () => {
    const svc = createGenericPageService();
    expect(typeof svc.v1.getPageSlugs).toBe('function');
  });
});

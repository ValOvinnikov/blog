import { createLandingPageService } from './service';

describe('createLandingPageService', () => {
  it('exposes v1.getPage as a function', () => {
    const svc = createLandingPageService();
    expect(typeof svc.v1.getPage).toBe('function');
  });

  it('exposes v1.getPageSlugs as a function', () => {
    const svc = createLandingPageService();
    expect(typeof svc.v1.getPageSlugs).toBe('function');
  });
});

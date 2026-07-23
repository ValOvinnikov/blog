import { createFooterService } from './service';

describe('createFooterService', () => {
  it('exposes v1.getFooter as a function', () => {
    const svc = createFooterService();
    expect(typeof svc.v1.getFooter).toBe('function');
  });
});

import { createNewsletterModuleService } from './service';

describe('createNewsletterModuleService', () => {
  it('exposes v1.getNewsletter as a function', () => {
    const svc = createNewsletterModuleService();
    expect(typeof svc.v1.getNewsletter).toBe('function');
  });
});

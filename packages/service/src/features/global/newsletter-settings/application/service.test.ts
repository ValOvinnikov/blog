import { createNewsletterSettingsService } from './service';

describe('createNewsletterSettingsService', () => {
  it('exposes v1.getNewsletterSettings as a function', () => {
    const svc = createNewsletterSettingsService();
    expect(typeof svc.v1.getNewsletterSettings).toBe('function');
  });
});

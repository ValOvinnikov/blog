import { describe, expect, it } from 'vitest';

import { createSiteSettingsService } from './service';

describe('createSiteSettingsService', () => {
  it('exposes v1.getSiteSettings as a function', () => {
    const svc = createSiteSettingsService();
    expect(typeof svc.v1.getSiteSettings).toBe('function');
  });
});

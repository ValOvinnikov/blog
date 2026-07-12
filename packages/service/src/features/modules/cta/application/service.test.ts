import { describe, expect, it } from 'vitest';

import { createCtaModuleService } from './service';

describe('createCtaModuleService', () => {
  it('exposes v1.getCta as a function', () => {
    const svc = createCtaModuleService();
    expect(typeof svc.v1.getCta).toBe('function');
  });
});

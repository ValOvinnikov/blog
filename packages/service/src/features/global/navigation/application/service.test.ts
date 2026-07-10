import { describe, expect, it } from 'vitest';

import { createNavigationService } from './service';

describe('createNavigationService', () => {
  it('exposes v1.getNavigation as a function', () => {
    const svc = createNavigationService();
    expect(typeof svc.v1.getNavigation).toBe('function');
  });
});

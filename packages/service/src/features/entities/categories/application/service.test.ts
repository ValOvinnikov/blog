import { describe, expect, it } from 'vitest';

import { createCategoriesService } from './service';

describe('createCategoriesService', () => {
  it('exposes v1.getCategories as a function', () => {
    const svc = createCategoriesService();
    expect(typeof svc.v1.getCategories).toBe('function');
  });
});

import { describe, expect, it } from 'vitest';

import { createBlogService } from './service';

describe('createBlogService', () => {
  it('exposes v1.getBlogPage as a function', () => {
    const svc = createBlogService();
    expect(typeof svc.v1.getBlogPage).toBe('function');
  });
});

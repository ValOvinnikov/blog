import { describe, expect, it } from 'vitest';

import { createPostService } from './service';

describe('createPostService', () => {
  it('exposes v1.getPost as a function', () => {
    const svc = createPostService();
    expect(typeof svc.v1.getPost).toBe('function');
  });

  it('exposes v1.getPostParams as a function', () => {
    const svc = createPostService();
    expect(typeof svc.v1.getPostParams).toBe('function');
  });
});
